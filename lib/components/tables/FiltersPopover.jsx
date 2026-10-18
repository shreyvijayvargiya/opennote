import React from "react";
import { Filter, Plus, Trash2, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { OPERATORS, defaultRule, needsValue } from "../../tables/filter";
import { Chip } from "./cells";
import { cn } from "../../utils/cn";

const Pick = ({ label, items, onPick, className }) => (
	<DropdownMenu>
		<DropdownMenuTrigger asChild>
			<button type="button" className={cn("flex h-8 items-center justify-between gap-1 rounded-lg border bg-background px-2 text-xs", className)}>
				<span className="truncate">{label}</span> <ChevronDown className="h-3 w-3 shrink-0 text-zinc-400" />
			</button>
		</DropdownMenuTrigger>
		<DropdownMenuContent className="max-h-60 overflow-y-auto hide-scrollbar">
			{items.map(([id, text]) => (
				<DropdownMenuItem key={id} onSelect={() => onPick(id)}>{text}</DropdownMenuItem>
			))}
		</DropdownMenuContent>
	</DropdownMenu>
);

/** Filter rules (AND). Each rule: column + operator + value. */
const FiltersPopover = ({ columns, rules, onChange, open, onOpenChange }) => {
	const patch = (id, p) => onChange(rules.map((r) => (r.id === id ? { ...r, ...p } : r)));
	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"flex h-8 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
						rules.length > 0 && "border-indigo-300 dark:border-indigo-500/60",
					)}
				>
					<Filter className="h-3.5 w-3.5" /> Filter{rules.length > 0 && ` · ${rules.length}`}
				</button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[30rem] max-w-[92vw] space-y-2 p-3">
				{rules.length === 0 && <div className="py-2 text-center text-xs text-zinc-400">No filters yet. Rows must match every rule you add.</div>}
				{rules.map((r) => {
					const col = columns.find((c) => c.id === r.col) || columns[0];
					const ops = OPERATORS(col.type);
					return (
						<div key={r.id} className="flex items-center gap-1.5">
							<Pick className="w-32" label={col.name} items={columns.map((c) => [c.id, c.name])} onPick={(id) => { const c = columns.find((x) => x.id === id); patch(r.id, { col: id, op: OPERATORS(c.type)[0][0], value: "" }); }} />
							<Pick className="w-28" label={ops.find((o) => o[0] === r.op)?.[1] || ops[0][1]} items={ops} onPick={(op) => patch(r.id, { op })} />
							{needsValue(r.op) &&
								(col.type === "chips" ? (
									<Pick className="min-w-0 flex-1" label={col.options?.find((o) => o.id === r.value)?.label || "Choose…"} items={(col.options || []).map((o) => [o.id, o.label])} onPick={(v) => patch(r.id, { value: v })} />
								) : (
									<input
										value={r.value}
										type={col.type === "date" ? "date" : ["number", "slider", "rating"].includes(col.type) ? "number" : "text"}
										onChange={(e) => patch(r.id, { value: e.target.value })}
										placeholder="Value"
										className="h-8 min-w-0 flex-1 rounded-lg border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
									/>
								))}
							<button type="button" title="Remove filter" onClick={() => onChange(rules.filter((x) => x.id !== r.id))} className="ml-auto rounded-md p-1.5 text-zinc-400 hover:text-red-500">
								<Trash2 className="h-3.5 w-3.5" />
							</button>
						</div>
					);
				})}
				<div className="flex items-center justify-between border-t pt-2">
					<button type="button" onClick={() => columns[0] && onChange([...rules, defaultRule(columns[0])])} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
						<Plus className="h-3.5 w-3.5" /> Add filter
					</button>
					{rules.length > 0 && <button type="button" onClick={() => onChange([])} className="text-xs text-zinc-400 hover:text-red-500">Clear all</button>}
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default FiltersPopover;
