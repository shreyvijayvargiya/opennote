import React from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useLiveQuery } from "dexie-react-hooks";
import { FileText } from "lucide-react";
import { db as localDb } from "../db/localDb";

const usePageTitle = (pageId, fallback) => {
	const numericId = pageId == null || pageId === "" ? null : Number(pageId);
	const liveNote = useLiveQuery(
		() =>
			numericId != null && !Number.isNaN(numericId)
				? localDb.notes.get(numericId)
				: undefined,
		[numericId],
	);
	return liveNote?.title || fallback || "Untitled Page";
};

const openLinkedPage = (editor, pageId) => {
	if (pageId == null || pageId === "") return;
	const handler =
		editor.storage.page?.onOpenPage ||
		editor.storage.pageInline?.onOpenPage ||
		editor.extensionManager.extensions.find(
			(ext) => ext.name === "page" || ext.name === "pageInline",
		)?.options?.onOpenPage;
	handler?.(pageId);
};

const pageAttributes = {
	pageId: {
		default: null,
		parseHTML: (element) => element.getAttribute("data-page-id"),
		renderHTML: (attributes) => {
			if (attributes.pageId == null || attributes.pageId === "") {
				return {};
			}
			return { "data-page-id": String(attributes.pageId) };
		},
	},
	title: {
		default: "Untitled Page",
		parseHTML: (element) =>
			element.getAttribute("data-title") || "Untitled Page",
		renderHTML: (attributes) => ({
			"data-title": attributes.title || "Untitled Page",
		}),
	},
};

const PageBlockView = ({ node, editor }) => {
	const pageId = node.attrs.pageId;
	const title = usePageTitle(pageId, node.attrs.title);

	return (
		<NodeViewWrapper data-type="page">
			<button
				type="button"
				contentEditable={false}
				onClick={() => openLinkedPage(editor, pageId)}
				className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-transparent bg-transparent px-3 py-1.5 text-left transition-colors hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70"
			>
				<FileText className="h-4 w-4 flex-shrink-0 text-zinc-400" />
				<span className="truncate text-sm font-semibold text-zinc-700 dark:text-zinc-200">
					{title}
				</span>
			</button>
		</NodeViewWrapper>
	);
};

const PageInlineView = ({ node, editor }) => {
	const pageId = node.attrs.pageId;
	const title = usePageTitle(pageId, node.attrs.title);

	return (
		<NodeViewWrapper as="span" data-type="page-inline" className="inline">
			<button
				type="button"
				contentEditable={false}
				onClick={() => openLinkedPage(editor, pageId)}
				className="inline-flex cursor-pointer items-center gap-1 align-baseline rounded-md border border-transparent bg-transparent px-1 py-0 font-medium text-indigo-600 underline decoration-indigo-400/50 underline-offset-2 transition-colors hover:border-zinc-200 hover:bg-zinc-50 hover:text-indigo-800 dark:text-indigo-400 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70 dark:hover:text-indigo-200"
			>
				<FileText className="h-3.5 w-3.5 flex-shrink-0" />
				<span className="whitespace-nowrap">{title}</span>
			</button>
		</NodeViewWrapper>
	);
};

export const PageBlock = Node.create({
	name: "page",
	group: "block",
	atom: true,
	selectable: true,
	draggable: true,

	addOptions() {
		return {
			onOpenPage: null,
		};
	},

	addStorage() {
		return {
			onOpenPage: this.options.onOpenPage,
			markdown: {
				serialize(state, node) {
					const title = node.attrs.title || "Untitled Page";
					const id = node.attrs.pageId || "";
					state.write(`[${title}](page://${id})`);
					state.closeBlock(node);
				},
			},
		};
	},

	addAttributes() {
		return pageAttributes;
	},

	parseHTML() {
		return [{ tag: 'div[data-type="page"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"div",
			mergeAttributes({ "data-type": "page" }, HTMLAttributes),
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(PageBlockView);
	},
});

export const PageInline = Node.create({
	name: "pageInline",
	group: "inline",
	inline: true,
	atom: true,
	selectable: true,
	draggable: true,

	addOptions() {
		return {
			onOpenPage: null,
		};
	},

	addStorage() {
		return {
			onOpenPage: this.options.onOpenPage,
			markdown: {
				serialize(state, node) {
					const title = node.attrs.title || "Untitled Page";
					const id = node.attrs.pageId || "";
					state.write(`[${title}](page://${id})`);
				},
			},
		};
	},

	addAttributes() {
		return pageAttributes;
	},

	parseHTML() {
		return [{ tag: 'span[data-type="page-inline"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"span",
			mergeAttributes({ "data-type": "page-inline" }, HTMLAttributes),
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(PageInlineView, { as: "span" });
	},
});

export default PageBlock;
