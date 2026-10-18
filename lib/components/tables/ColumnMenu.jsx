import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, X, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { COLUMN_TYPES, typeOf } from "../../tables/schema";
import { cn } from "../../utils/cn";

const TypeGrid = ({ value, onPick }) => (
	<div className="grid grid-cols-2 gap-1">
		{COLUMN_TYPES.map((t) => (
			<button
				key={t.id}
				type="button"
				title={t.hint}
				onClick={() => onPick(t.id)}
				className={cn(
					"flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800",
					value === t.id && "border-zinc-200 bg-zinc-100 font-medium dark:border-zinc-700 dark:bg-zinc-800",
				)}
			>
				<HugeiconsIcon icon={t.icon} size={14} strokeWidth={1.8} className="shrink-0 text-zinc-500" />
				<span className="truncate">{t.label}</span>
			</button>
		))}
	</div>
);

const Row = ({ icon: Icon, children, onClick, danger }) => (
	<button
		type="button"
		onClick={onClick}
		className={cn(
			"flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800",
			danger && "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30",
		)}
	>
		<Icon className="h-3.5 w-3.5 shrink-0" /> {children}
	</button>
);

/** Popover to edit one column: name, type, sort, filter, duplicate, delete. */
export const ColumnMenu = ({ column, sorted, onRename, onType, onSort, onFilter, onDuplicate, onDelete, children }) => {
	const [confirm, setConfirm] = useState(false);
	return (
		<Popover onOpenChange={(o) => !o && setConfirm(false)}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent align="start" className="w-64 space-y-2 p-2">
				<input
					value={column.name}
					onChange={(e) => onRename(e.target.value)}
					className="h-8 w-full rounded-lg border bg-background px-2 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
				/>
				<div>
					<div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Field type</div>
					<TypeGrid value={column.type} onPick={onType} />
				</div>
				<div className="border-t pt-1">
					<Row icon={ArrowUp} onClick={() => onSort("asc")}>Sort A → Z {sorted === "asc" && "✓"}</Row>
					<Row icon={ArrowDown} onClick={() => onSort("desc")}>Sort Z → A {sorted === "desc" && "✓"}</Row>
					{sorted && <Row icon={X} onClick={() => onSort(false)}>Clear sort</Row>}
					<Row icon={Filter} onClick={onFilter}>Filter by this column</Row>
					<Row icon={Copy} onClick={onDuplicate}>Duplicate column</Row>
					<Row icon={Trash2} danger onClick={() => (confirm ? onDelete() : setConfirm(true))}>
						{confirm ? "Click again to delete" : "Delete column"}
					</Row>
				</div>
			</PopoverContent>
		</Popover>
	);
};

/** "+" in the header: pick a name and a type. */
export const AddColumn = ({ onAdd, disabled }) => {
	const [name, setName] = useState("");
	const [open, setOpen] = useState(false);
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					disabled={disabled}
					title={disabled ? "Column limit reached" : "Add column"}
					className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
				>
					<Plus className="h-4 w-4" />
				</button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-64 space-y-2 p-2">
				<input
					autoFocus
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Column name"
					className="h-8 w-full rounded-lg border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
				/>
				<div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Pick a type to add</div>
				<TypeGrid
					value={null}
					onPick={(type) => {
						onAdd(name.trim() || typeOf(type).label, type);
						setName("");
						setOpen(false);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
};
