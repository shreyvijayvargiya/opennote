import React from "react";
import { FileText, Folder, Plus, X } from "lucide-react";
import { cn } from "../utils/cn";

/** Tabs of the notes open in one editor group (shown above the breadcrumbs). */
const TabBar = ({ tabs, active, byId, isActiveGroup, onSelect, onClose, onNew }) => (
	<div className="flex shrink-0 items-end gap-0.5 overflow-x-auto border-b border-zinc-100 px-2 pt-1.5 dark:border-zinc-900 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
		{tabs.map((id) => {
			const note = byId.get(id);
			if (!note) return null;
			const Icon = note.isFolder ? Folder : FileText;
			const isActive = id === active;
			return (
				<div
					key={id}
					onMouseDown={(e) => e.button === 1 && (e.preventDefault(), onClose(id))} // middle-click closes
					className={cn(
						"group flex h-8 max-w-[180px] shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 pl-2.5 pr-1 text-[11px] font-semibold transition-colors",
						isActive
							? cn(
									"bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
									isActiveGroup
										? "border-zinc-200 border-t-indigo-400 dark:border-zinc-800 dark:border-t-indigo-400"
										: "border-zinc-200 dark:border-zinc-800",
								)
							: "border-transparent text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200",
					)}
				>
					<button
						type="button"
						onClick={() => onSelect(id)}
						className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
						title={note.title || "Untitled"}
					>
						<Icon className="h-3 w-3 shrink-0 text-zinc-400" />
						<span className="truncate">{note.title || "Untitled"}</span>
					</button>
					<button
						type="button"
						onClick={() => onClose(id)}
						title="Close tab"
						className={cn(
							"rounded p-0.5 text-zinc-400 transition-opacity hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200",
							!isActive && "opacity-0 group-hover:opacity-100",
						)}
					>
						<X className="h-3 w-3" />
					</button>
				</div>
			);
		})}
		<button
			type="button"
			onClick={onNew}
			title="New note in this tab group"
			className="mb-0.5 ml-0.5 shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
		>
			<Plus className="h-3.5 w-3.5" />
		</button>
	</div>
);

export default TabBar;
