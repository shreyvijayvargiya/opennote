import React from "react";
import ReactMarkdown from "react-markdown";
import {
	Check,
	Copy,
	FileSpreadsheet,
	FileText,
	FilePlus,
	Pencil,
	Trash2,
	Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { cn } from "../../utils/cn";
import { splitTags, TAG_CLASS } from "../../ai/mentions";

const time = (ts) =>
	new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const KIND_ICON = { create: FilePlus, update: Pencil, delete: Trash2 };
const STATUS_TEXT = {
	kept: "Kept",
	undone: "Undone",
	declined: "Not deleted",
	done: "Deleted",
};

/** Cursor-style review row: the change is already applied; Keep or Undo it. */
const ChangeCard = ({ change, onKeep, onUndo }) => {
	const Icon = KIND_ICON[change.kind] || Pencil;
	const pending = change.status === "pending";
	return (
		<div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-2 text-xs">
			<Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
			<div className="min-w-0 flex-1">
				<div className="truncate font-medium">{change.title || "Untitled"}</div>
				<div className="text-muted-foreground">
					{pending ? change.summary : (STATUS_TEXT[change.status] ?? change.status)}
				</div>
			</div>
			{pending && (
				<>
					<Button
						variant="ghost"
						size="sm"
						disabled={change.kind === "update" && !change.before}
						title={
							change.kind === "update" && !change.before
								? "Too large to undo"
								: "Revert this change"
						}
						onClick={onUndo}
					>
						<Undo2 /> Undo
					</Button>
					<Button variant="gray" size="sm" onClick={onKeep}>
						<Check /> Keep
					</Button>
				</>
			)}
		</div>
	);
};

const MessageItem = ({ message, streaming, onKeep, onUndo, onPreview, onOpenNote }) => {
	const isUser = message.role === "user";
	const copy = async () => {
		await navigator.clipboard.writeText(message.content || "");
		toast.success("Copied");
	};

	return (
		<div className={cn("group flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
			{message.attachments?.length > 0 && (
				<div className="flex max-w-[92%] flex-wrap justify-end gap-1">
					{message.attachments?.map((a) =>
						a.kind === "image" ? (
							<button
								key={a.id}
								type="button"
								title="Preview"
								onClick={() => onPreview({ src: a.dataUrl || a.preview || a.thumb, name: a.name })}
							>
								<img
									src={a.thumb}
									alt={a.name}
									className="h-14 w-14 rounded-lg border object-cover transition-opacity hover:opacity-80"
								/>
							</button>
						) : (
							<span
								key={a.id}
								className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground"
							>
								{a.kind === "pdf" ? <FileText className="h-3 w-3" /> : <FileSpreadsheet className="h-3 w-3" />}
								{a.name}
							</span>
						),
					)}
				</div>
			)}

			{(message.content || (streaming && !isUser)) && (
				<div
					className={cn(
						"max-w-[92%] break-words rounded-2xl px-3.5 py-2 text-sm",
						isUser ? "whitespace-pre-wrap bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100" : "px-0",
					)}
				>
					{isUser ? (
						splitTags(
							message.content,
							(message.contexts || [])
								.filter((c) => c.kind === "note")
								.map((c) => ({ id: c.noteId, title: c.title })),
						).map((part, i) =>
							part.id != null ? (
								<button
									key={i}
									type="button"
									title="Open note"
									onClick={() => onOpenNote?.(part.id)}
									className={cn(TAG_CLASS, "cursor-pointer hover:opacity-80")}
								>
									{part.text}
								</button>
							) : (
								<React.Fragment key={i}>{part.text}</React.Fragment>
							),
						)
					) : message.content ? (
						<div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-pre:my-2 prose-ul:my-1.5 prose-headings:my-2">
							<ReactMarkdown>{message.content}</ReactMarkdown>
						</div>
					) : (
						<span className="inline-flex gap-1 py-1">
							{[0, 1, 2].map((i) => (
								<span
									key={i}
									className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
									style={{ animationDelay: `${i * 120}ms` }}
								/>
							))}
						</span>
					)}
				</div>
			)}

			{message.activity?.map((line, i) => (
				<div key={i} className="px-1 text-[11px] text-muted-foreground">
					{line}
				</div>
			))}

			{message.changes?.length > 0 && (
				<div className="flex w-full max-w-[92%] flex-col gap-1.5">
					{message.changes.map((c) => (
						<ChangeCard
							key={c.id}
							change={c}
							onKeep={() => onKeep(message.id, c.id)}
							onUndo={() => onUndo(message.id, c.id)}
						/>
					))}
				</div>
			)}

			{message.error && (
				<div className="max-w-[92%] rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
					{message.error}
				</div>
			)}

			<div className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
				<span>{time(message.createdAt)}</span>
				{message.content && (
					<button
						type="button"
						onClick={copy}
						title="Copy"
						className="rounded p-0.5 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
					>
						<Copy className="h-3 w-3" />
					</button>
				)}
			</div>
		</div>
	);
};

// Old messages keep their identity while a reply streams, so skip re-rendering them.
// (onKeep/onUndo only touch refs inside the hook, so ignoring them here is safe.)
export default React.memo(
	MessageItem,
	(a, b) => a.message === b.message && a.streaming === b.streaming,
);
