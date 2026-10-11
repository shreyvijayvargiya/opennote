import React, { useEffect, useRef } from "react";
import { History, Trash2 } from "lucide-react";

const AIHistoryMenu = ({ open, chats, currentId, onToggle, onSelect, onDelete }) => {
	const rootRef = useRef(null);

	useEffect(() => {
		if (!open) return undefined;
		const onPointer = (event) => {
			if (!rootRef.current?.contains(event.target)) onToggle(false);
		};
		const onKey = (event) => {
			if (event.key === "Escape") onToggle(false);
		};
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [open, onToggle]);

	return (
		<div className="relative" ref={rootRef}>
			<button
				type="button"
				onClick={() => onToggle(!open)}
				className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
				title="Chat history"
			>
				<History className="w-3.5 h-3.5" />
			</button>
			{open && (
				<div className="absolute right-0 top-8 z-30 w-64 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
					<div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
						This note
					</div>
					<div className="max-h-64 overflow-y-auto">
						{chats.length === 0 ? (
							<div className="px-2 py-3 text-xs text-zinc-400">No saved chats yet.</div>
						) : (
							chats.map((chat) => (
								<div
									key={chat.id}
									className={`group flex items-center rounded-lg ${
										chat.id === currentId
											? "bg-zinc-100 dark:bg-zinc-900"
											: "hover:bg-zinc-50 dark:hover:bg-zinc-900"
									}`}
								>
									<button
										type="button"
										onClick={() => onSelect(chat)}
										className="min-w-0 flex-1 px-2 py-2 text-left"
									>
										<span className="block truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">
											{chat.title || "New chat"}
										</span>
										<span className="block text-[10px] text-zinc-400">
											{chat.messages?.length || 0} messages
										</span>
									</button>
									<button
										type="button"
										onClick={() => onDelete(chat.id)}
										className="mr-1 rounded-md p-1 text-zinc-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
										title="Delete chat"
									>
										<Trash2 className="w-3 h-3" />
									</button>
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default AIHistoryMenu;
