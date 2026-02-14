import React from "react";
import { createPortal } from "react-dom";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const SlashDropdownPluginKey = new PluginKey("tiptap-slash-dropdown");

function findSlashMatch(state) {
	const { selection } = state;
	if (!selection || !selection.empty) return null;

	const { $from } = selection;
	if (!$from || !$from.parent || !$from.parent.isTextblock) return null;

	// Avoid showing inside nodes where slash menu doesn't make sense
	const parentType = $from.parent.type?.name;
	if (
		parentType === "codeBlock" ||
		parentType === "codeGroup" ||
		parentType === "customTable" ||
		parentType === "table"
	) {
		return null;
	}

	const textBefore = $from.parent.textBetween(0, $from.parentOffset, "\n", "\0");
	// Match "/query" at end of current textblock segment, optionally preceded by start or whitespace
	// Examples:
	// "/text" -> query "text"
	// "hello /tx" -> query "tx"
	const match = textBefore.match(/(?:^|\s)\/([^\s]*)$/);
	if (!match) return null;

	const query = match[1] || "";
	// Absolute positions for range (include the "/" and query)
	const to = selection.from;
	const from = to - (query.length + 1);
	if (from < 0) return null;

	return { from, to, query };
}

export const TiptapSlashDropdownExtension = Extension.create({
	name: "slashDropdown",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: SlashDropdownPluginKey,
				state: {
					init: () => ({ active: false, range: null, query: "" }),
					apply: (tr, prev, _oldState, newState) => {
						const meta = tr.getMeta(SlashDropdownPluginKey);
						if (meta?.type === "close") {
							return { active: false, range: null, query: "" };
						}

						const match = findSlashMatch(newState);
						if (!match) {
							return { active: false, range: null, query: "" };
						}

						return { active: true, range: { from: match.from, to: match.to }, query: match.query };
					},
				},
				props: {
					handleKeyDown: (view, event) => {
						const pluginState = SlashDropdownPluginKey.getState(view.state);
						if (!pluginState?.active) return false;

						if (event.key === "Escape") {
							const tr = view.state.tr.setMeta(SlashDropdownPluginKey, { type: "close" });
							view.dispatch(tr);
							return true;
						}

						return false;
					},
				},
			}),
		];
	},
});

export function getSlashDropdownState(editor) {
	if (!editor?.view) return { active: false, range: null, query: "" };
	return SlashDropdownPluginKey.getState(editor.view.state) || {
		active: false,
		range: null,
		query: "",
	};
}

function defaultItems() {
	return [
		{
			id: "text",
			title: "Text",
			keywords: ["text", "tx", "paragraph", "p"],
			run: (editor) => editor.chain().focus().setParagraph().run(),
		},
		{
			id: "h1",
			title: "Heading 1",
			keywords: ["h1", "heading1", "heading 1", "title"],
			run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
		},
		{
			id: "h2",
			title: "Heading 2",
			keywords: ["h2", "heading2", "heading 2", "subtitle"],
			run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
		},
		{
			id: "ol",
			title: "Ordered List",
			keywords: ["ordered", "ol", "numbered", "list"],
			run: (editor) => editor.chain().focus().toggleOrderedList().run(),
		},
		{
			id: "ul",
			title: "Bullet List",
			keywords: ["bullet", "ul", "list"],
			run: (editor) => editor.chain().focus().toggleBulletList().run(),
		},
		{
			id: "task",
			title: "Task List",
			keywords: ["task", "todo", "check", "tl"],
			run: (editor) => editor.chain().focus().toggleTaskList().run(),
		},
		{
			id: "quote",
			title: "Quote",
			keywords: ["quote", "blockquote", "bq"],
			run: (editor) => editor.chain().focus().toggleBlockquote().run(),
		},
		{
			id: "code",
			title: "Code Block",
			keywords: ["code", "codeblock", "cb"],
			run: (editor) =>
				editor
					.chain()
					.focus()
					.insertContent({ type: "codeBlock", attrs: { language: "text", code: "" } })
					.run(),
		},
	];
}

export function SlashDropdownMenu({ editor, items = defaultItems() }) {
	const [state, setState] = React.useState(() => getSlashDropdownState(editor));

	React.useEffect(() => {
		if (!editor) return;

		const update = () => setState(getSlashDropdownState(editor));
		editor.on("transaction", update);
		update();

		return () => {
			editor.off("transaction", update);
		};
	}, [editor]);

	if (!editor || !state?.active || !state.range) return null;

	const query = (state.query || "").trim().toLowerCase();
	const filtered = items.filter((item) => {
		if (!query) return true;
		return item.keywords?.some((k) => k.toLowerCase().includes(query));
	});

	const coords = editor.view.coordsAtPos(editor.state.selection.from);
	// Render in a portal to avoid ProseMirror DOM reconciliation issues.
	const left = coords.left;
	const top = coords.bottom + 8;

	const close = () => {
		try {
			editor.view.dispatch(
				editor.view.state.tr.setMeta(SlashDropdownPluginKey, { type: "close" })
			);
		} catch (e) {
			// ignore
		}
	};

	const onPick = (item) => {
		const { from, to } = state.range;
		editor
			.chain()
			.focus()
			.deleteRange({ from, to })
			.run();
		item.run(editor);
		close();
	};


	if (typeof document === "undefined") return null;

	return createPortal(
		<div
			className="fixed z-50"
			style={{ left, top }}
			onMouseDown={(e) => {
				e.preventDefault();
			}}
		>
			<div className="min-w-[220px] max-w-[320px] bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
					{filtered.length === 0 ? (
						<div className="px-3 py-2 text-xs text-zinc-500">No commands</div>
					) : (
						filtered.map((item) => (
							<button
								key={item.id}
								type="button"
								className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 active:bg-zinc-100 flex items-center justify-between"
								onClick={() => onPick(item)}
							>
								<span className="text-zinc-900 font-medium">{item.title}</span>
								<span className="text-[10px] text-zinc-400">
									/{item.keywords?.[0] || item.id}
								</span>
							</button>
						))
					)}
			</div>
		</div>,
		document.body
	);
}

