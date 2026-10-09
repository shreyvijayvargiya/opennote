import React from "react";
import { BubbleMenu } from "@tiptap/react";
import {
	Bold,
	Copy,
	Heading2,
	Italic,
	Link as LinkIcon,
	List,
	Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { cn } from "../utils/cn";

const Btn = ({ active, onClick, title, children, className }) => (
	<button
		type="button"
		title={title}
		// mousedown would collapse the selection before onClick runs
		onMouseDown={(e) => e.preventDefault()}
		onClick={onClick}
		className={cn(
			"flex h-7 items-center justify-center gap-1 rounded-lg px-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
			active && "bg-accent text-foreground",
			className,
		)}
	>
		{children}
	</button>
);

/** Floating toolbar shown when text is selected. */
const SelectionToolbar = ({ editor, noteId, noteTitle, onLink }) => {
	const { askAI } = useApp();
	const selectedText = () => {
		const { from, to } = editor.state.selection;
		return editor.state.doc.textBetween(from, to, "\n");
	};

	return (
		<BubbleMenu
			editor={editor}
			tippyOptions={{ duration: 100, maxWidth: "none" }}
			shouldShow={({ state, editor: ed }) =>
				!state.selection.empty && ed.isEditable && !ed.isActive("image")
			}
		>
			<div className="flex items-center gap-0.5 rounded-xl border bg-popover p-1 shadow-lg">
				<Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
					<Bold className="h-3.5 w-3.5" />
				</Btn>
				<Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
					<Italic className="h-3.5 w-3.5" />
				</Btn>
				<Btn title="Link" active={editor.isActive("link")} onClick={onLink}>
					<LinkIcon className="h-3.5 w-3.5" />
				</Btn>
				<Btn title="List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
					<List className="h-3.5 w-3.5" />
				</Btn>
				<Btn title="Heading" active={editor.isActive("heading")} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
					<Heading2 className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					title="Copy"
					onClick={async () => {
						await navigator.clipboard.writeText(selectedText());
						toast.success("Copied");
					}}
				>
					<Copy className="h-3.5 w-3.5" />
				</Btn>
				<div className="mx-0.5 h-4 w-px bg-border" />
				<Btn
					title="Ask AI about this text"
					className="px-2 text-foreground"
					onClick={() =>
						askAI({ noteId, title: noteTitle, text: selectedText().slice(0, 4000) })
					}
				>
					<Sparkles className="h-3.5 w-3.5" />
					<span className="text-xs font-medium">Ask AI</span>
				</Btn>
			</div>
		</BubbleMenu>
	);
};

export default SelectionToolbar;
