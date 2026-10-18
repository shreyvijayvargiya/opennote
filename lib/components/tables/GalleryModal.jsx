import React, { useMemo, useState } from "react";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { GALLERY_CATEGORIES, TEMPLATES, TEMPLATE_COUNT, searchTemplates } from "../../tables/gallery";
import { createFromTemplate } from "../../tables/tableService";
import { cellText, chipStyle, typeOf } from "../../tables/schema";
import { cn } from "../../utils/cn";

/** Tiny read-only table: header + 3 rows × up to 4 columns, chips colored. */
export const TemplatePreview = ({ tpl }) => {
	const { isDarkMode } = useTheme();
	const cols = tpl.columns.slice(0, 4);
	return (
		<div className="overflow-hidden rounded-lg border border-zinc-200 bg-white text-[10px] dark:border-zinc-800 dark:bg-zinc-950">
			<div className="grid bg-zinc-50 dark:bg-zinc-900" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
				{cols.map((c) => (
					<div key={c.id} className="truncate border-r border-zinc-200 px-2 py-1.5 font-semibold text-zinc-500 last:border-r-0 dark:border-zinc-800">{c.name}</div>
				))}
			</div>
			{tpl.rows.slice(0, 3).map((r) => (
				<div key={r.id} className="grid border-t border-zinc-200 dark:border-zinc-800" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
					{cols.map((c) => {
						const v = r.cells[c.id];
						const opt = c.type === "chips" ? c.options.find((o) => o.id === v) : null;
						return (
							<div key={c.id} className="flex min-w-0 items-center border-r border-zinc-100 px-2 py-1.5 last:border-r-0 dark:border-zinc-900">
								{opt ? (
									<span className="truncate rounded px-1.5 py-0.5 font-medium" style={chipStyle(opt.color, isDarkMode)}>{opt.label}</span>
								) : c.type === "checkbox" ? (
									<span className={cn("flex h-3 w-3 items-center justify-center rounded-sm border", v ? "border-indigo-500 bg-indigo-500 text-white" : "border-zinc-300")}>{v && <Check className="h-2 w-2" strokeWidth={4} />}</span>
								) : (
									<span className="truncate text-zinc-700 dark:text-zinc-300">{cellText(c, v) || <span className="text-zinc-300">–</span>}</span>
								)}
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
};

const GalleryModal = () => {
	const app = useApp();
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState("All");
	const [catOpen, setCatOpen] = useState(false);
	const results = useMemo(() => searchTemplates(query, category, 100), [query, category]);
	const counts = useMemo(() => {
		const m = new Map();
		for (const t of TEMPLATES) m.set(t.category, (m.get(t.category) || 0) + 1);
		return m;
	}, []);

	const add = async (tpl) => {
		try {
			const rec = await createFromTemplate(tpl);
			app.setGalleryOpen(false);
			app.openNote(rec.id);
			toast.success(`Added “${tpl.name}”`);
		} catch (e) {
			toast.error(e.message);
		}
	};

	return (
		<Dialog open={app.galleryOpen} onOpenChange={app.setGalleryOpen}>
			<DialogContent className="flex h-[min(46rem,90vh)] max-w-5xl flex-col gap-3 overflow-hidden p-5">
				<DialogHeader className="shrink-0">
					<DialogTitle>Table gallery</DialogTitle>
					<DialogDescription>{TEMPLATE_COUNT} ready-made tables for CRMs, leads, pipelines, digital products, e-commerce and more. Pick one and edit it.</DialogDescription>
				</DialogHeader>
				<div className="flex shrink-0 items-center gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
						<input
							autoFocus
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Try “table for leads whatsapp”, “invoice”, “habit”…"
							className="h-10 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
					<Popover open={catOpen} onOpenChange={setCatOpen}>
						<PopoverTrigger asChild>
							<button type="button" className="flex h-10 w-48 items-center justify-between rounded-xl border bg-background px-3 text-sm">
								<span className="truncate">{category === "All" ? "All categories" : category}</span>
								<ChevronDown className="h-4 w-4 text-zinc-400" />
							</button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-56 p-1">
							<button type="button" onClick={() => { setCategory("All"); setCatOpen(false); }} className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent">
								<span>All categories</span><span className="text-xs text-zinc-400">{TEMPLATE_COUNT}</span>
							</button>
							{GALLERY_CATEGORIES.map(([name, emoji]) => (
								<button key={name} type="button" onClick={() => { setCategory(name); setCatOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent", category === name && "bg-accent")}>
									<span>{emoji}</span><span className="flex-1">{name}</span><span className="text-xs text-zinc-400">{counts.get(name)}</span>
								</button>
							))}
						</PopoverContent>
					</Popover>
				</div>
				<div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
					{results.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center gap-1 text-center">
							<p className="text-sm font-semibold">No table matches “{query}”</p>
							<p className="text-xs text-zinc-500">Try a different word, or start from a blank table.</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{results.map((tpl) => (
								<div key={tpl.id} className="group flex flex-col gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
									<TemplatePreview tpl={tpl} />
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-2">
											<h3 className="truncate text-sm font-semibold">{tpl.name}</h3>
											<span className="shrink-0 rounded-full bg-zinc-200/70 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">{tpl.category}</span>
										</div>
										<p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{tpl.description}</p>
										<p className="mt-1 truncate text-[10px] text-zinc-400">{tpl.columns.map((c) => c.name).join(" · ")}</p>
									</div>
									<button type="button" onClick={() => add(tpl)} className="flex h-8 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
										<Plus className="h-3.5 w-3.5" /> Add table
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default GalleryModal;
