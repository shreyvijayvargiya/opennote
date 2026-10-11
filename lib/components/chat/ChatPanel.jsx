import React, { useState } from "react";
import {
	Download,
	History,
	Key,
	MessageSquarePlus,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import ChatInput from "./ChatInput";
import ImagePreview from "./ImagePreview";
import { chatToHtml, chatToMarkdown, downloadText } from "../../ai/exportChat";
import MessageItem from "./MessageItem";
import { useChat, MAX_CHATS } from "../../ai/useChat";
import { useApp } from "../../context/AppContext";
import { cn } from "../../utils/cn";

const KeyForm = ({ initial, onSave, onRemove }) => {
	const [key, setKey] = useState(initial || "");
	return (
		<form
			className="flex flex-col gap-2"
			onSubmit={(e) => {
				e.preventDefault();
				onSave(key);
			}}
		>
			<input
				type="password"
				value={key}
				onChange={(e) => setKey(e.target.value)}
				placeholder="sk-or-v1-…"
				className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
			/>
			<div className="flex gap-2">
				<Button type="submit" size="sm" variant="gray" disabled={!key.trim()}>
					Save key
				</Button>
				{initial && onRemove && (
					<Button type="button" size="sm" variant="ghost" onClick={onRemove}>
						Remove
					</Button>
				)}
			</div>
			<p className="text-[11px] text-muted-foreground">
				Stored only in this browser (IndexedDB) and sent only to openrouter.ai. Get a key at{" "}
				<a
					href="https://openrouter.ai/keys"
					target="_blank"
					rel="noreferrer"
					className="underline"
				>
					openrouter.ai/keys
				</a>
				.
			</p>
		</form>
	);
};

const ChatPanel = ({ notes }) => {
	const app = useApp();
	const chat = useChat({ notes, activeNoteId: app.activeId, openIds: app.openIds });
	const [keyDialog, setKeyDialog] = useState(false);
	const [preview, setPreview] = useState(null); // { src, name } for the image modal
	const streaming = chat.status === "streaming";

	return (
		<aside
			aria-hidden={!app.chatOpen}
			className={cn(
				// floating rounded card, same look as the sidebar
				"z-40 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm transition-[width,transform,margin,opacity] duration-300 dark:border-zinc-800 dark:bg-zinc-950",
				"fixed bottom-2 right-2 top-2 w-[min(25rem,calc(100%-1rem))] sm:static sm:z-auto sm:my-2 sm:mr-2 sm:h-[calc(100%-1rem)]",
				app.chatOpen
					? "translate-x-0 sm:w-[25rem]"
					: "pointer-events-none translate-x-[120%] sm:mr-0 sm:w-0 sm:translate-x-0 sm:border-0 sm:opacity-0",
			)}
		>
			<div className="flex h-full w-full flex-col sm:w-[25rem]">
				{/* Header */}
				<div className="flex h-12 shrink-0 items-center gap-1 border-b px-3">
					<Sparkles className="h-4 w-4 text-muted-foreground" />
					<span className="flex-1 text-sm font-semibold">Assistant</span>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" title="Export chat" disabled={chat.messages.length === 0}>
								<Download />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onSelect={() => downloadText("opennote-chat.md", "text/markdown", chatToMarkdown(chat.messages))}
							>
								Markdown (.md)
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => downloadText("opennote-chat.html", "text/html", chatToHtml(chat.messages))}
							>
								HTML (.html)
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu onOpenChange={chat.setHistoryOpen}>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" title="Chat history">
								<History />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-72">
							<DropdownMenuLabel>
								Recent chats · {chat.history.length}/{MAX_CHATS}
							</DropdownMenuLabel>
							{chat.history.length === 0 && (
								<div className="px-2.5 py-3 text-xs text-muted-foreground">No chats yet</div>
							)}
							<div className="max-h-64 overflow-y-auto">
								{chat.history.map((c) => (
									<DropdownMenuItem
										key={c.id}
										onSelect={() => chat.openChat(c.id)}
										className={cn("group/item justify-between", c.id === chat.chatId && "bg-accent")}
									>
										<span className="min-w-0 flex-1">
											<span className="block truncate">{c.title}</span>
											<span className="block text-[10px] text-muted-foreground">
												{new Date(c.updatedAt).toLocaleString([], {
													month: "short",
													day: "numeric",
													hour: "numeric",
													minute: "2-digit",
												})}{" "}
												· {c.count} msgs
											</span>
										</span>
										<button
											type="button"
											title="Delete chat"
											onClick={(e) => {
												e.stopPropagation();
												e.preventDefault();
												chat.deleteChat(c.id);
											}}
											className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/item:opacity-100"
										>
											<Trash2 className="!h-3.5 !w-3.5" />
										</button>
									</DropdownMenuItem>
								))}
							</div>
							<DropdownMenuSeparator />
							<DropdownMenuItem onSelect={() => setKeyDialog(true)}>
								<Key /> OpenRouter API key
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={chat.history.length === 0}
								onSelect={chat.clearChats}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 /> Delete all chats
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<Button variant="ghost" size="icon" title="New chat" onClick={chat.newChat}>
						<MessageSquarePlus />
					</Button>
					<Button variant="ghost" size="icon" title="Close" onClick={() => app.setChatOpen(false)}>
						<X />
					</Button>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto px-4 py-4">
					{!chat.apiKey ? (
						<div className="mx-auto mt-8 max-w-xs space-y-3">
							<h3 className="text-sm font-semibold">Connect OpenRouter</h3>
							<p className="text-xs text-muted-foreground">
								Add your OpenRouter API key to chat with any model about your notes.
							</p>
							<KeyForm onSave={chat.saveApiKey} />
						</div>
					) : (
						<div className="flex flex-col gap-5">
							{chat.messages.map((m, i) => (
								<MessageItem
									onPreview={setPreview}
									onOpenNote={app.openNote}
									key={m.id}
									message={m}
									streaming={streaming && i === chat.messages.length - 1}
									onKeep={chat.keepChange}
									onUndo={chat.undoChange}
								/>
							))}
						</div>
					)}
					{/* callback ref (no useEffect): keep the latest message in view */}
					<div ref={(el) => el?.scrollIntoView({ block: "end" })} />
				</div>

				{/* Input */}
				<div className="shrink-0 p-3 pt-0">
					<ChatInput
						onPreview={setPreview}
						onOpenNote={app.openNote}
						notes={notes}
						model={chat.model}
						onModelChange={chat.setModel}
						streaming={streaming}
						inputRef={app.chatInputRef}
						selections={app.selections}
						onRemoveSelection={app.removeSelection}
						onStop={chat.stop}
						onSend={(payload) => {
							if (!chat.apiKey) return setKeyDialog(true);
							chat.send({ ...payload, selections: app.selections });
							app.clearSelections();
						}}
					/>
				</div>
			</div>

			{preview && <ImagePreview image={preview} onClose={() => setPreview(null)} />}

			{/* API key dialog */}
			<Dialog open={keyDialog} onOpenChange={setKeyDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>OpenRouter API key</DialogTitle>
						<DialogDescription>Pick any model from the chat input once it's set.</DialogDescription>
					</DialogHeader>
					<KeyForm
						initial={chat.apiKey}
						onSave={(k) => {
							chat.saveApiKey(k);
							setKeyDialog(false);
						}}
						onRemove={() => {
							chat.saveApiKey("");
							setKeyDialog(false);
						}}
					/>
				</DialogContent>
			</Dialog>

			{/* AI wants to delete a note: always ask first */}
			<Dialog open={!!chat.confirmReq} onOpenChange={(o) => !o && chat.answerConfirm(false)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete “{chat.confirmReq?.title}”?</DialogTitle>
						<DialogDescription>
							The assistant wants to delete this note
							{chat.confirmReq?.nested
								? ` and ${chat.confirmReq.nested} nested page${chat.confirmReq.nested > 1 ? "s" : ""}`
								: ""}
							. This can't be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="ghost" onClick={() => chat.answerConfirm(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={() => chat.answerConfirm(true)}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</aside>
	);
};

export default ChatPanel;
