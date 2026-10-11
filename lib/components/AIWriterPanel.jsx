import React, { useEffect, useRef, useState } from "react";
import { Check, Circle, Sparkles, SquarePen, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AI_MODELS } from "../ai/models";
import { EMPTY_STATE_ACTIONS, findWriterAction, WRITER_ACTIONS } from "../ai/actions";
import { getEditorContext } from "../ai/editorContext";
import {
	copyText,
	insertAtCursor,
	replaceDocument,
	replaceSelection,
} from "../ai/editorActions";
import { executeLocalTool } from "../ai/localTools";
import { streamAIChat } from "../ai/streamChat";
import { MAX_TOOL_ROUNDS } from "../ai/limits";
import { aiChatService } from "../db/aiChatService";
import AIHistoryMenu from "./AIHistoryMenu";
import AIMessage from "./AIMessage";
import AIInput from "./AIInput";

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const handledAIRequests = new Set();

const TOOL_STATUS = {
	list_notes: "Looking through your notes…",
	get_note: "Reading a note…",
	update_note: "Updating the note…",
	insert_content: "Inserting into the note…",
	replace_selection: "Replacing the selection…",
	create_note: "Creating a note…",
	delete_note: "Preparing to delete…",
};

const AIWriterPanel = ({
	editor,
	editorControlsRef,
	activeNote,
	onClose,
	pendingRequest,
	focusTick,
	onActiveDeleted,
}) => {
	const [messages, setMessages] = useState([]);
	const [chatId, setChatId] = useState(null);
	const [chats, setChats] = useState([]);
	const [input, setInput] = useState("");
	const [mode, setMode] = useState("ask");
	const [model, setModel] = useState(AI_MODELS[0].id);
	const [images, setImages] = useState([]);
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState("");
	const [historyOpen, setHistoryOpen] = useState(false);
	const [contextOpen, setContextOpen] = useState(false);
	const [selection, setSelection] = useState(null);
	const [selectionDismissed, setSelectionDismissed] = useState(false);
	const [confirm, setConfirm] = useState(null);
	const [hydratedNoteId, setHydratedNoteId] = useState(null);
	const [imageError, setImageError] = useState("");

	const inputRef = useRef(null);
	const scrollRef = useRef(null);
	const abortRef = useRef(null);
	const confirmResolveRef = useRef(null);
	const messagesRef = useRef([]);
	const editorRef = useRef(editor);
	const noteRef = useRef(activeNote);
	const chatIdRef = useRef(chatId);
	const modelRef = useRef(model);
	const modeRef = useRef(mode);
	editorRef.current = editor;
	noteRef.current = activeNote;
	chatIdRef.current = chatId;
	modelRef.current = model;
	modeRef.current = mode;
	messagesRef.current = messages;

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
			confirmResolveRef.current?.(false);
		};
	}, []);

	useEffect(() => {
		const instance = editor;
		if (!instance) {
			setSelection(null);
			return undefined;
		}
		const update = () => {
			const next = getEditorContext(instance).selection;
			setSelection((prev) => {
				if (
					prev?.from === next?.from &&
					prev?.to === next?.to &&
					prev?.text === next?.text
				) {
					return prev;
				}
				return next;
			});
			if (next?.text) setSelectionDismissed(false);
		};
		instance.on("selectionUpdate", update);
		update();
		return () => {
			instance.off("selectionUpdate", update);
		};
	}, [editor]);

	useEffect(() => {
		let cancelled = false;
		abortRef.current?.abort();
		confirmResolveRef.current?.(false);
		setBusy(false);
		setStatus("");
		setMessages([]);
		setChatId(null);
		chatIdRef.current = null;
		setSelectionDismissed(false);
		setHydratedNoteId(null);
		setImages([]);
		setInput("");
		if (!activeNote?.id) {
			setChats([]);
			return undefined;
		}
		const noteId = activeNote.id;
		aiChatService.listByNote(noteId).then((list) => {
			if (cancelled) return;
			if (chatIdRef.current) {
				setChats((prev) => {
					const ids = new Set(prev.map((chat) => chat.id));
					return [...prev, ...list.filter((chat) => !ids.has(chat.id))].sort(
						(a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
					);
				});
				setHydratedNoteId(noteId);
				return;
			}
			setChats(list);
			const latest = list[0];
			if (latest) {
				setChatId(latest.id);
				chatIdRef.current = latest.id;
				setMessages(latest.messages || []);
				if (latest.model) setModel(latest.model);
				if (latest.mode) setMode(latest.mode);
			}
			setHydratedNoteId(noteId);
		});
		return () => {
			cancelled = true;
		};
	}, [activeNote?.id]);

	useEffect(() => {
		if (!chatId || hydratedNoteId !== activeNote?.id) return undefined;
		const title =
			messages.find((message) => message.role === "user")?.content?.slice(0, 48) ||
			"New chat";
		const handle = setTimeout(() => {
			aiChatService
				.save({
					id: chatId,
					title,
					messages,
					model,
					mode,
				})
				.then(() => {
					setChats((prev) =>
						prev
							.map((chat) =>
								chat.id === chatId
									? { ...chat, title, messages, model, mode, updatedAt: Date.now() }
									: chat,
							)
							.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
					);
				})
				.catch(() => {
					setImageError("Could not save this chat locally.");
				});
		}, 400);
		return () => clearTimeout(handle);
	}, [chatId, messages, model, mode, hydratedNoteId, activeNote?.id]);

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
	}, [messages, status, confirm]);

	useEffect(() => {
		inputRef.current?.focus();
	}, [focusTick, activeNote?.id]);

	const hasSelection = Boolean(selection?.text) && !selectionDismissed;

	const buildPayloadContext = () => {
		const currentEditor = editorRef.current;
		const note = noteRef.current;
		const context = getEditorContext(currentEditor);
		const title = editorControlsRef?.current?.getTitle?.() || note?.title || "Untitled";
		const useSelection = context.selection && !selectionDismissed;
		return {
			note: note
				? {
						id: note.id,
						title,
						html: context.html || note.content || "",
						text: context.text || "",
						updatedAt: note.updatedAt || null,
					}
				: null,
			selection: useSelection
				? {
						text: context.selection.text,
						from: context.selection.from,
						to: context.selection.to,
						nearby: context.nearby,
					}
				: null,
		};
	};

	const askConfirm = (options) =>
		new Promise((resolve) => {
			const finish = (value) => {
				confirmResolveRef.current = null;
				setConfirm(null);
				resolve(value);
			};
			confirmResolveRef.current = finish;
			setConfirm({
				...options,
				resolve: finish,
			});
		});

	const updateAssistant = (id, content, activity) => {
		setMessages((prev) =>
			prev.map((message) =>
				message.id === id ? { ...message, content, activity } : message,
			),
		);
	};

	const sendMessage = async (rawText, extras = {}) => {
		const text = String(rawText || "").trim();
		if (!text || busy) return;
		if (!noteRef.current) {
			setMessages((prev) => [
				...prev,
				{
					id: makeId(),
					role: "error",
					content: "Open a note before asking the writer.",
					createdAt: Date.now(),
				},
			]);
			return;
		}

		const intent = extras.intent || (mode === "edit" ? "edit" : mode);
		const requestMode = extras.mode || mode;
		if (extras.mode) setMode(extras.mode);
		const outgoingImages = extras.images || images;
		const userMessage = {
			id: makeId(),
			role: "user",
			content: text,
			images: outgoingImages,
			intent,
			createdAt: Date.now(),
		};
		const assistantId = makeId();
		const assistantMessage = {
			id: assistantId,
			role: "assistant",
			content: "",
			intent,
			activity: [],
			createdAt: Date.now(),
		};

		const historyForApi = [...messagesRef.current, userMessage].filter(
			(message) => message.role === "user" || message.role === "assistant",
		);
		setMessages((prev) => [...prev, userMessage, assistantMessage]);
		setInput("");
		setImages([]);
		setImageError("");
		setBusy(true);
		setStatus("Thinking...");

		let storedChatId = chatIdRef.current;
		if (!storedChatId) {
			try {
				const created = await aiChatService.create(
					noteRef.current.id,
					text.slice(0, 48),
				);
				storedChatId = created.id;
				chatIdRef.current = created.id;
				setChatId(created.id);
				setChats((prev) => [created, ...prev]);
				setHydratedNoteId(noteRef.current.id);
			} catch {
				setBusy(false);
				setStatus("");
				setMessages((prev) =>
					prev.map((message) =>
						message.id === assistantId
							? {
									...message,
									role: "error",
									content: "Could not save this chat locally.",
								}
							: message,
					),
				);
				return;
			}
		}

		const controller = new AbortController();
		abortRef.current = controller;
		const working = historyForApi.map((message) => ({
			role: message.role,
			content: message.content,
			images: message.images,
		}));
		let assembled = "";
		let activity = [];

		try {
			for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
				const context = buildPayloadContext();
				const result = await streamAIChat(
					{
						model: modelRef.current,
						mode: requestMode,
						note: context.note,
						selection: context.selection,
						messages: working,
					},
					{
						signal: controller.signal,
						onDelta: (chunk) => {
							updateAssistant(assistantId, `${assembled}${chunk}`, activity);
						},
					},
				);
				assembled += result.text || "";
				if (result.toolCalls?.length && assembled.trim() && !assembled.endsWith("\n\n")) {
					assembled = `${assembled.trim()}\n\n`;
				}
				updateAssistant(assistantId, assembled, activity);
				if (!result.toolCalls?.length) break;
				if (round === MAX_TOOL_ROUNDS - 1) break;
				working.push({
					role: "assistant",
					content: result.text || "",
					toolCalls: result.toolCalls,
				});
				for (const call of result.toolCalls) {
					setStatus(TOOL_STATUS[call.name] || "Working on the note…");
					const output = await executeLocalTool(call, {
						editor: editorRef.current,
						activeNoteId: noteRef.current?.id,
						setTitle: (value) => editorControlsRef?.current?.setTitle?.(value),
						saveNow: () => editorControlsRef?.current?.saveNow?.(),
						confirm: askConfirm,
						onActiveDeleted,
					});
					activity = [...activity, output.summary || output.error || call.name].filter(Boolean);
					updateAssistant(assistantId, assembled, activity);
					working.push({
						role: "tool",
						toolCallId: call.id,
						content: JSON.stringify(output),
					});
				}
				setStatus("Thinking...");
			}
			if (!assembled.trim() && activity.length === 0) {
				updateAssistant(assistantId, "The model returned an empty response.", activity);
				setMessages((prev) =>
					prev.map((message) =>
						message.id === assistantId ? { ...message, role: "error" } : message,
					),
				);
			}
		} catch (error) {
			if (error?.name === "AbortError") {
				if (!assembled.trim()) {
					setMessages((prev) => prev.filter((message) => message.id !== assistantId));
				}
			} else {
				const message = error?.message || "The AI request failed.";
				setMessages((prev) =>
					prev.map((item) =>
						item.id === assistantId
							? {
									...item,
									role: assembled.trim() ? "assistant" : "error",
									content: assembled.trim() ? assembled : message,
								}
							: item,
					),
				);
				if (assembled.trim()) {
					setMessages((prev) => [
						...prev,
						{ id: makeId(), role: "error", content: message, createdAt: Date.now() },
					]);
				}
			}
		} finally {
			setBusy(false);
			setStatus("");
			abortRef.current = null;
		}
	};

	useEffect(() => {
		if (!pendingRequest || handledAIRequests.has(pendingRequest.id)) return;
		handledAIRequests.add(pendingRequest.id);
		if (pendingRequest.action === "open") {
			inputRef.current?.focus();
			return;
		}
		const action = findWriterAction(pendingRequest.action);
		if (!action) return;
		sendMessage(action.prompt, action);
	}, [pendingRequest]);

	const clearSelectionContext = () => {
		setSelectionDismissed(true);
		const instance = editorRef.current;
		if (!instance) return;
		const position = instance.state.selection.to;
		instance.commands.setTextSelection(position);
	};

	const applyInsert = (message) => {
		const ok = insertAtCursor(editorRef.current, message.content);
		if (!ok) toast.error("Open the note to insert this.");
		else editorControlsRef?.current?.saveNow?.();
	};

	const applyReplaceSelection = (message) => {
		const ok = replaceSelection(editorRef.current, message.content);
		if (!ok) toast.error("Select text in the note first.");
		else editorControlsRef?.current?.saveNow?.();
	};

	const applyCopy = async (message) => {
		try {
			await copyText(message.content);
			toast.success("Copied");
		} catch {
			toast.error("Could not copy that response.");
		}
	};

	const applyReplaceDocument = async (message) => {
		const confirmed = await askConfirm({
			title: "Replace the current document with this version?",
			body: "You can undo this in the editor.",
			confirmLabel: "Replace",
		});
		if (!confirmed) return;
		const ok = replaceDocument(editorRef.current, message.content);
		if (!ok) toast.error("Open the note to replace it.");
		else editorControlsRef?.current?.saveNow?.();
	};

	const startNewChat = async () => {
		if (!activeNote?.id || busy) return;
		const created = await aiChatService.create(activeNote.id);
		setChatId(created.id);
		setMessages([]);
		setChats((prev) => [created, ...prev]);
		setHistoryOpen(false);
		inputRef.current?.focus();
	};

	const clearConversation = async () => {
		setMessages([]);
		if (chatId) {
			await aiChatService.save({
				id: chatId,
				title: "New chat",
				messages: [],
				model,
				mode,
			});
		}
	};

	const selectChat = (chat) => {
		if (busy) return;
		setChatId(chat.id);
		setMessages(chat.messages || []);
		if (chat.model) setModel(chat.model);
		if (chat.mode) setMode(chat.mode);
		setHistoryOpen(false);
	};

	const deleteChat = async (id) => {
		await aiChatService.remove(id);
		const next = chats.filter((chat) => chat.id !== id);
		setChats(next);
		if (chatId === id) {
			const fallback = next[0];
			setChatId(fallback?.id || null);
			setMessages(fallback?.messages || []);
		}
	};

	const noteTitle =
		editorControlsRef?.current?.getTitle?.() || activeNote?.title || "Untitled";

	return (
		<>
			<button
				type="button"
				className="fixed inset-0 z-40 bg-black/40 md:hidden"
				onClick={onClose}
				aria-label="Close AI Writer"
			/>
			<aside className="fixed bottom-2 right-2 top-2 z-50 flex w-[min(360px,calc(100%-1rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:static md:z-auto md:my-2 md:mr-2 md:h-[calc(100%-1rem)] md:w-[360px] md:shrink-0">
				<div className="shrink-0 border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0">
							<div className="flex items-center gap-1.5">
								<Sparkles className="h-3.5 w-3.5 text-zinc-500" />
								<h2 className="text-sm font-semibold tracking-tight">AI Writer</h2>
							</div>
							<p className="mt-0.5 text-[11px] text-zinc-400">
								Works with your current note
							</p>
						</div>
						<div className="flex items-center">
							<AIHistoryMenu
								open={historyOpen}
								chats={chats}
								currentId={chatId}
								onToggle={setHistoryOpen}
								onSelect={selectChat}
								onDelete={deleteChat}
							/>
							<button
								type="button"
								onClick={startNewChat}
								className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
								title="New chat"
							>
								<SquarePen className="h-3.5 w-3.5" />
							</button>
							<button
								type="button"
								onClick={clearConversation}
								className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
								title="Clear conversation"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</button>
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
								title="Close"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>

					<label className="mt-2 block">
						<span className="sr-only">Model</span>
						<select
							value={model}
							onChange={(event) => setModel(event.target.value)}
							className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-600 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
						>
							{AI_MODELS.map((item) => (
								<option key={item.id} value={item.id}>
									{item.label}
								</option>
							))}
						</select>
					</label>

					{activeNote && (
						<p className="mt-2 truncate text-[11px] text-zinc-500">
							Working with: “{noteTitle}”
						</p>
					)}

					<div className="mt-2 flex items-center justify-between gap-2">
						{hasSelection ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
								Using selected text
								<button
									type="button"
									onClick={clearSelectionContext}
									className="rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800"
									title="Clear selection context"
								>
									<X className="h-2.5 w-2.5" />
								</button>
							</span>
						) : (
							<span className="text-[10px] font-medium text-zinc-400">
								Using current document
							</span>
						)}
						<button
							type="button"
							onClick={() => setContextOpen((open) => !open)}
							className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
						>
							Context
						</button>
					</div>
					{contextOpen && (
						<ul className="mt-2 space-y-1 text-[11px] text-zinc-500">
							<li className="flex items-center gap-1.5">
								<Check className="h-3 w-3" /> Current document
							</li>
							<li className="flex items-center gap-1.5">
								{hasSelection ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
								Selected text
							</li>
							<li className="flex items-center gap-1.5 text-zinc-300 dark:text-zinc-600">
								<Circle className="h-3 w-3" /> Previous notes
							</li>
						</ul>
					)}
				</div>

				<div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
					{messages.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center px-4 text-center">
							<Sparkles className="mb-3 h-5 w-5 text-zinc-400" />
							<p className="text-sm font-semibold">AI Writer</p>
							<p className="mt-1 max-w-[220px] text-xs text-zinc-400">
								Write with your notes, not around them.
							</p>
							<div className="mt-4 flex flex-col gap-1.5">
								{EMPTY_STATE_ACTIONS.map((id) => {
									const action = WRITER_ACTIONS.find((item) => item.id === id);
									if (!action) return null;
									return (
										<button
											key={action.id}
											type="button"
											disabled={busy}
											onClick={() => sendMessage(action.prompt, action)}
											className="rounded-xl border border-zinc-200 px-3 py-2 text-[11px] text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
										>
											{action.emptyLabel || action.label}
										</button>
									);
								})}
							</div>
						</div>
					) : (
						<div className="space-y-4">
							{messages.map((message) => (
								<AIMessage
									key={message.id}
									message={message}
									hasSelection={hasSelection}
									onInsert={applyInsert}
									onReplaceSelection={applyReplaceSelection}
									onCopy={applyCopy}
									onReplaceDocument={applyReplaceDocument}
								/>
							))}
						</div>
					)}
				</div>

				{busy && (
					<div className="flex items-center justify-between px-4 pb-1 text-[11px] text-zinc-500">
						<span>✦ {status || "Thinking..."}</span>
					</div>
				)}
				{imageError && (
					<p className="px-4 pb-1 text-[11px] text-zinc-500">{imageError}</p>
				)}
				{confirm && (
					<div className="mx-3 mb-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
						<p className="text-xs font-medium">{confirm.title}</p>
						<p className="mt-1 text-[11px] text-zinc-500">{confirm.body}</p>
						<div className="mt-3 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => confirm.resolve(false)}
								className="rounded-lg px-2.5 py-1 text-[11px] text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => confirm.resolve(true)}
								className="rounded-lg bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
							>
								{confirm.confirmLabel || "Replace"}
							</button>
						</div>
					</div>
				)}

				<AIInput
					inputRef={inputRef}
					value={input}
					onChange={setInput}
					onSubmit={() => sendMessage(input)}
					disabled={busy}
					busy={busy}
					mode={mode}
					onMode={setMode}
					onQuickAction={(action) => sendMessage(action.prompt, action)}
					images={images}
					onImages={setImages}
					onError={setImageError}
					onStop={() => abortRef.current?.abort()}
				/>
			</aside>
		</>
	);
};

export default AIWriterPanel;
