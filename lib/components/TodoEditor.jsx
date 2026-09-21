import React, { useEffect, useMemo, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { ArrowLeft } from "lucide-react";
import { debounce } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { useTheme } from "../context/ThemeContext";

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

function formatDayTitle(dateKey) {
	const [y, m, d] = dateKey.split("-").map(Number);
	return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

function emptyTaskDoc() {
	return {
		type: "doc",
		content: [
			{
				type: "taskList",
				content: [
					{
						type: "taskItem",
						attrs: { checked: false },
						content: [{ type: "paragraph" }],
					},
				],
			},
		],
	};
}

function itemsToContent(items) {
	if (!items?.length) return emptyTaskDoc();
	return {
		type: "doc",
		content: [
			{
				type: "taskList",
				content: items.map((item) => ({
					type: "taskItem",
					attrs: { checked: !!item.completed },
					content: [
						{
							type: "paragraph",
							content: item.text ? [{ type: "text", text: item.text }] : [],
						},
					],
				})),
			},
		],
	};
}

function nodeText(node) {
	if (!node) return "";
	if (node.text) return node.text;
	return (node.content || []).map(nodeText).join("");
}

function extractItems(doc) {
	const items = [];
	const walk = (node) => {
		if (!node) return;
		if (node.type === "taskItem") {
			const text = nodeText(node).trim();
			if (text) {
				items.push({
					id: uuidv4(),
					text,
					completed: Boolean(node.attrs?.checked),
					createdAt: Date.now(),
				});
			}
		}
		(node.content || []).forEach(walk);
	};
	walk(doc);
	return items;
}

export default function TodoEditor({
	dateKey,
	initialHtml,
	initialItems,
	onSave,
	onBack,
}) {
	const { isDarkMode } = useTheme();
	const onSaveRef = useRef(onSave);
	onSaveRef.current = onSave;

	const initialContent = useMemo(() => {
		if (initialHtml) return initialHtml;
		return itemsToContent(initialItems);
	}, [initialHtml, initialItems]);

	const debouncedSave = useMemo(
		() =>
			debounce((html, json) => {
				onSaveRef.current?.(html, extractItems(json));
			}, 300),
		[],
	);

	useEffect(() => () => debouncedSave.flush(), [debouncedSave]);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit,
			Placeholder.configure({
				placeholder: "Add a todo...",
			}),
			TaskList,
			TaskItem.configure({
				nested: true,
			}),
		],
		content: initialContent,
		editorProps: {
			attributes: {
				class: "focus:outline-none min-h-[50vh]",
			},
		},
		onUpdate: ({ editor: instance }) => {
			debouncedSave(instance.getHTML(), instance.getJSON());
		},
	});

	useEffect(() => {
		if (!editor) return;
		const timer = setTimeout(() => editor.commands.focus("end"), 50);
		return () => clearTimeout(timer);
	}, [editor]);

	if (!editor) return null;

	return (
		<div
			className={`flex-1 flex flex-col h-full ${isDarkMode ? "bg-zinc-950" : "bg-white"} overflow-hidden relative`}
		>
			<div className="px-8 pt-12 pb-6 flex items-end gap-3 z-10 max-w-4xl mx-auto w-full">
				<button
					onClick={onBack}
					className="p-2 mb-1 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
					title="Back"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<h1
					className={`text-4xl font-black flex-1 min-w-0 ${isDarkMode ? "text-zinc-100" : "text-zinc-900"}`}
				>
					{formatDayTitle(dateKey)}
				</h1>
			</div>

			<div className="flex-1 overflow-y-auto scrollbar-hide">
				<div
					className={`px-8 pb-32 prose ${isDarkMode ? "prose-invert prose-zinc" : "prose-zinc"} max-w-4xl mx-auto w-full prose-p:my-1`}
				>
					<style>{`
						.ProseMirror p.is-editor-empty:first-child::before,
						.ProseMirror li.is-empty p.is-editor-empty::before {
							content: "Add a todo...";
							color: ${isDarkMode ? "#71717a" : "#9ca3af"};
							float: left;
							height: 0;
							pointer-events: none;
						}
					`}</style>
					<EditorContent editor={editor} />
				</div>
			</div>
		</div>
	);
}
