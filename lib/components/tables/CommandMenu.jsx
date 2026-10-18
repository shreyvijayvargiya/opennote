import React, { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { BookOpen, FileUp, LayoutGrid, Moon, Palette, Plug, Plus, Search, Sparkles, Sun, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import NoteIcon from "../NoteIcon";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { TEMPLATES, searchTemplates } from "../../tables/gallery";
import { createFromTemplate, createTable } from "../../tables/tableService";
import { emptyTable, parseTable } from "../../tables/schema";
import { cn } from "../../utils/cn";

const POPULAR = ["WhatsApp Leads", "Sales Pipeline", "Product Inventory", "Local Business Leads", "Invoice Tracker"].map((n) => TEMPLATES.find((t) => t.name === n)).filter(Boolean);

/** ⌘K: your tables, gallery examples, AI assistant, theme toggle, MCP config. */
const CommandMenu = ({ tables }) => {
	const app = useApp();
	const { isDarkMode, toggleTheme } = useTheme();
	const [q, setQ] = useState("");
	const [index, setIndex] = useState(0);

	const close = () => {
		app.setCommandOpen(false);
		setQ("");
		setIndex(0);
	};
	const tableFuse = useMemo(() => new Fuse(tables.filter((t) => !t.isFolder || true), { keys: ["title"], threshold: 0.4, ignoreLocation: true }), [tables]);

	const items = useMemo(() => {
		const query = q.trim().toLowerCase();
		const out = [];
		const mine = query ? tableFuse.search(query).slice(0, 6).map((r) => r.item) : [...tables].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
		for (const t of mine) out.push({ id: `t${t.id}`, section: "Your tables", label: t.title || "Untitled", hint: t.isFolder ? "folder" : `${parseTable(t.content).rows.length} rows`, icon: <NoteIcon note={t} size={15} />, run: () => app.openNote(t.id) });
		const gallery = query ? searchTemplates(query).slice(0, 5) : POPULAR;
		for (const tpl of gallery) {
			out.push({
				id: `g${tpl.id}`,
				section: "Add from gallery",
				label: tpl.name,
				hint: tpl.category,
				icon: <Table2 className="h-4 w-4" />,
				run: async () => {
					try {
						const rec = await createFromTemplate(tpl);
						app.openNote(rec.id);
						toast.success(`Added “${tpl.name}”`);
					} catch (e) {
						toast.error(e.message);
					}
				},
			});
		}
		const actions = [
			{ label: "New table", hint: "blank", icon: <Plus className="h-4 w-4" />, run: async () => { try { const r = await createTable({ title: "Untitled table", table: emptyTable() }); app.openNote(r.id); } catch (e) { toast.error(e.message); } } },
			{ label: "Browse table gallery", hint: "100 tables", icon: <LayoutGrid className="h-4 w-4" />, run: () => app.setGalleryOpen(true) },
			{ label: "Import CSV / Excel", hint: "file", icon: <FileUp className="h-4 w-4" />, run: () => app.setImportOpen(true) },
			{ label: "Ask the AI assistant", hint: "⌘L", icon: <Sparkles className="h-4 w-4" />, run: () => app.openChat() },
			{ label: isDarkMode ? "Switch to light theme" : "Switch to dark theme", hint: "theme", icon: isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />, run: () => toggleTheme() },
			{ label: "Color themes", hint: "10 themes", icon: <Palette className="h-4 w-4" />, run: () => app.setThemesOpen(true) },
			{ label: "Getting started & docs", hint: "docs", icon: <BookOpen className="h-4 w-4" />, run: () => app.setDocsOpen(true) },
			{ label: "MCP config", hint: "connect Claude", icon: <Plug className="h-4 w-4" />, run: () => app.setConfigOpen(true) },
		];
		for (const a of actions) if (!query || a.label.toLowerCase().includes(query) || a.hint.toLowerCase().includes(query)) out.push({ id: `a${a.label}`, section: "Actions", ...a });
		return out;
	}, [q, tables, tableFuse, app, isDarkMode, toggleTheme]); // eslint-disable-line react-hooks/exhaustive-deps

	const active = Math.min(index, Math.max(0, items.length - 1));
	const run = (item) => {
		close();
		item?.run();
	};
	let lastSection = null;

	return (
		<Dialog open={app.commandOpen} onOpenChange={(o) => (o ? app.setCommandOpen(true) : close())}>
			<DialogContent className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
				<DialogTitle className="sr-only">Search</DialogTitle>
				<DialogDescription className="sr-only">Search tables, add gallery examples and run actions</DialogDescription>
				<div className="flex items-center gap-2 border-b px-4">
					<Search className="h-4 w-4 text-zinc-400" />
					<input
						autoFocus
						value={q}
						onChange={(e) => { setQ(e.target.value); setIndex(0); }}
						onKeyDown={(e) => {
							if (e.key === "ArrowDown") { e.preventDefault(); setIndex((active + 1) % items.length); }
							if (e.key === "ArrowUp") { e.preventDefault(); setIndex((active - 1 + items.length) % items.length); }
							if (e.key === "Enter") { e.preventDefault(); run(items[active]); }
						}}
						placeholder="Search tables, examples (try “whatsapp leads”) or actions…"
						className="h-12 flex-1 bg-transparent pr-6 text-sm outline-none"
					/>
				</div>
				<div className="hide-scrollbar max-h-[22rem] overflow-y-auto p-1.5">
					{items.map((item, i) => {
						const header = item.section !== lastSection ? item.section : null;
						lastSection = item.section;
						return (
							<React.Fragment key={item.id}>
								{header && <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{header}</div>}
								<button
									type="button"
									onMouseEnter={() => setIndex(i)}
									onClick={() => run(item)}
									className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm", i === active ? "bg-zinc-100 dark:bg-zinc-800" : "")}
								>
									<span className="text-zinc-500">{item.icon}</span>
									<span className="flex-1 truncate">{item.label}</span>
									<span className="text-xs text-zinc-400">{item.hint}</span>
								</button>
							</React.Fragment>
						);
					})}
					{items.length === 0 && <div className="py-10 text-center text-sm text-zinc-400">Nothing found</div>}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CommandMenu;
