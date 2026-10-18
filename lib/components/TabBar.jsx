import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Cancel01Icon, LayoutGridIcon, Upload01Icon } from "@hugeicons/core-free-icons";
import NoteIcon from "./NoteIcon";
import { cn } from "../utils/cn";

/**
 * Tabs of the notes open in one editor group, above the breadcrumbs.
 * Rounded pills (no bottom line). Icons are display-only here: change them in the sidebar.
 * `right` renders at the end of the bar (e.g. the "Ask AI" button).
 */
const TabBar = ({ tabs, active, byId, isActiveGroup, onSelect, onClose, onNew, onGallery, onImport, right }) => (
	<div className="hide-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto hide-scrollbar p-1.5">
		{tabs.map((id) => {
			const note = byId.get(id);
			if (!note) return null;
			const isActive = id === active;
			return (
				<div
					key={id}
					onMouseDown={(e) => e.button === 1 && (e.preventDefault(), onClose(id))} // middle-click closes
					className={cn(
						"group flex h-8 max-w-[190px] shrink-0 items-center gap-1.5 rounded-xl border pl-2.5 pr-1 text-xs font-medium transition-colors",
						isActive
							? cn(
									"bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
									isActiveGroup ? "border-indigo-300 dark:border-indigo-500/60" : "border-zinc-200 dark:border-zinc-700",
								)
							: "border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200",
					)}
				>
					<button
						type="button"
						onClick={() => onSelect(id)}
						className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
						title={note.title || "Untitled"}
					>
						<NoteIcon note={note} size={14} className="text-zinc-500" />
						<span className="truncate">{note.title || "Untitled"}</span>
					</button>
					<button
						type="button"
						onClick={() => onClose(id)}
						title="Close tab"
						className={cn(
							"rounded-md p-1 text-zinc-400 transition-opacity hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200",
							!isActive && "opacity-0 group-hover:opacity-100",
						)}
					>
						<HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
					</button>
				</div>
			);
		})}
		<button
			type="button"
			onClick={onNew}
			title="New table"
			className="shrink-0 rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
		>
			<HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
		</button>
		{onGallery && (
			<button
				type="button"
				onClick={onGallery}
				title="Table gallery: 100 ready-made tables"
				className="shrink-0 rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
			>
				<HugeiconsIcon icon={LayoutGridIcon} size={14} strokeWidth={2} />
			</button>
		)}
		{onImport && (
			<button
				type="button"
				onClick={onImport}
				title="Import CSV, Excel, JSON…"
				className="shrink-0 rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
			>
				<HugeiconsIcon icon={Upload01Icon} size={14} strokeWidth={2} />
			</button>
		)}
		{right && <div className="ml-auto shrink-0 pl-2">{right}</div>}
	</div>
);

export default TabBar;
