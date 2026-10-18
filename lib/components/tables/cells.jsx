import React, { useRef, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import {
	Bold,
	Check,
	ChevronDown,
	Download,
	ExternalLink,
	Italic,
	Link2,
	Pencil,
	Plus,
	Search,
	Star,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Slider } from "../ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import NoteIcon from "../NoteIcon";
import IconPicker from "../IconPicker";
import { useTableCtx } from "./context";
import {
	AVATARS,
	CHIP_COLORS,
	CODE_LANGS,
	DIAL_CODES,
	LIMITS,
	avatarOf,
	chipColor,
	chipStyle,
	makeOption,
	textValue,
} from "../../tables/schema";
import { highlightCode } from "../../tables/highlight";
import { downloadDataUrl, fileToCell, formatBytes, imageToCell } from "../../tables/files";
import { cn } from "../../utils/cn";

/* ------------------------------ shared bits ------------------------------ */
export const Chip = ({ color, children, className }) => {
	const { isDark } = useTableCtx();
	return (
		<span
			className={cn("inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5 text-xs font-medium", className)}
			style={chipStyle(color, isDark)}
		>
			{children}
		</span>
	);
};

export const AvatarBubble = ({ id, size = 24 }) => {
	const a = avatarOf(id);
	if (!a) return null;
	return (
		<span
			className="inline-flex shrink-0 items-center justify-center rounded-full leading-none"
			style={{ width: size, height: size, background: a[2], fontSize: size * 0.58 }}
			title={a[0]}
		>
			{a[1]}
		</span>
	);
};

const Empty = ({ children = "Empty" }) => <span className="text-xs text-zinc-300 dark:text-zinc-600">{children}</span>;

const Trigger = React.forwardRef(({ className, children, ...props }, ref) => (
	<div
		ref={ref}
		role="button"
		tabIndex={0}
		className={cn("flex min-h-[2rem] w-full cursor-pointer items-center rounded-md text-left outline-none", className)}
		{...props}
	>
		{children}
	</div>
));
Trigger.displayName = "Trigger";

const stop = (e) => e.stopPropagation();

/* ------------------------------ text (bold / italic / link) ------------------------------ */
const TextCell = ({ value, onChange }) => {
	const raw = textValue(value) ?? "";
	const fmt = value && typeof value === "object" ? value : {};
	const [draft, setDraft] = useState("");
	const [f, setF] = useState({});
	const [linkOpen, setLinkOpen] = useState(false);
	const [open, setOpen] = useState(false);

	const begin = () => {
		setDraft(String(raw));
		setF({ b: fmt.b, i: fmt.i, href: fmt.href });
		setLinkOpen(false);
	};
	const commit = () => {
		const has = f.b || f.i || f.href;
		const next = has && draft ? { t: draft, ...(f.b && { b: 1 }), ...(f.i && { i: 1 }), ...(f.href && { href: f.href }) } : draft;
		if (JSON.stringify(next) !== JSON.stringify(value ?? "")) onChange(next === "" ? undefined : next);
	};
	const toggle = (k) => setF((p) => ({ ...p, [k]: p[k] ? 0 : 1 }));
	const tb = (active) =>
		cn("flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800", active && "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100");

	return (
		<Popover
			open={open}
			onOpenChange={(o) => {
				if (o) begin();
				else commit();
				setOpen(o);
			}}
		>
			<PopoverTrigger asChild>
				<Trigger>
					{raw !== "" ? (
						<span className={cn("line-clamp-2 break-words text-sm", fmt.b && "font-bold", fmt.i && "italic")}>
							{fmt.href ? (
								<a href={fmt.href} target="_blank" rel="noreferrer" onClick={stop} className="text-indigo-600 underline decoration-indigo-300 underline-offset-2 dark:text-indigo-300">
									{String(raw)}
								</a>
							) : (
								String(raw)
							)}
						</span>
					) : (
						<span className="h-5 w-full" />
					)}
				</Trigger>
			</PopoverTrigger>
			<PopoverContent className="w-[19rem] p-2" onClick={stop}>
				<div className="mb-1.5 flex items-center gap-0.5">
					<button type="button" title="Bold" onClick={() => toggle("b")} className={tb(f.b)}><Bold className="h-3.5 w-3.5" /></button>
					<button type="button" title="Italic" onClick={() => toggle("i")} className={tb(f.i)}><Italic className="h-3.5 w-3.5" /></button>
					<button type="button" title="Link" onClick={() => setLinkOpen((v) => !v)} className={tb(f.href || linkOpen)}><Link2 className="h-3.5 w-3.5" /></button>
					<span className="ml-auto pr-1 text-[10px] text-zinc-400">Enter to save</span>
				</div>
				{(linkOpen || f.href) && (
					<div className="mb-1.5 flex items-center gap-1">
						<input
							value={f.href || ""}
							onChange={(e) => setF((p) => ({ ...p, href: e.target.value }))}
							placeholder="https://…"
							className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
						/>
						{f.href && (
							<button type="button" title="Remove link" onClick={() => setF((p) => ({ ...p, href: "" }))} className={tb(false)}><X className="h-3.5 w-3.5" /></button>
						)}
					</div>
				)}
				<textarea
					autoFocus
					rows={3}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							setOpen(false);
							commit();
						}
					}}
					className={cn("w-full resize-none rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring", f.b && "font-bold", f.i && "italic")}
				/>
			</PopoverContent>
		</Popover>
	);
};

/* ------------------------------ number / link (inline) ------------------------------ */
const InlineInput = ({ value, onChange, type = "text", placeholder, render }) => {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState("");
	const start = () => {
		setDraft(value == null ? "" : String(value));
		setEditing(true);
	};
	const commit = () => {
		setEditing(false);
		const v = draft.trim();
		const next = v === "" ? undefined : type === "number" ? (Number.isNaN(Number(v)) ? value : Number(v)) : v;
		if (next !== value) onChange(next);
	};
	if (editing) {
		return (
			<input
				autoFocus
				type={type === "number" ? "number" : "text"}
				value={draft}
				placeholder={placeholder}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === "Enter") e.currentTarget.blur();
					if (e.key === "Escape") setEditing(false);
				}}
				className="h-8 w-full rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
			/>
		);
	}
	return (
		<Trigger onClick={start} onKeyDown={(e) => e.key === "Enter" && start()}>
			{render(value)}
		</Trigger>
	);
};

const NumberCell = (p) => (
	<InlineInput {...p} type="number" render={(v) => (v == null || v === "" ? <span className="h-5 w-full" /> : <span className="text-sm tabular-nums">{Number(v).toLocaleString()}</span>)} />
);

const hostOf = (u) => {
	try {
		return new URL(/^https?:\/\//.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "");
	} catch {
		return u;
	}
};
const LinkCell = (p) => (
	<InlineInput
		{...p}
		placeholder="https://…"
		render={(v) =>
			v ? (
				<a
					href={/^https?:\/\//.test(v) ? v : `https://${v}`}
					target="_blank"
					rel="noreferrer"
					onClick={stop}
					className="inline-flex max-w-full items-center gap-1 truncate text-sm text-indigo-600 hover:underline dark:text-indigo-300"
				>
					<span className="truncate">{hostOf(v)}</span>
					<ExternalLink className="h-3 w-3 shrink-0" />
				</a>
			) : (
				<span className="h-5 w-full" />
			)
		}
	/>
);

/* ------------------------------ checkbox / rating ------------------------------ */
const CheckboxCell = ({ value, onChange }) => (
	<button
		type="button"
		onClick={() => onChange(value ? undefined : true)}
		className={cn(
			"flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors",
			value ? "border-indigo-500 bg-indigo-500 text-white" : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900",
		)}
		aria-checked={Boolean(value)}
		role="checkbox"
	>
		{value && <Check className="h-3 w-3" strokeWidth={3} />}
	</button>
);

const RatingCell = ({ value, onChange }) => (
	<div className="flex items-center gap-0.5">
		{[1, 2, 3, 4, 5].map((n) => (
			<button key={n} type="button" onClick={() => onChange(value === n ? undefined : n)} title={`${n}`} className="p-0.5">
				<Star className={cn("h-4 w-4 transition-colors", n <= (value || 0) ? "fill-amber-400 text-amber-400" : "text-zinc-300 hover:text-amber-300 dark:text-zinc-600")} />
			</button>
		))}
	</div>
);

/* ------------------------------ date ------------------------------ */
const DateCell = ({ value, onChange }) => {
	const [open, setOpen] = useState(false);
	const date = value ? parseISO(value) : undefined;
	const ok = date && isValid(date);
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Trigger>{ok ? <span className="text-sm">{format(date, "MMM d, yyyy")}</span> : <span className="h-5 w-full" />}</Trigger>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-2" onClick={stop}>
				<Calendar
					mode="single"
					selected={ok ? date : undefined}
					defaultMonth={ok ? date : undefined}
					onSelect={(d) => {
						onChange(d ? format(d, "yyyy-MM-dd") : undefined);
						setOpen(false);
					}}
				/>
				<div className="flex justify-between border-t px-1 pt-2">
					<button type="button" className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200" onClick={() => { onChange(format(new Date(), "yyyy-MM-dd")); setOpen(false); }}>Today</button>
					<button type="button" className="text-xs text-zinc-500 hover:text-red-500" onClick={() => { onChange(undefined); setOpen(false); }}>Clear</button>
				</div>
			</PopoverContent>
		</Popover>
	);
};

/* ------------------------------ chips (colored, editable) ------------------------------ */
const ChipsCell = ({ column, value, onChange }) => {
	const { updateColumn } = useTableCtx();
	const options = column.options || [];
	const [q, setQ] = useState("");
	const [editing, setEditing] = useState(null); // option id being edited
	const current = options.find((o) => o.id === value);
	const shown = options.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()));
	const exact = options.some((o) => o.label.toLowerCase() === q.trim().toLowerCase());

	const setOptions = (next) => updateColumn(column.id, { options: next });
	const add = () => {
		const label = q.trim();
		if (!label) return;
		const opt = makeOption(label, options.length);
		setOptions([...options, opt]);
		onChange(opt.id);
		setQ("");
	};

	return (
		<Popover onOpenChange={(o) => !o && (setQ(""), setEditing(null))}>
			<PopoverTrigger asChild>
				<Trigger>{current ? <Chip color={current.color}>{current.label}</Chip> : <span className="h-5 w-full" />}</Trigger>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-1.5" onClick={stop}>
				<div className="relative mb-1">
					<Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" />
					<input
						autoFocus
						value={q}
						onChange={(e) => setQ(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && !exact && add()}
						placeholder="Search or create…"
						className="h-8 w-full rounded-md bg-transparent pl-7 pr-2 text-xs outline-none"
					/>
				</div>
				<div className="hide-scrollbar max-h-56 space-y-0.5 overflow-y-auto">
					{shown.map((o) => (
						<div key={o.id}>
							<div className="group flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
								<button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onChange(value === o.id ? undefined : o.id)}>
									<Chip color={o.color}>{o.label}</Chip>
									{value === o.id && <Check className="h-3.5 w-3.5 text-zinc-500" />}
								</button>
								<button type="button" title="Edit label & color" onClick={() => setEditing(editing === o.id ? null : o.id)} className="rounded p-1 text-zinc-400 opacity-0 hover:text-zinc-700 group-hover:opacity-100 dark:hover:text-zinc-200">
									<Pencil className="h-3 w-3" />
								</button>
							</div>
							{editing === o.id && (
								<div className="mx-1 mb-1 space-y-2 rounded-lg border bg-background p-2">
									<input
										value={o.label}
										onChange={(e) => setOptions(options.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)))}
										className="h-7 w-full rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
									/>
									<div className="flex flex-wrap gap-1.5">
										{CHIP_COLORS.map((c) => (
											<button
												key={c.id}
												type="button"
												title={c.id}
												onClick={() => setOptions(options.map((x) => (x.id === o.id ? { ...x, color: c.id } : x)))}
												className={cn("flex h-5 w-5 items-center justify-center rounded-full ring-offset-1 ring-offset-background", o.color === c.id && "ring-2 ring-zinc-400")}
												style={{ background: c.dot }}
											>
												{o.color === c.id && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
											</button>
										))}
									</div>
									<button
										type="button"
										onClick={() => {
											setOptions(options.filter((x) => x.id !== o.id));
											if (value === o.id) onChange(undefined);
											setEditing(null);
										}}
										className="flex items-center gap-1 text-[11px] text-red-500 hover:underline"
									>
										<Trash2 className="h-3 w-3" /> Delete option
									</button>
								</div>
							)}
						</div>
					))}
					{shown.length === 0 && !q && <div className="px-2 py-3 text-center text-xs text-zinc-400">No options yet</div>}
				</div>
				{q.trim() && !exact && (
					<button type="button" onClick={add} className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800">
						<Plus className="h-3 w-3" /> Create <Chip color="gray">{q.trim()}</Chip>
					</button>
				)}
			</PopoverContent>
		</Popover>
	);
};

/* ------------------------------ table link ------------------------------ */
const TableLinkCell = ({ value, onChange }) => {
	const { tables, tableList, selfId, openTable, createLinked } = useTableCtx();
	const [q, setQ] = useState("");
	const [open, setOpen] = useState(false);
	const target = value != null ? tables.get(value) : null;
	const list = tableList.filter((t) => t.id !== selfId && !t.isFolder && (!q || (t.title || "").toLowerCase().includes(q.toLowerCase())));
	return (
		<Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
			<div className="flex w-full min-w-0 items-center gap-1">
				{target ? (
					<button
						type="button"
						onClick={() => openTable(target.id)}
						title={`Open “${target.title}”`}
						className="inline-flex min-w-0 items-center gap-1.5 rounded-md border bg-zinc-50 px-1.5 py-0.5 text-xs font-medium hover:border-indigo-300 hover:bg-indigo-50 dark:bg-zinc-900 dark:hover:bg-indigo-950/40"
					>
						<NoteIcon note={target} size={12} className="text-zinc-500" />
						<span className="truncate">{target.title || "Untitled"}</span>
					</button>
				) : value != null ? (
					<span className="text-xs text-zinc-400 line-through">deleted table</span>
				) : null}
				<PopoverTrigger asChild>
					<Trigger className={cn("w-auto min-w-[1.5rem] flex-1", target && "justify-end")}>
						{!target && value == null ? <span className="text-xs text-zinc-300 dark:text-zinc-600">Link a table</span> : <ChevronDown className="h-3.5 w-3.5 text-zinc-300" />}
					</Trigger>
				</PopoverTrigger>
			</div>
			<PopoverContent className="w-64 p-1.5" onClick={stop}>
				<div className="relative mb-1">
					<Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" />
					<input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tables…" className="h-8 w-full rounded-md bg-transparent pl-7 pr-2 text-xs outline-none" />
				</div>
				<div className="hide-scrollbar max-h-52 overflow-y-auto">
					{list.slice(0, 50).map((t) => (
						<button
							key={t.id}
							type="button"
							onClick={() => { onChange(t.id); setOpen(false); }}
							className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
						>
							<NoteIcon note={t} size={14} className="text-zinc-500" />
							<span className="flex-1 truncate">{t.title || "Untitled"}</span>
							{t.id === value && <Check className="h-3.5 w-3.5 text-zinc-500" />}
						</button>
					))}
					{list.length === 0 && <div className="px-2 py-3 text-center text-xs text-zinc-400">No tables found</div>}
				</div>
				<div className="mt-1 flex items-center justify-between border-t pt-1">
					<button
						type="button"
						onClick={async () => {
							const t = await createLinked(q.trim() || "Untitled table");
							if (t) { onChange(t.id); setOpen(false); }
						}}
						className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
					>
						<Plus className="h-3 w-3" /> New linked table
					</button>
					{value != null && <button type="button" onClick={() => { onChange(undefined); setOpen(false); }} className="px-2 text-xs text-zinc-400 hover:text-red-500">Unlink</button>}
				</div>
			</PopoverContent>
		</Popover>
	);
};

/* ------------------------------ phone ------------------------------ */
const splitPhone = (v = "") => {
	const m = String(v).match(/^(\+\d{1,3})\s*(.*)$/);
	return m ? [m[1], m[2]] : ["+1", String(v)];
};
const PhoneCell = ({ value, onChange }) => {
	const [code, num] = splitPhone(value);
	const [c, setC] = useState(code);
	const [n, setN] = useState(num);
	const commit = () => {
		const next = n.trim() ? `${c} ${n.trim()}` : undefined;
		if (next !== value) onChange(next);
	};
	return (
		<Popover onOpenChange={(o) => { if (o) { const [a, b] = splitPhone(value); setC(a); setN(b); } else commit(); }}>
			<PopoverTrigger asChild>
				<Trigger>
					{value ? (
						<a href={`tel:${String(value).replace(/\s/g, "")}`} onClick={stop} className="text-sm tabular-nums hover:underline">{value}</a>
					) : (
						<span className="h-5 w-full" />
					)}
				</Trigger>
			</PopoverTrigger>
			<PopoverContent className="w-72 p-2" onClick={stop}>
				<div className="flex items-center gap-1.5">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button type="button" className="flex h-8 shrink-0 items-center gap-1 rounded-md border bg-background px-2 text-xs">{c} <ChevronDown className="h-3 w-3" /></button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="max-h-56 overflow-y-auto hide-scrollbar">
							{DIAL_CODES.map(([d, name]) => (
								<DropdownMenuItem key={d} onSelect={() => setC(d)}>{d} <span className="text-zinc-400">{name}</span></DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
					<input autoFocus type="tel" value={n} onChange={(e) => setN(e.target.value.replace(/[^\d\s-]/g, ""))} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} placeholder="Phone number" className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
				</div>
			</PopoverContent>
		</Popover>
	);
};

/* ------------------------------ slider ------------------------------ */
const SliderCell = ({ value, onChange }) => {
	const v = Number(value) || 0;
	const [live, setLive] = useState(v);
	return (
		<Popover onOpenChange={(o) => o && setLive(v)}>
			<PopoverTrigger asChild>
				<Trigger className="gap-2">
					<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
						<div className="h-full rounded-full bg-indigo-500" style={{ width: `${v}%` }} />
					</div>
					<span className="w-8 text-right text-xs tabular-nums text-zinc-500">{value == null ? "–" : `${v}%`}</span>
				</Trigger>
			</PopoverTrigger>
			<PopoverContent className="w-60 p-3" onClick={stop}>
				<div className="mb-2 flex items-center justify-between text-xs text-zinc-500"><span>Value</span><span className="font-medium text-foreground">{live}%</span></div>
				<Slider value={[live]} min={0} max={100} step={1} onValueChange={([x]) => setLive(x)} onValueCommit={([x]) => onChange(x)} />
			</PopoverContent>
		</Popover>
	);
};

/* ------------------------------ otp ------------------------------ */
const OtpCell = ({ value, onChange }) => {
	const digits = String(value || "").padEnd(6, " ").slice(0, 6).split("");
	const refs = useRef([]);
	const set = (i, ch) => {
		const arr = digits.map((d) => (d === " " ? "" : d));
		arr[i] = ch;
		const out = arr.join("").replace(/\s/g, "");
		onChange(out || undefined);
	};
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Trigger className="gap-1">
					{value ? String(value).split("").map((d, i) => <span key={i} className="flex h-5 w-4 items-center justify-center rounded border bg-zinc-50 font-mono text-[10px] dark:bg-zinc-900">{d}</span>) : <span className="h-5 w-full" />}
				</Trigger>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-3" onClick={stop}>
				<div className="mb-2 text-xs text-zinc-500">6-digit code</div>
				<div className="flex gap-1.5" onPaste={(e) => { const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (t) { e.preventDefault(); onChange(t); refs.current[Math.min(t.length, 5)]?.focus(); } }}>
					{digits.map((d, i) => (
						<input
							key={i}
							ref={(el) => (refs.current[i] = el)}
							autoFocus={i === 0}
							inputMode="numeric"
							maxLength={1}
							value={d === " " ? "" : d}
							onChange={(e) => {
								const ch = e.target.value.replace(/\D/g, "").slice(-1);
								set(i, ch);
								if (ch && i < 5) refs.current[i + 1]?.focus();
							}}
							onKeyDown={(e) => {
								if (e.key === "Backspace" && !(d.trim()) && i > 0) refs.current[i - 1]?.focus();
							}}
							className="h-10 w-9 rounded-lg border bg-background text-center font-mono text-base outline-none focus:ring-2 focus:ring-ring"
						/>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
};

/* ------------------------------ files ------------------------------ */
const FilesCell = ({ value, onChange }) => {
	const files = Array.isArray(value) ? value : [];
	const input = useRef(null);
	const add = async (list) => {
		try {
			const room = LIMITS.FILES_PER_CELL - files.length;
			if (room <= 0) return toast.error(`Max ${LIMITS.FILES_PER_CELL} files per cell`);
			const added = await Promise.all([...list].slice(0, room).map(fileToCell));
			onChange([...files, ...added]);
		} catch (e) {
			toast.error(e.message);
		}
	};
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Trigger className="gap-1">
					{files.length ? (
						<>
							<Chip color="gray" className="max-w-[8rem]">{files[0].name}</Chip>
							{files.length > 1 && <span className="text-xs text-zinc-400">+{files.length - 1}</span>}
						</>
					) : (
						<span className="h-5 w-full" />
					)}
				</Trigger>
			</PopoverTrigger>
			<PopoverContent className="w-72 p-2" onClick={stop}>
				<div className="space-y-1">
					{files.map((f, i) => (
						<div key={i} className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs">
							<span className="min-w-0 flex-1 truncate" title={f.name}>{f.name}</span>
							<span className="text-zinc-400">{formatBytes(f.size)}</span>
							<button type="button" title="Download" onClick={() => downloadDataUrl(f)} className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"><Download className="h-3.5 w-3.5" /></button>
							<button type="button" title="Remove" onClick={() => onChange(files.filter((_, k) => k !== i).length ? files.filter((_, k) => k !== i) : undefined)} className="text-zinc-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
						</div>
					))}
					{!files.length && <div className="py-3 text-center text-xs text-zinc-400">No files yet</div>}
				</div>
				<input ref={input} type="file" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
				<button type="button" onClick={() => input.current?.click()} className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 text-xs font-medium text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
					<Upload className="h-3.5 w-3.5" /> Upload files
				</button>
				<p className="mt-1.5 text-center text-[10px] text-zinc-400">Zip, CSV, PDF… up to 2 MB each, stored in your browser</p>
			</PopoverContent>
		</Popover>
	);
};

/* ------------------------------ avatar / icon ------------------------------ */
const AvatarCell = ({ value, onChange }) => (
	<Popover>
		<PopoverTrigger asChild>
			<Trigger>{value ? <AvatarBubble id={value} size={26} /> : <span className="h-5 w-full" />}</Trigger>
		</PopoverTrigger>
		<PopoverContent className="w-64 p-2" onClick={stop}>
			<div className="grid grid-cols-6 gap-1">
				{AVATARS.map((a) => (
					<button key={a[0]} type="button" title={a[0]} onClick={() => onChange(value === a[0] ? undefined : a[0])} className={cn("rounded-full p-0.5", value === a[0] && "ring-2 ring-indigo-400")}>
						<AvatarBubble id={a[0]} size={32} />
					</button>
				))}
			</div>
			{value && <button type="button" onClick={() => onChange(undefined)} className="mt-2 w-full text-center text-xs text-zinc-400 hover:text-red-500">Remove</button>}
		</PopoverContent>
	</Popover>
);

const IconCell = ({ value, onChange }) => (
	<IconPicker note={{ icon: value }} onChange={(v) => onChange(v || undefined)}>
		<Trigger>{value ? <NoteIcon note={{ icon: value }} size={18} className="text-zinc-600 dark:text-zinc-300" /> : <span className="h-5 w-full" />}</Trigger>
	</IconPicker>
);

/* ------------------------------ code ------------------------------ */
const CodeCell = ({ column, value, onChange }) => {
	const { updateColumn } = useTableCtx();
	const lang = column.lang || "javascript";
	const [draft, setDraft] = useState("");
	const code = String(value ?? "");
	return (
		<Popover onOpenChange={(o) => { if (o) setDraft(code); else if (draft !== code) onChange(draft || undefined); }}>
			<PopoverTrigger asChild>
				<Trigger>
					{code ? (
						<pre className="hljs-block pointer-events-none max-h-12 w-full overflow-hidden whitespace-pre-wrap break-all rounded-md bg-zinc-100 px-2 py-1 font-mono text-[11px] leading-snug text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200" dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) }} />
					) : (
						<span className="h-5 w-full" />
					)}
				</Trigger>
			</PopoverTrigger>
			<PopoverContent className="w-[26rem] p-2" onClick={stop}>
				<div className="mb-2 flex items-center justify-between">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button type="button" className="flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-xs font-medium">
								{CODE_LANGS.find((l) => l[0] === lang)?.[1] || lang} <ChevronDown className="h-3 w-3" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							{CODE_LANGS.map(([id, label]) => (
								<DropdownMenuItem key={id} onSelect={() => updateColumn(column.id, { lang: id })}>
									{label} {lang === id && <Check className="ml-auto h-3.5 w-3.5" />}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
					<span className="text-[10px] text-zinc-400">Applies to the whole column</span>
				</div>
				<textarea
					autoFocus
					spellCheck={false}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					rows={5}
					className="w-full resize-y rounded-md border bg-zinc-50 px-2 py-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-900"
				/>
				{draft && (
					<pre className="hide-scrollbar mt-2 max-h-40 overflow-auto rounded-md bg-zinc-100 p-2 font-mono text-xs dark:bg-zinc-900" dangerouslySetInnerHTML={{ __html: highlightCode(draft, lang) }} />
				)}
			</PopoverContent>
		</Popover>
	);
};

/* ------------------------------ image ------------------------------ */
const ImageCell = ({ value, onChange }) => {
	const input = useRef(null);
	const pick = async (file) => {
		if (!file) return;
		try {
			onChange(await imageToCell(file));
		} catch (e) {
			toast.error(e.message);
		}
	};
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Trigger>
					{value?.dataUrl ? <img src={value.dataUrl} alt={value.name} className="h-8 w-8 rounded-md border object-cover" /> : <span className="h-5 w-full" />}
				</Trigger>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-2" onClick={stop}>
				{value?.dataUrl && <img src={value.dataUrl} alt={value.name} className="mb-2 max-h-48 w-full rounded-lg border object-contain" />}
				<input ref={input} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
				<div className="flex gap-1.5">
					<button type="button" onClick={() => input.current?.click()} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 text-xs font-medium text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
						<Upload className="h-3.5 w-3.5" /> {value ? "Replace" : "Upload image"}
					</button>
					{value && <button type="button" title="Remove" onClick={() => onChange(undefined)} className="flex h-8 w-8 items-center justify-center rounded-lg border text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>}
				</div>
			</PopoverContent>
		</Popover>
	);
};

/* ------------------------------ entry ------------------------------ */
const CELLS = {
	text: TextCell,
	number: NumberCell,
	checkbox: CheckboxCell,
	date: DateCell,
	chips: ChipsCell,
	link: LinkCell,
	table: TableLinkCell,
	phone: PhoneCell,
	slider: SliderCell,
	otp: OtpCell,
	files: FilesCell,
	rating: RatingCell,
	avatar: AvatarCell,
	icon: IconCell,
	code: CodeCell,
	image: ImageCell,
};

const Cell = ({ column, value, onChange }) => {
	const Comp = CELLS[column.type] || TextCell;
	return <Comp column={column} value={value} onChange={onChange} />;
};

export default Cell;
