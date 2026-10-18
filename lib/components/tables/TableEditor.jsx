import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowLeft,
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Code2,
	Columns2,
	Copy,
	Download,
	GripVertical,
	Loader2,
	MoreHorizontal,
	Plus,
	Search,
	Sparkles,
	Trash2,
	X,
	FileText,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "../../db/localDb";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import Cell from "./cells";
import { TableCtx } from "./context";
import { AddColumn, ColumnMenu } from "./ColumnMenu";
import FiltersPopover from "./FiltersPopover";
import CodeViewModal from "./CodeViewModal";
import NoteIcon from "../NoteIcon";
import { registerEditor, unregisterEditor } from "../../tables/tableOps";
import { convertColumn } from "../../tables/convert";
import { defaultRule, matchRule } from "../../tables/filter";
import { exportTable, tableToMarkdown } from "../../tables/format";
import { LIMITS, cellText, isEmptyValue, makeColumn, makeRow, parseTable, serializeTable, tableBytes, typeOf, uid } from "../../tables/schema";
import { cn } from "../../utils/cn";

const NUMERIC = ["number", "slider", "rating"];
const compare = (col, a, b, tables) => {
	const ea = isEmptyValue(a), eb = isEmptyValue(b);
	if (ea || eb) return ea === eb ? 0 : ea ? -1 : 1;
	if (NUMERIC.includes(col.type)) return Number(a) - Number(b);
	if (col.type === "checkbox") return Number(Boolean(a)) - Number(Boolean(b));
	return cellText(col, a, tables).localeCompare(cellText(col, b, tables), undefined, { numeric: true, sensitivity: "base" });
};

/**
 * One stable cell renderer for every column. (A new function per render would make React remount
 * the cell, e.g. closing a chip popover while you rename a chip.) Column info comes from table meta.
 */
const CellRenderer = ({ row, column, getValue, table }) => {
	const { columnsById, setCell } = table.options.meta;
	const col = columnsById.get(column.id);
	if (!col) return null;
	return <Cell column={col} value={getValue()} onChange={(v) => setCell(row.original.id, col.id, v)} />;
};

const lightBtn =
	"flex h-8 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";
const iconBtn =
	"rounded-xl p-2 text-zinc-400 outline-none transition-all hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200";

const Checkbox = ({ checked, indeterminate, onChange, label }) => (
	<button
		type="button"
		role="checkbox"
		aria-checked={indeterminate ? "mixed" : checked}
		aria-label={label}
		onClick={onChange}
		className={cn(
			"flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors",
			checked || indeterminate ? "border-indigo-500 bg-indigo-500 text-white" : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900",
		)}
	>
		{checked && <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M2.5 6.2 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
		{!checked && indeterminate && <span className="h-0.5 w-2 rounded bg-white" />}
	</button>
);

/* ------------------------------------------------------------------ */
/* Sortable header cell + row (drag & drop)                             */
/* ------------------------------------------------------------------ */
const HeaderCell = memo(function HeaderCell({ header, col, width, onResize, menu }) {
	const sortable = useSortable({ id: col.id });
	const sorted = header.column.getIsSorted();
	const style = { width, minWidth: width, transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition, opacity: sortable.isDragging ? 0.5 : 1 };
	return (
		<th ref={sortable.setNodeRef} style={style} className="group/h relative h-11 border-b border-r border-zinc-200 bg-zinc-50 px-2 text-left align-middle text-xs font-semibold text-zinc-500 last:border-r-0 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
			<div className="flex items-center gap-1.5">
				<span {...sortable.attributes} {...sortable.listeners} title="Drag to reorder column" className="-ml-1 cursor-grab text-zinc-300 opacity-0 transition-opacity active:cursor-grabbing group-hover/h:opacity-100">
					<GripVertical className="h-3.5 w-3.5" />
				</span>
				<HugeiconsIcon icon={typeOf(col.type).icon} size={13} strokeWidth={1.8} className="shrink-0 text-zinc-400" />
				<button type="button" onClick={header.column.getToggleSortingHandler()} className="min-w-0 flex-1 truncate text-left hover:text-zinc-800 dark:hover:text-zinc-100" title="Click to sort">
					{col.name}
				</button>
				<button type="button" onClick={header.column.getToggleSortingHandler()} className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" title="Sort">
					{sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-indigo-500" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5 text-indigo-500" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
				</button>
				{menu}
			</div>
			<span
				onPointerDown={(e) => onResize(e, col.id, width)}
				className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 hover:bg-indigo-300/60 group-hover/h:opacity-100"
			/>
		</th>
	);
});

const SortableRow = memo(function SortableRow({ row, columns, widths, dragEnabled, onDelete, children }) {
	const s = useSortable({ id: row.id, disabled: !dragEnabled });
	const style = { transform: CSS.Translate.toString(s.transform), transition: s.transition, opacity: s.isDragging ? 0.6 : 1, position: s.isDragging ? "relative" : undefined, zIndex: s.isDragging ? 5 : undefined };
	return (
		<tr ref={s.setNodeRef} style={style} className="group/r border-b border-zinc-200 bg-white transition-colors hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/40">
			{children({ handle: dragEnabled ? { ...s.attributes, ...s.listeners } : null })}
		</tr>
	);
});

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */
const TableEditor = ({ initialNote, breadcrumb = [], tables = [], splitCandidates = [], onSplitPick, onSplitNew, onNavigateNote, onDeleteTable, onOpenGallery }) => {
	const app = useApp();
	const { isDarkMode } = useTheme();
	const id = initialNote.id;

	const [title, setTitle] = useState(initialNote.title || "");
	const [table, setTableState] = useState(() => parseTable(initialNote.content));
	const [saving, setSaving] = useState(false);
	const tableRef = useRef(table);
	const titleRef = useRef(title);
	const timer = useRef(null);

	const [sorting, setSorting] = useState([]);
	const [search, setSearch] = useState("");
	const [rules, setRules] = useState([]);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [rowSelection, setRowSelection] = useState({});
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
	const [codeOpen, setCodeOpen] = useState(false);
	const [confirmTable, setConfirmTable] = useState(false);
	const [confirmRows, setConfirmRows] = useState(false);

	const tablesMap = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);
	const tablesMapRef = useRef(tablesMap);
	tablesMapRef.current = tablesMap;

	/* ---------- persistence (debounced) ---------- */
	const flush = useCallback(async () => {
		clearTimeout(timer.current);
		timer.current = null;
		await db.notes.update(id, { title: titleRef.current, content: serializeTable(tableRef.current), updatedAt: Date.now() });
		setSaving(false);
	}, [id]);
	const schedule = useCallback(() => {
		setSaving(true);
		clearTimeout(timer.current);
		timer.current = setTimeout(flush, 500);
	}, [flush]);

	const commit = useCallback(
		(next) => {
			const resolved = typeof next === "function" ? next(tableRef.current) : next;
			if (resolved === tableRef.current) return;
			if (resolved.rows.length > LIMITS.ROWS) return toast.error(`Row limit reached (${LIMITS.ROWS.toLocaleString()} per table)`);
			if (resolved.columns.length > LIMITS.COLUMNS) return toast.error(`Column limit reached (${LIMITS.COLUMNS} per table)`);
			if (resolved.rows.length > tableRef.current.rows.length && tableBytes(resolved) > LIMITS.TABLE_BYTES) return toast.error("This table is too big for browser storage (20 MB)");
			tableRef.current = resolved;
			setTableState(resolved);
			schedule();
		},
		[schedule],
	);

	const changeTitle = (v) => {
		setTitle(v);
		titleRef.current = v;
		schedule();
	};

	// live registry: the AI assistant reads/writes this editor, not the last IndexedDB save
	useEffect(() => {
		const api = {
			get: () => ({ title: titleRef.current, table: tableRef.current }),
			apply: (fn, nextTitle) => {
				commit(fn);
				if (nextTitle != null) changeTitle(nextTitle);
			},
			save: flush,
		};
		registerEditor(id, api);
		return () => {
			unregisterEditor(id, api);
			if (timer.current) flush();
		};
	}, [id]); // eslint-disable-line react-hooks/exhaustive-deps

	/* ---------- mutations ---------- */
	const setCell = useCallback(
		(rowId, colId, value) =>
			commit((t) => ({
				...t,
				rows: t.rows.map((r) => {
					if (r.id !== rowId) return r;
					const cells = { ...r.cells };
					if (value === undefined) delete cells[colId];
					else cells[colId] = value;
					return { ...r, cells };
				}),
			})),
		[commit],
	);
	const updateColumn = useCallback((colId, patch) => commit((t) => ({ ...t, columns: t.columns.map((c) => (c.id === colId ? { ...c, ...patch } : c)) })), [commit]);

	const addRow = () => {
		commit((t) => ({ ...t, rows: [...t.rows, makeRow()] }));
		setPagination((p) => ({ ...p, pageIndex: Math.floor(tableRef.current.rows.length / p.pageSize) }));
	};
	const addColumn = (name, type) => commit((t) => ({ ...t, columns: [...t.columns, makeColumn(name, type)] }));
	const deleteRow = (rowId) => {
		const t = tableRef.current;
		const index = t.rows.findIndex((r) => r.id === rowId);
		const row = t.rows[index];
		commit({ ...t, rows: t.rows.filter((r) => r.id !== rowId) });
		toast("Row deleted", {
			action: { label: "Undo", onClick: () => commit((cur) => ({ ...cur, rows: [...cur.rows.slice(0, index), row, ...cur.rows.slice(index)] })) },
		});
	};
	const deleteSelected = () => {
		const ids = new Set(Object.keys(rowSelection));
		commit((t) => ({ ...t, rows: t.rows.filter((r) => !ids.has(r.id)) }));
		setRowSelection({});
		setPagination((p) => ({ ...p, pageIndex: 0 }));
		setConfirmRows(false);
		toast.success(`${ids.size} row${ids.size > 1 ? "s" : ""} deleted`);
	};
	const duplicateColumn = (col) =>
		commit((t) => {
			const copy = { ...col, id: uid(), name: `${col.name} copy`, options: col.options?.map((o) => ({ ...o, id: uid() })) };
			const map = new Map((col.options || []).map((o, i) => [o.id, copy.options[i].id]));
			return {
				...t,
				columns: [...t.columns.slice(0, t.columns.findIndex((c) => c.id === col.id) + 1), copy, ...t.columns.slice(t.columns.findIndex((c) => c.id === col.id) + 1)],
				rows: t.rows.map((r) => (r.cells[col.id] === undefined ? r : { ...r, cells: { ...r.cells, [copy.id]: col.type === "chips" ? map.get(r.cells[col.id]) : r.cells[col.id] } })),
			};
		});
	const deleteColumn = (colId) =>
		commit((t) => ({
			...t,
			columns: t.columns.filter((c) => c.id !== colId),
			rows: t.rows.map((r) => {
				if (!(colId in r.cells)) return r;
				const cells = { ...r.cells };
				delete cells[colId];
				return { ...r, cells };
			}),
		}));

	/* ---------- column width (drag the right edge of a header) ---------- */
	const onResize = (e, colId, start) => {
		e.preventDefault();
		e.stopPropagation();
		const x0 = e.clientX;
		const move = (ev) => updateColumn(colId, { width: Math.max(90, Math.min(700, start + ev.clientX - x0)) });
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};

	/* ---------- TanStack table ---------- */
	const cellCtx = useMemo(
		() => ({
			tables: tablesMap,
			tableList: tables,
			selfId: id,
			openTable: app.openNote,
			createLinked: async (name) => {
				const rec = await db.notes.add({ userId: "local-user", title: name, content: serializeTable({ v: 1, columns: [makeColumn("Name"), makeColumn("Notes")], rows: [makeRow(), makeRow(), makeRow()] }), parentId: id, createdAt: Date.now(), updatedAt: Date.now(), isSynced: true });
				return { id: rec, title: name, parentId: id };
			},
			updateColumn,
			isDark: isDarkMode,
		}),
		[tablesMap, tables, id, app.openNote, updateColumn, isDarkMode],
	);

	const columns = useMemo(
		() =>
			table.columns.map((col) => ({
				id: col.id,
				accessorFn: (row) => row.cells[col.id],
				cell: CellRenderer,
				sortingFn: (a, b, colId) => compare(col, a.getValue(colId), b.getValue(colId), tablesMapRef.current),
				filterFn: (row, colId, ruleList) => ruleList.every((r) => matchRule(col, row.getValue(colId), r, tablesMapRef.current)),
				enableSorting: true,
			})),
		[table.columns],
	);
	const columnsById = useMemo(() => new Map(table.columns.map((c) => [c.id, c])), [table.columns]);

	const columnFilters = useMemo(() => {
		const by = new Map();
		for (const r of rules) by.set(r.col, [...(by.get(r.col) || []), r]);
		return [...by].filter(([colId]) => table.columns.some((c) => c.id === colId)).map(([colId, value]) => ({ id: colId, value }));
	}, [rules, table.columns]);

	const rt = useReactTable({
		data: table.rows,
		columns,
		state: { sorting, globalFilter: search, columnFilters, rowSelection, pagination },
		getRowId: (r) => r.id,
		meta: { columnsById, setCell },
		enableRowSelection: true,
		autoResetPageIndex: false,
		onSortingChange: setSorting,
		onRowSelectionChange: setRowSelection,
		onPaginationChange: setPagination,
		globalFilterFn: (row, _c, q) => {
			const needle = String(q).toLowerCase();
			return table.columns.some((c) => cellText(c, row.original.cells[c.id], tablesMapRef.current).toLowerCase().includes(needle));
		},
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const pageRows = rt.getRowModel().rows;
	const filteredCount = rt.getFilteredRowModel().rows.length;
	const pageCount = Math.max(1, Math.ceil(filteredCount / pagination.pageSize));
	const pageIndex = Math.min(pagination.pageIndex, pageCount - 1);
	const selectedCount = Object.keys(rowSelection).length;
	const dragRows = sorting.length === 0 && !search && rules.length === 0;
	const widthOf = (c) => c.width || typeOf(c.type).width;
	const tableWidth = 52 + table.columns.reduce((s, c) => s + widthOf(c), 0) + 56;

	/* ---------- drag & drop ---------- */
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
	// dnd-kit renders hidden helper text; keep it out of <table>/<thead>
	const a11y = useMemo(() => ({ container: typeof document !== "undefined" ? document.body : undefined }), []);
	const onColumnDrag = ({ active, over }) => {
		if (!over || active.id === over.id) return;
		commit((t) => {
			const from = t.columns.findIndex((c) => c.id === active.id);
			const to = t.columns.findIndex((c) => c.id === over.id);
			return { ...t, columns: arrayMove(t.columns, from, to) };
		});
	};
	const onRowDrag = ({ active, over }) => {
		if (!over || active.id === over.id) return;
		commit((t) => {
			const from = t.rows.findIndex((r) => r.id === active.id);
			const to = t.rows.findIndex((r) => r.id === over.id);
			return { ...t, rows: arrayMove(t.rows, from, to) };
		});
	};

	/* ---------- header actions ---------- */
	const copyMarkdown = async () => {
		await navigator.clipboard.writeText(tableToMarkdown(table, title, tablesMap));
		toast.success("Table copied as Markdown");
	};
	const askAboutSelection = () => {
		const ids = new Set(Object.keys(rowSelection));
		const sub = { ...table, rows: table.rows.filter((r) => ids.has(r.id)) };
		app.askAI({ noteId: id, title: title || "Untitled", text: tableToMarkdown(sub, "", tablesMap) });
	};
	const doExport = async (format) => {
		try {
			await exportTable(format, table, title, tablesMap);
		} catch (e) {
			toast.error(`Export failed: ${e.message}`);
		}
	};

	const noColumns = table.columns.length === 0;

	return (
		<TableCtx.Provider value={cellCtx}>
			<div className="relative flex h-full flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
				{/* ---------------- header ---------------- */}
				<div className="shrink-0 px-6 pb-3 pt-5">
					{breadcrumb.length > 1 && (
						<div className="mb-2 flex min-w-0 items-center gap-2">
							<button type="button" onClick={() => onNavigateNote?.(breadcrumb[breadcrumb.length - 2].id)} className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200" title="Back">
								<ArrowLeft className="h-4 w-4" />
							</button>
							<div className="flex min-w-0 items-center gap-1.5 text-xs text-zinc-400">
								{breadcrumb.map((crumb, i) => (
									<React.Fragment key={crumb.id}>
										{i > 0 && <span className="text-zinc-300 dark:text-zinc-600">/</span>}
										<button type="button" onClick={() => onNavigateNote?.(crumb.id)} className={cn("truncate transition-colors", i === breadcrumb.length - 1 ? "font-semibold text-zinc-600 dark:text-zinc-300" : "hover:text-zinc-700 dark:hover:text-zinc-200")}>
											{crumb.title || "Untitled"}
										</button>
									</React.Fragment>
								))}
							</div>
						</div>
					)}
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0 flex-1">
							<input
								type="text"
								value={title}
								onChange={(e) => changeTitle(e.target.value)}
								placeholder="Untitled table"
								className="w-full border-none bg-transparent text-2xl font-black tracking-tight outline-none placeholder:opacity-25"
							/>
							<p className="mt-0.5 text-xs text-zinc-500">Everything is saved in your browser. Click a header to sort, drag the grips to reorder.</p>
						</div>
						<div className="flex shrink-0 items-center gap-1">
							{saving && (
								<div className="mr-1 flex animate-pulse items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-400 dark:bg-zinc-900">
									<Loader2 className="h-3 w-3 animate-spin" /> SAVING
								</div>
							)}
							<button type="button" onClick={copyMarkdown} className={iconBtn} title="Copy table as Markdown"><Copy className="h-4 w-4" /></button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild><button type="button" className={iconBtn} title="Download table"><Download className="h-4 w-4" /></button></DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuLabel>Download as</DropdownMenuLabel>
									<DropdownMenuItem onSelect={() => doExport("pdf")}>PDF (.pdf)</DropdownMenuItem>
									<DropdownMenuItem onSelect={() => doExport("csv")}>CSV (.csv)</DropdownMenuItem>
									<DropdownMenuItem onSelect={() => doExport("html")}>HTML (.html)</DropdownMenuItem>
									<DropdownMenuItem onSelect={() => doExport("md")}>Markdown (.md)</DropdownMenuItem>
									<DropdownMenuItem onSelect={() => doExport("json")}>JSON (.json)</DropdownMenuItem>
									<DropdownMenuItem onSelect={() => doExport("sql")}>SQL (.sql)</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							<button type="button" onClick={() => setCodeOpen(true)} className={iconBtn} title="View as SQL, React, JSON…"><Code2 className="h-4 w-4" /></button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild><button type="button" className={iconBtn} title="Split view: open another table beside this one"><Columns2 className="h-4 w-4" /></button></DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-60">
									<DropdownMenuLabel>Open beside this table</DropdownMenuLabel>
									<DropdownMenuItem onSelect={() => onSplitNew?.()}><Plus /> New table</DropdownMenuItem>
									<DropdownMenuSeparator />
									<div className="hide-scrollbar max-h-56 overflow-y-auto">
										{splitCandidates.length === 0 && <div className="px-2.5 py-2 text-xs text-muted-foreground">No other tables</div>}
										{splitCandidates.slice(0, 30).map((n) => (
											<DropdownMenuItem key={n.id} onSelect={() => onSplitPick?.(n.id)}>
												<NoteIcon note={n} size={14} />
												<span className="truncate">{n.title || "Untitled"}</span>
											</DropdownMenuItem>
										))}
									</div>
								</DropdownMenuContent>
							</DropdownMenu>
							<button type="button" onClick={() => setConfirmTable(true)} className={cn(iconBtn, "hover:text-red-500 dark:hover:text-red-400")} title="Delete table"><Trash2 className="h-4 w-4" /></button>
						</div>
					</div>
				</div>

				{/* ---------------- toolbar ---------------- */}
				<div className="flex shrink-0 flex-wrap items-center gap-2 px-6 pb-3">
					<div className="relative w-56 max-w-full">
						<Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
						<input
							value={search}
							onChange={(e) => { setSearch(e.target.value); rt.setPageIndex(0); }}
							placeholder="Search rows…"
							className="h-8 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-7 text-xs outline-none transition-shadow placeholder:text-zinc-400 focus:ring-2 focus:ring-ring dark:border-zinc-800 dark:bg-zinc-900"
						/>
						{search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"><X className="h-3 w-3" /></button>}
					</div>
					<FiltersPopover columns={table.columns} rules={rules} onChange={(r) => { setRules(r); rt.setPageIndex(0); }} open={filtersOpen} onOpenChange={setFiltersOpen} />
					{sorting.length > 0 && (
						<button type="button" onClick={() => setSorting([])} className="flex h-8 items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3 text-xs font-medium text-zinc-700 dark:border-indigo-500/60 dark:bg-zinc-900 dark:text-zinc-200" title="Clear sort">
							{sorting[0].desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />} {table.columns.find((c) => c.id === sorting[0].id)?.name}
							<X className="h-3 w-3 text-zinc-400" />
						</button>
					)}
					<span className="rounded-full border bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold dark:bg-zinc-900">{filteredCount.toLocaleString()} rows</span>
					<span className="rounded-full border bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold dark:bg-zinc-900">{table.columns.length} columns</span>

					<div className="ml-auto flex items-center gap-2">
						{selectedCount > 0 && (
							<>
								<span className="text-xs font-medium text-zinc-500">{selectedCount} selected</span>
								<button type="button" onClick={askAboutSelection} className={lightBtn}><Sparkles className="h-3.5 w-3.5" /> Ask AI</button>
								<button type="button" onClick={() => setConfirmRows(true)} className={cn(lightBtn, "text-red-600 dark:text-red-400")}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
								<button type="button" onClick={() => setRowSelection({})} className={lightBtn}>Clear</button>
							</>
						)}
						<button type="button" onClick={addRow} disabled={noColumns} className={lightBtn}><Plus className="h-3.5 w-3.5" /> Add row</button>
					</div>
				</div>

				{/* ---------------- table ---------------- */}
				<div className="min-h-0 flex-1 px-6 pb-2">
					{noColumns ? (
						<div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 text-center dark:border-zinc-800">
							<p className="text-sm font-semibold">This table has no columns yet</p>
							<p className="max-w-xs text-xs text-zinc-500">Add a column, or start from one of 100 ready-made tables.</p>
							<div className="flex gap-2">
								<AddColumn onAdd={addColumn} />
								<button type="button" onClick={onOpenGallery} className={lightBtn}>Browse gallery</button>
							</div>
						</div>
					) : (
						<div className="hide-scrollbar h-full overflow-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
							<table className="border-separate border-spacing-0 text-sm" style={{ width: tableWidth, minWidth: "100%", borderCollapse: "separate" }}>
								<thead className="sticky top-0 z-10">
									<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onColumnDrag} accessibility={a11y}>
										<SortableContext items={table.columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
											<tr>
												<th className="sticky left-0 z-20 h-11 w-[52px] min-w-[52px] border-b border-r border-zinc-200 bg-zinc-50 px-3 text-left align-middle dark:border-zinc-800 dark:bg-zinc-900">
													<Checkbox
														label="Select all rows"
														checked={rt.getIsAllRowsSelected()}
														indeterminate={rt.getIsSomeRowsSelected() && !rt.getIsAllRowsSelected()}
														onChange={rt.getToggleAllRowsSelectedHandler()}
													/>
												</th>
												{rt.getHeaderGroups()[0].headers.map((header) => {
													const col = table.columns.find((c) => c.id === header.column.id);
													return (
														<HeaderCell
															key={header.id}
															header={header}
															col={col}
															width={widthOf(col)}
															onResize={onResize}
															menu={
																<ColumnMenu
																	column={col}
																	sorted={header.column.getIsSorted()}
																	onRename={(name) => updateColumn(col.id, { name })}
																	onType={(type) => commit((t) => convertColumn(t, col.id, type, tablesMapRef.current))}
																	onSort={(dir) => (dir ? header.column.toggleSorting(dir === "desc", false) : header.column.clearSorting())}
																	onFilter={() => { setRules((r) => [...r, defaultRule(col)]); setFiltersOpen(true); }}
																	onDuplicate={() => duplicateColumn(col)}
																	onDelete={() => deleteColumn(col.id)}
																>
																	<button type="button" title="Edit column" className="shrink-0 rounded p-0.5 text-zinc-400 opacity-0 hover:text-zinc-700 group-hover/h:opacity-100 dark:hover:text-zinc-200"><MoreHorizontal className="h-3.5 w-3.5" /></button>
																</ColumnMenu>
															}
														/>
													);
												})}
												<th className="h-11 w-14 min-w-[56px] border-b border-zinc-200 bg-zinc-50 px-2 text-center align-middle dark:border-zinc-800 dark:bg-zinc-900/60">
													<AddColumn onAdd={addColumn} disabled={table.columns.length >= LIMITS.COLUMNS} />
												</th>
											</tr>
										</SortableContext>
									</DndContext>
								</thead>
								<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onRowDrag} accessibility={a11y}>
									<SortableContext items={pageRows.map((r) => r.original.id)} strategy={verticalListSortingStrategy}>
										<tbody>
											{pageRows.map((row) => (
												<SortableRow key={row.original.id} row={row.original} dragEnabled={dragRows}>
													{({ handle }) => (
														<>
															<td className="sticky left-0 z-[1] h-12 w-[52px] border-r border-zinc-100 bg-inherit px-2 align-middle dark:border-zinc-900">
																<div className="flex items-center gap-1">
																	<span {...(handle || {})} title={handle ? "Drag to reorder row" : "Clear sort and filters to reorder"} className={cn("-ml-0.5 text-zinc-300 opacity-0 group-hover/r:opacity-100", handle ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed")}>
																		<GripVertical className="h-3.5 w-3.5" />
																	</span>
																	<Checkbox label="Select row" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
																</div>
															</td>
															{row.getVisibleCells().map((cell) => {
																const col = table.columns.find((c) => c.id === cell.column.id);
																return (
																	<td key={cell.id} style={{ width: widthOf(col), minWidth: widthOf(col), maxWidth: widthOf(col) }} className="h-12 border-r border-zinc-100 px-3 py-1 align-middle last:border-r-0 dark:border-zinc-900">
																		{flexRender(cell.column.columnDef.cell, cell.getContext())}
																	</td>
																);
															})}
															<td className="h-12 w-14 px-2 text-center align-middle">
																<button type="button" onClick={() => deleteRow(row.original.id)} title="Delete row" className="rounded-md p-1 text-zinc-300 opacity-0 transition-opacity hover:text-red-500 group-hover/r:opacity-100">
																	<Trash2 className="h-3.5 w-3.5" />
																</button>
															</td>
														</>
													)}
												</SortableRow>
											))}
											{pageRows.length === 0 && (
												<tr>
													<td colSpan={table.columns.length + 2} className="py-14 text-center text-xs text-zinc-400">
														{table.rows.length === 0 ? "No rows yet. Add one to get started." : "No rows match your search or filters."}
													</td>
												</tr>
											)}
											<tr>
												<td colSpan={table.columns.length + 2} className="p-0">
													<button type="button" onClick={addRow} className="flex h-10 w-full items-center gap-2 px-4 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200">
														<Plus className="h-3.5 w-3.5" /> New row
													</button>
												</td>
											</tr>
										</tbody>
									</SortableContext>
								</DndContext>
							</table>
						</div>
					)}
				</div>

				{/* ---------------- footer (pagination) ---------------- */}
				{!noColumns && (
					<div className="flex shrink-0 items-center justify-between gap-3 px-6 pb-3 pt-1 text-xs text-zinc-500">
						<span>
							{filteredCount === 0 ? "0 rows" : `${pageIndex * pagination.pageSize + 1}–${Math.min(filteredCount, (pageIndex + 1) * pagination.pageSize)} of ${filteredCount.toLocaleString()}`}
							<span className="ml-2 text-zinc-300 dark:text-zinc-600">limit {LIMITS.ROWS.toLocaleString()} rows · {LIMITS.COLUMNS} columns</span>
						</span>
						<div className="flex items-center gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild><button type="button" className="rounded-lg border px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900">{pagination.pageSize} / page</button></DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{[25, 50, 100, 200].map((n) => <DropdownMenuItem key={n} onSelect={() => setPagination({ pageIndex: 0, pageSize: n })}>{n} rows per page</DropdownMenuItem>)}
								</DropdownMenuContent>
							</DropdownMenu>
							<button type="button" disabled={pageIndex === 0} onClick={() => rt.setPageIndex(pageIndex - 1)} className="rounded-lg border p-1 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-900"><ChevronLeft className="h-3.5 w-3.5" /></button>
							<span className="tabular-nums">{pageIndex + 1} / {pageCount}</span>
							<button type="button" disabled={pageIndex >= pageCount - 1} onClick={() => rt.setPageIndex(pageIndex + 1)} className="rounded-lg border p-1 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-900"><ChevronRight className="h-3.5 w-3.5" /></button>
						</div>
					</div>
				)}

				<CodeViewModal open={codeOpen} onOpenChange={setCodeOpen} table={table} title={title} tables={tablesMap} />

				<Dialog open={confirmTable} onOpenChange={setConfirmTable}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete “{title || "Untitled"}”?</DialogTitle>
							<DialogDescription>
								This removes the table, its {table.rows.length.toLocaleString()} rows and any tables nested inside it from your browser. This can’t be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<button type="button" className={lightBtn} onClick={() => setConfirmTable(false)}>Cancel</button>
							<button type="button" className="flex h-8 items-center gap-1.5 rounded-xl bg-destructive px-3 text-xs font-medium text-destructive-foreground hover:opacity-90" onClick={() => { setConfirmTable(false); onDeleteTable?.(initialNote); }}>
								<Trash2 className="h-3.5 w-3.5" /> Delete table
							</button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={confirmRows} onOpenChange={setConfirmRows}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete {selectedCount} selected row{selectedCount > 1 ? "s" : ""}?</DialogTitle>
							<DialogDescription>The rows are removed from this table. This can’t be undone.</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<button type="button" className={lightBtn} onClick={() => setConfirmRows(false)}>Cancel</button>
							<button type="button" className="flex h-8 items-center gap-1.5 rounded-xl bg-destructive px-3 text-xs font-medium text-destructive-foreground hover:opacity-90" onClick={deleteSelected}>
								<Trash2 className="h-3.5 w-3.5" /> Delete rows
							</button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</TableCtx.Provider>
	);
};

export default TableEditor;
