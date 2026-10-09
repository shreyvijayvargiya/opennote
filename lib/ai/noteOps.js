/**
 * Note operations used by the AI assistant.
 *
 * Source of truth rule: if a note is open in a Tiptap editor we read/write the
 * LIVE editor (what the user sees, including unsaved typing). Only notes that
 * are not open fall back to IndexedDB.
 */
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TiptapImage from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import { noteService } from "../db/noteService";

const USER_ID = "local-user";

/* ------------------------------------------------------------------ */
/* Live editor registry (filled by TiptapEditor via onCreate/onDestroy) */
/* ------------------------------------------------------------------ */

const liveEditors = new Map(); // String(noteId) -> { editor, getTitle, setTitle, save }

export const registerEditor = (id, api) => liveEditors.set(String(id), api);
export const unregisterEditor = (id, api) => {
	if (liveEditors.get(String(id)) === api) liveEditors.delete(String(id));
};
export const getLiveEditor = (id) => liveEditors.get(String(id));

/* ------------------------------------------------------------------ */
/* HTML <-> Markdown (headless editor, only used for notes not open)   */
/* ------------------------------------------------------------------ */

let headless = null;
const getHeadless = () => {
	if (!headless) {
		headless = new Editor({
			extensions: [
				StarterKit,
				Table,
				TableRow,
				TableHeader,
				TableCell,
				TaskList,
				TaskItem.configure({ nested: true }),
				TiptapImage.configure({ allowBase64: true }),
				Link.configure({ autolink: false, openOnClick: false, isAllowedUri: () => true }),
				Markdown.configure({ html: true, tightLists: true, bulletListMarker: "-" }),
			],
		});
	}
	return headless;
};

const parseHtml = (html) => new DOMParser().parseFromString(html || "", "text/html");

/** Page blocks become `[Title](page://ID)` links so the model can see the hierarchy. */
export const htmlToMd = (html) => {
	const doc = parseHtml(html);
	doc.querySelectorAll('[data-type="page"],[data-type="page-inline"]').forEach((el) => {
		const a = doc.createElement("a");
		a.setAttribute("href", `page://${el.getAttribute("data-page-id") || ""}`);
		a.textContent = el.getAttribute("data-title") || "Untitled Page";
		if (el.getAttribute("data-type") === "page") {
			const p = doc.createElement("p");
			p.appendChild(a);
			el.replaceWith(p);
		} else el.replaceWith(a);
	});
	const ed = getHeadless();
	ed.commands.setContent(doc.body.innerHTML, false);
	return ed.storage.markdown.getMarkdown();
};

export const mdToHtml = (md) => {
	const ed = getHeadless();
	ed.commands.setContent(md || "", false);
	const doc = parseHtml(ed.getHTML());
	doc.querySelectorAll('a[href^="page://"]').forEach((a) => {
		const id = a.getAttribute("href").slice("page://".length);
		const title = a.textContent;
		const lone = a.parentElement?.tagName === "P" && a.parentElement.childNodes.length === 1;
		const el = doc.createElement(lone ? "div" : "span");
		el.setAttribute("data-type", lone ? "page" : "page-inline");
		el.setAttribute("data-page-id", id);
		el.setAttribute("data-title", title);
		(lone ? a.parentElement : a).replaceWith(el);
	});
	return doc.body.innerHTML;
};

/* Base64 images would explode the token count: swap them for short refs. */
const IMG_RE = /data:image\/[a-z+.-]+;base64,[A-Za-z0-9+/=]+/g;
const imageRefs = new Map(); // noteId -> string[]

const maskImages = (id, md) => {
	const refs = [];
	const text = md.replace(IMG_RE, (m) => `opennote-image://${refs.push(m) - 1}`);
	imageRefs.set(String(id), refs);
	return text;
};
const unmaskImages = (id, md) => {
	const refs = imageRefs.get(String(id)) || [];
	return md.replace(/opennote-image:\/\/(\d+)/g, (m, i) => refs[i] || m);
};

/* ------------------------------------------------------------------ */
/* Read / write                                                        */
/* ------------------------------------------------------------------ */

export const estimateTokens = (text) => Math.ceil((text || "").length / 4);

/** Returns { id, title, markdown, html, live } for a note, or null. */
export const readNote = async (id) => {
	const live = getLiveEditor(id);
	if (live) {
		const md = live.editor.storage.markdown.getMarkdown();
		return {
			id: String(id),
			title: live.getTitle(),
			markdown: maskImages(id, md),
			html: live.editor.getHTML(),
			live: true,
		};
	}
	const note = await noteService.getNote(id);
	if (!note) return null;
	return {
		id: String(note.id),
		title: note.title || "Untitled",
		markdown: maskImages(note.id, htmlToMd(note.content)),
		html: note.content || "",
		live: false,
	};
};

/** Replace or append Markdown content / title. Returns the snapshot taken BEFORE the change. */
export const updateNote = async (id, { title, content, mode = "replace" }) => {
	const before = await readNote(id);
	if (!before) throw new Error(`Note ${id} not found`);
	const body = content != null ? unmaskImages(id, content) : null;
	const live = getLiveEditor(id);

	if (live) {
		const { editor } = live;
		if (body != null) {
			if (mode === "append") {
				editor.chain().insertContentAt(editor.state.doc.content.size, `\n\n${body}`).run();
			} else {
				editor.commands.setContent(body, true);
			}
		}
		if (title != null) live.setTitle(title);
		await live.save();
	} else {
		const note = await noteService.getNote(id);
		let html = note.content || "";
		if (body != null) {
			html = mode === "append" ? html + mdToHtml(body) : mdToHtml(body);
		}
		await noteService.saveNote(USER_ID, {
			...note,
			title: title ?? note.title,
			content: html,
		});
	}
	return { title: before.title, html: before.html };
};

/** Restore a pre-change snapshot (HTML is the exact editor state, so page blocks survive). */
export const restoreNote = async (id, snapshot) => {
	const live = getLiveEditor(id);
	if (live) {
		live.editor.commands.setContent(snapshot.html || "", true);
		live.setTitle(snapshot.title);
		await live.save();
		return;
	}
	const note = await noteService.getNote(id);
	if (!note) return;
	await noteService.saveNote(USER_ID, {
		...note,
		title: snapshot.title,
		content: snapshot.html,
	});
};

export const createNote = async ({ title, content, parentId, isFolder }) => {
	const html = content ? mdToHtml(content) : "<p></p>";
	const note = await noteService.saveNote(USER_ID, {
		title: title || "Untitled",
		content: html,
		parentId: parentId ?? undefined,
		isFolder: Boolean(isFolder),
	});
	return note;
};

export const deleteNote = (id) => noteService.deleteNote(id);

/* ------------------------------------------------------------------ */
/* Workspace structure + tagged context                                */
/* ------------------------------------------------------------------ */

/** Indented tree so the model understands files/folders/nested pages. */
export const buildOutline = (notes, { activeId, openIds = [] } = {}, maxLines = 150) => {
	const ids = new Set(notes.map((n) => n.id));
	const kids = new Map();
	for (const n of notes) {
		const parent = n.parentId != null && ids.has(n.parentId) ? n.parentId : null;
		if (!kids.has(parent)) kids.set(parent, []);
		kids.get(parent).push(n);
	}
	const lines = [];
	const walk = (parent, depth) => {
		for (const n of (kids.get(parent) || []).sort((a, b) => a.id - b.id)) {
			if (lines.length >= maxLines) return;
			const hasKids = (kids.get(n.id) || []).length > 0;
			const kind = n.isFolder ? "folder" : hasKids ? "page+children" : "page";
			const tags = [
				n.id === activeId ? "ACTIVE" : null,
				openIds.includes(n.id) ? "open" : null,
			].filter(Boolean);
			lines.push(
				`${"  ".repeat(depth)}- [${n.id}] ${n.title || "Untitled"} (${kind}${tags.length ? ", " + tags.join(", ") : ""})`,
			);
			walk(n.id, depth + 1);
		}
	};
	walk(null, 0);
	if (lines.length >= maxLines) lines.push("- … (tree truncated)");
	return lines.join("\n") || "(no notes yet)";
};

const outlineOf = (md) =>
	md
		.split("\n")
		.filter((l) => /^#{1,3}\s/.test(l))
		.slice(0, 12)
		.join(" | ");

/**
 * Tagged notes + selections are injected into the prompt, capped at
 * `maxTokens` IN TOTAL. Budget is shared fairly (short items keep everything),
 * long items are trimmed and get a heading outline as a cheap summary.
 */
export const buildContext = (items, maxTokens = 2000) => {
	if (!items.length) return "";
	let budget = maxTokens * 4; // chars
	const order = items.map((it, i) => i).sort((a, b) => items[a].text.length - items[b].text.length);
	const allowance = new Array(items.length).fill(0);
	let left = order.length;
	for (const i of order) {
		const share = Math.floor(budget / left--);
		allowance[i] = Math.min(items[i].text.length, share);
		budget -= allowance[i];
	}
	const parts = items.map((it, i) => {
		let text = it.text;
		let note = "";
		if (text.length > allowance[i]) {
			const outline = it.kind === "note" ? outlineOf(text) : "";
			const keep = Math.max(0, allowance[i] - outline.length - 40);
			text = text.slice(0, keep);
			note = `\n[trimmed to fit the ${maxTokens}-token context cap${outline ? `; headings: ${outline}` : ""}. Use read_note for the full text.]`;
		}
		const attrs = it.kind === "selection"
			? `note_id="${it.noteId}" title="${it.title}"`
			: `id="${it.noteId}" title="${it.title}"`;
		return `<${it.kind} ${attrs}>\n${text}${note}\n</${it.kind}>`;
	});
	return `<context>\n${parts.join("\n")}\n</context>`;
};
