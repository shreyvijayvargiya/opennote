/**
 * useChat — the whole AI chat in one hook (no useEffect anywhere).
 *
 *  - chat history in IndexedDB (Dexie `chats`), capped for speed
 *  - OpenRouter streaming + a small tool loop (read / create / update / delete)
 *  - tagged notes are read from the live Tiptap editor, trimmed to a 2k-token cap
 *  - edits are applied immediately and can be Kept or Undone from the chat
 *  - deletions wait for an explicit confirmation
 */
import { useCallback, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/localDb";
import { DEFAULT_MODEL, streamCompletion } from "./openrouter";
import { TOOLS, executeTool } from "./tools";
import {
	buildContext,
	buildOutline,
	deleteNote,
	readNote,
	restoreNote,
} from "./noteOps";

/* Tune these to taste ------------------------------------------------ */
export const MAX_CHATS = 10; // chats kept in IndexedDB (oldest are pruned)
export const MAX_MESSAGES = 50; // messages kept per chat
export const CONTEXT_TOKEN_CAP = 2000; // tagged notes + selections, in total
const CSV_MAX_CHARS = 8000; // ≈ 2k tokens
const HISTORY_SENT = 20; // previous messages sent back to the model
const MAX_STEPS = 6; // tool-loop iterations per reply

const SYSTEM_PROMPT = (outline, activeNote) => `You are the assistant inside OpenNote, a local-first notes app.
Notes are Markdown documents. They live in a tree: a note can have child pages, and a folder is a note that groups others.
A link like [Title](page://12) inside a note is a nested child page with id 12.

Workspace tree ([id] title (kind, flags)):
${outline}

${activeNote ? `The user is currently looking at [${activeNote.id}] "${activeNote.title}".` : "No note is open."}

Rules:
- Use read_note before rewriting a note; prefer update_note with mode "append" for additions.
- Only use ids from the tree above. Never invent ids.
- Tagged notes appear in <context> blocks (possibly trimmed). Use read_note for the full text.
- Write note content as Markdown. Keep answers short and concrete.
- After changing notes, say briefly what you changed. The user can Keep or Undo each change.`;

const slimAttachment = (a) => ({
	id: a.id,
	name: a.name,
	kind: a.kind,
	size: a.size,
	...(a.kind === "image" ? { thumb: a.thumb } : {}),
});

const forStorage = (messages) =>
	messages.slice(-MAX_MESSAGES).map(({ _api, ...m }) => ({
		...m,
		attachments: m.attachments?.map(slimAttachment),
	}));

export function useChat({ notes, activeNoteId, openIds }) {
	const [chatId, setChatIdState] = useState(null);
	const [messages, setMessagesState] = useState([]);
	const [status, setStatus] = useState("idle"); // idle | streaming
	const [confirmReq, setConfirmReq] = useState(null);
	const [historyOpen, setHistoryOpen] = useState(false);

	const chatIdRef = useRef(null);
	const messagesRef = useRef([]);
	const abortRef = useRef(null);

	const settings = useLiveQuery(
		() => db.settings.bulkGet(["openrouterKey", "model"]),
		[],
	);
	const apiKey = settings?.[0]?.value || "";
	const model = settings?.[1]?.value || DEFAULT_MODEL;

	// Only read chat history while the dropdown is open (keeps IndexedDB reads cheap).
	const history = useLiveQuery(
		() =>
			historyOpen
				? db.chats
						.orderBy("updatedAt")
						.reverse()
						.toArray()
						.then((all) =>
							all.map((c) => ({
								id: c.id,
								title: c.title,
								updatedAt: c.updatedAt,
								count: c.messages.length,
							})),
						)
				: [],
		[historyOpen],
	);

	const setChatId = (id) => {
		chatIdRef.current = id;
		setChatIdState(id);
	};
	const setMessages = useCallback((updater) => {
		const next =
			typeof updater === "function" ? updater(messagesRef.current) : updater;
		messagesRef.current = next;
		setMessagesState(next);
	}, []);

	/* ---------------- persistence ---------------- */

	const persist = async (titleHint) => {
		const stored = forStorage(messagesRef.current);
		if (chatIdRef.current) {
			await db.chats.update(chatIdRef.current, {
				messages: stored,
				updatedAt: Date.now(),
			});
			return;
		}
		const now = Date.now();
		const id = await db.chats.add({
			title: (titleHint || "New chat").slice(0, 48),
			createdAt: now,
			updatedAt: now,
			messages: stored,
		});
		setChatId(id);
		const keys = await db.chats.orderBy("updatedAt").primaryKeys();
		if (keys.length > MAX_CHATS) {
			await db.chats.bulkDelete(keys.slice(0, keys.length - MAX_CHATS));
		}
	};

	/* ---------------- settings ---------------- */

	const saveApiKey = (key) =>
		key.trim()
			? db.settings.put({ key: "openrouterKey", value: key.trim() })
			: db.settings.delete("openrouterKey");
	const setModel = (id) => db.settings.put({ key: "model", value: id });

	/* ---------------- chat management ---------------- */

	const stop = () => {
		abortRef.current?.abort();
		confirmReq?.resolve(false);
		setConfirmReq(null);
	};

	const newChat = () => {
		stop();
		setChatId(null);
		setMessages([]);
		setStatus("idle");
	};

	const openChat = async (id) => {
		stop();
		const chat = await db.chats.get(id);
		if (!chat) return;
		setChatId(id);
		setMessages(chat.messages);
		setStatus("idle");
	};

	const deleteChat = async (id) => {
		await db.chats.delete(id);
		if (id === chatIdRef.current) newChat();
	};

	const clearChats = async () => {
		await db.chats.clear();
		newChat();
	};

	/* ---------------- Keep / Undo ---------------- */

	const resolveChange = async (messageId, changeId, action) => {
		const msg = messagesRef.current.find((m) => m.id === messageId);
		const change = msg?.changes?.find((c) => c.id === changeId);
		if (!change || change.status !== "pending") return;
		if (action === "undo") {
			if (change.kind === "create") {
				await deleteNote(change.noteId).catch(() => {});
			} else if (change.kind === "update" && change.before) {
				await restoreNote(change.noteId, change.before);
			}
		}
		const status = action === "undo" ? "undone" : "kept";
		setMessages((prev) =>
			prev.map((m) =>
				m.id !== messageId
					? m
					: {
							...m,
							changes: m.changes.map((c) =>
								c.id === changeId ? { ...c, status } : c,
							),
						},
			),
		);
		await persist();
	};

	/* ---------------- send ---------------- */

	const send = async ({ text, attachments = [], mentions = [], selections = [] }) => {
		if (status !== "idle" || (!text.trim() && !attachments.length)) return;
		if (!apiKey) return;

		// 1. Snapshot of the context RIGHT NOW (live editors, not the last IndexedDB save).
		const contextItems = [];
		for (const m of mentions) {
			const note = await readNote(m.id);
			if (note) {
				contextItems.push({
					kind: "note",
					noteId: note.id,
					title: note.title,
					text: note.markdown,
				});
			}
		}
		for (const s of selections) {
			contextItems.push({
				kind: "selection",
				noteId: s.noteId,
				title: s.title,
				text: s.text,
			});
		}
		const contextBlock = buildContext(contextItems, CONTEXT_TOKEN_CAP);

		const csvBlocks = attachments
			.filter((a) => a.kind === "csv")
			.map(
				(a) =>
					`<attachment name="${a.name}" type="csv">\n${a.text.slice(0, CSV_MAX_CHARS)}${a.text.length > CSV_MAX_CHARS ? "\n[…rows trimmed]" : ""}\n</attachment>`,
			)
			.join("\n");

		const parts = [
			{
				type: "text",
				text: [contextBlock, csvBlocks, text].filter(Boolean).join("\n\n"),
			},
			...attachments
				.filter((a) => a.kind === "image")
				.map((a) => ({ type: "image_url", image_url: { url: a.dataUrl } })),
			...attachments
				.filter((a) => a.kind === "pdf")
				.map((a) => ({
					type: "file",
					file: { filename: a.name, file_data: a.dataUrl },
				})),
		];
		const plugins = attachments.some((a) => a.kind === "pdf")
			? [{ id: "file-parser", pdf: { engine: "pdf-text" } }]
			: undefined;

		const userMessage = {
			id: uuidv4(),
			role: "user",
			content: text,
			createdAt: Date.now(),
			attachments,
			contexts: contextItems.map((c) => ({
				kind: c.kind,
				noteId: c.noteId,
				title: c.title,
			})),
		};
		const assistant = {
			id: uuidv4(),
			role: "assistant",
			content: "",
			createdAt: Date.now(),
			activity: [],
			changes: [],
		};
		const prior = messagesRef.current.slice(-HISTORY_SENT).map((m) => ({
			role: m.role,
			content: [
				m.content,
				...(m.attachments?.length
					? [`[attached: ${m.attachments.map((a) => a.name).join(", ")}]`]
					: []),
				...(m.changes?.length
					? [
							`[actions: ${m.changes.map((c) => `${c.kind} “${c.title}” (id ${c.noteId}, ${c.status})`).join("; ")}]`,
						]
					: []),
			]
				.filter(Boolean)
				.join("\n"),
		}));

		setMessages((prev) => [...prev, userMessage, assistant]);
		setStatus("streaming");
		const controller = new AbortController();
		abortRef.current = controller;
		await persist(text || attachments[0]?.name);

		const active = notes.find((n) => n.id === activeNoteId);
		const apiMessages = [
			{
				role: "system",
				content: SYSTEM_PROMPT(buildOutline(notes, { activeId: activeNoteId, openIds }), active),
			},
			...prior,
			{ role: "user", content: parts },
		];

		const patch = (fn) =>
			setMessages((prev) => prev.map((m) => (m.id === assistant.id ? fn(m) : m)));

		try {
			let streamed = "";
			for (let step = 0; step < MAX_STEPS; step++) {
				const base = streamed;
				const { content, toolCalls } = await streamCompletion({
					apiKey,
					model,
					messages: apiMessages,
					tools: TOOLS,
					plugins,
					signal: controller.signal,
					onText: (t) => patch((m) => ({ ...m, content: base + t })),
				});
				streamed = base + content + (content && toolCalls.length ? "\n\n" : "");
				if (!toolCalls.length) break;

				apiMessages.push({
					role: "assistant",
					content: content || null,
					tool_calls: toolCalls.map((c) => ({
						id: c.id,
						type: "function",
						function: { name: c.name, arguments: c.arguments || "{}" },
					})),
				});

				for (const call of toolCalls) {
					let outcome;
					try {
						outcome = await executeTool(call.name, JSON.parse(call.arguments || "{}"), {
							notes,
							confirmDelete: (info) =>
								new Promise((resolve) => setConfirmReq({ ...info, resolve })),
						});
					} catch (err) {
						if (controller.signal.aborted) throw err;
						outcome = { result: `Error: ${err.message}` };
					}
					setConfirmReq(null);
					apiMessages.push({
						role: "tool",
						tool_call_id: call.id,
						content: outcome.result,
					});
					patch((m) => ({
						...m,
						activity: outcome.activity ? [...m.activity, outcome.activity] : m.activity,
						changes: outcome.change
							? [...m.changes, { id: uuidv4(), ...outcome.change }]
							: m.changes,
					}));
				}
				if (controller.signal.aborted) break;
				if (step === MAX_STEPS - 1) {
					patch((m) => ({ ...m, content: m.content + "\n\n_(stopped: too many steps)_" }));
				}
			}
		} catch (err) {
			if (!controller.signal.aborted) patch((m) => ({ ...m, error: err.message }));
		} finally {
			setStatus("idle");
			abortRef.current = null;
			await persist();
		}
	};

	return {
		// state
		messages,
		status,
		chatId,
		history: history || [],
		apiKey,
		model,
		confirmReq,
		// actions
		send,
		stop,
		newChat,
		openChat,
		deleteChat,
		clearChats,
		setHistoryOpen,
		saveApiKey,
		setModel,
		keepChange: (m, c) => resolveChange(m, c, "keep"),
		undoChange: (m, c) => resolveChange(m, c, "undo"),
		answerConfirm: (ok) => {
			confirmReq?.resolve(ok);
			setConfirmReq(null);
		},
	};
}
