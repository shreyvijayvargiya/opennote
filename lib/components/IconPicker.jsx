import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import NoteIcon from "./NoteIcon";
import { EMOJIS, ICONS, ICON_LIST, encodeIcon } from "../icons";
import { cn } from "../utils/cn";

const cell =
	"flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800";

/**
 * Pick a Hugeicons icon or an emoji for a note/folder.
 * `children` is the trigger; `onChange(value)` gets "hugeicons:Name" | "emoji:🔥" | null (reset).
 */
const IconPicker = ({ note, onChange, children }) => {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const q = query.trim().toLowerCase();

	const icons = ICON_LIST.filter((i) => !q || i.label.includes(q));
	const emojis = EMOJIS.filter(([e, k]) => !q || k.includes(q));
	const pick = (value) => {
		onChange(value);
		setOpen(false);
	};

	return (
		<Popover
			open={open}
			onOpenChange={(o) => {
				setOpen(o);
				if (!o) setQuery("");
			}}
		>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent className="w-[19.5rem]" onClick={(e) => e.stopPropagation()}>
				<div className="relative mb-2">
					<HugeiconsIcon
						icon={Search01Icon}
						size={14}
						className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
					/>
					<input
						autoFocus
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search icons and emoji…"
						className="h-8 w-full rounded-lg border bg-background pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>

				<div className="hide-scrollbar max-h-64 overflow-y-auto hide-scrollbar">
					{icons.length > 0 && (
						<>
							<div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
								Icons
							</div>
							<div className="grid grid-cols-8 gap-0.5">
								{icons.map((i) => (
									<button
										key={i.name}
										type="button"
										title={i.label}
										onClick={() => pick(encodeIcon.icon(i.name))}
										className={cn(cell, note?.icon === encodeIcon.icon(i.name) && "bg-zinc-100 dark:bg-zinc-800")}
									>
										<HugeiconsIcon icon={ICONS[i.name]} size={16} strokeWidth={1.8} />
									</button>
								))}
							</div>
						</>
					)}
					{emojis.length > 0 && (
						<>
							<div className="px-1 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
								Emoji
							</div>
							<div className="grid grid-cols-8 gap-0.5">
								{emojis.map(([e, k]) => (
									<button
										key={e}
										type="button"
										title={k}
										onClick={() => pick(encodeIcon.emoji(e))}
										className={cn(cell, "text-base", note?.icon === encodeIcon.emoji(e) && "bg-zinc-100 dark:bg-zinc-800")}
									>
										{e}
									</button>
								))}
							</div>
						</>
					)}
					{icons.length === 0 && emojis.length === 0 && (
						<div className="py-6 text-center text-xs text-zinc-400">No icons found</div>
					)}
				</div>

				<div className="mt-2 flex items-center justify-between border-t pt-2">
					<span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
						<NoteIcon note={note} size={13} /> Current
					</span>
					<button
						type="button"
						onClick={() => pick(null)}
						disabled={!note?.icon}
						className="rounded-lg px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
					>
						Reset to default
					</button>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default IconPicker;
