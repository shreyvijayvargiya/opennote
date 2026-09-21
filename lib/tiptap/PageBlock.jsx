import React from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useLiveQuery } from "dexie-react-hooks";
import { FileText } from "lucide-react";
import { db as localDb } from "../db/localDb";

const PageBlockView = ({ node, editor }) => {
	const pageId = node.attrs.pageId;
	const numericId = pageId == null || pageId === "" ? null : Number(pageId);
	const liveNote = useLiveQuery(
		() =>
			numericId != null && !Number.isNaN(numericId)
				? localDb.notes.get(numericId)
				: undefined,
		[numericId],
	);
	const title =
		liveNote?.title || node.attrs.title || "Untitled Page";

	const openPage = () => {
		if (pageId == null || pageId === "") return;
		const handler =
			editor.storage.page?.onOpenPage ||
			editor.extensionManager.extensions.find((ext) => ext.name === "page")
				?.options?.onOpenPage;
		handler?.(pageId);
	};

	return (
		<NodeViewWrapper data-type="page">
			<button
				type="button"
				contentEditable={false}
				onClick={openPage}
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
		return {
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

export default PageBlock;
