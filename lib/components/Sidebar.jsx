import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	pointerWithin,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	ChevronDown,
	ChevronRight,
	Columns2,
	FilePlus,
	FileText,
	Folder,
	FolderPlus,
	GripVertical,
	Menu,
	Moon,
	Network,
	Plus,
	Search,
	Settings,
	Sun,
	Trash,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "./ui/button";
import NoteIcon from "./NoteIcon";
import IconPicker from "./IconPicker";
import { HugeiconsIcon } from "@hugeicons/react";
import { PaintBoardIcon } from "@hugeicons/core-free-icons";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { noteService } from "../db/noteService";
import { db as localDb } from "../db/localDb";
import { cn } from "../utils/cn";

const noteMatchesQuery = (note, query) => {
	if (!query) return true;
	const q = query.toLowerCase();
	return (
		note.title?.toLowerCase().includes(q) ||
		note.content?.replace(/<[^>]*>/g, "").toLowerCase().includes(q)
	);
};

const isSelfOrDescendant = (noteId, ancestorId, byId) => {
	if (noteId == null || ancestorId == null) return false;
	if (noteId === ancestorId) return true;
	let current = byId.get(noteId);
	const seen = new Set();
	while (current?.parentId != null && !seen.has(current.id)) {
		if (current.parentId === ancestorId) return true;
		seen.add(current.id);
		current = byId.get(current.parentId);
	}
	return false;
};

const countDescendants = (id, childrenByParent) =>
	(childrenByParent.get(id) || []).reduce(
		(sum, c) => sum + 1 + countDescendants(c.id, childrenByParent),
		0,
	);

/* One row of the tree: draggable (move it) and droppable (nest into it). */
const NoteTreeItem = React.memo(function NoteTreeItem({
	note,
	childrenByParent,
	visibleIds,
	activeId,
	openIds,
	searchQuery,
	onToggle,
	onSelect,
	onSplit,
	onDelete,
	onIconChange,
	expandedFor,
}) {
	const drag = useDraggable({ id: note.id });
	const drop = useDroppable({ id: note.id });
	const children = (childrenByParent.get(note.id) || []).filter(
		(c) => !visibleIds || visibleIds.has(c.id),
	);
	const hasChildren = children.length > 0;
	const expanded = expandedFor(note.id) || Boolean(searchQuery);
	const isActive = activeId === note.id;
	const isOpen = openIds.includes(note.id);

	return (
		<div>
			<div
				ref={(el) => {
					drag.setNodeRef(el);
					drop.setNodeRef(el);
				}}
				{...drag.listeners}
				{...drag.attributes}
				className={cn(
					"group relative flex w-full cursor-grab items-center rounded-xl text-left transition-all active:cursor-grabbing",
					isActive
						? "bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
						: isOpen
							? "bg-white/60 ring-1 ring-zinc-100 dark:bg-zinc-900/60 dark:ring-zinc-900"
							: "hover:bg-white/50 dark:hover:bg-zinc-900/50",
					drag.isDragging && "opacity-40",
					drop.isOver && !drag.isDragging && "bg-indigo-50 ring-2 ring-indigo-400 dark:bg-indigo-950/40",
				)}
			>
				{hasChildren ? (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onToggle(note.id, !expanded);
						}}
						className="ml-1 flex-shrink-0 rounded-md p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
						title={expanded ? "Collapse" : "Expand"}
					>
						{expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
					</button>
				) : (
					<span className="ml-1 w-4 flex-shrink-0" />
				)}
				<IconPicker note={note} onChange={(value) => onIconChange(note, value)}>
					<button
						type="button"
						title="Change icon"
						onClick={(e) => e.stopPropagation()}
						className="ml-0.5 flex-shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
					>
						<NoteIcon note={note} size={14} />
					</button>
				</IconPicker>
				<button
					type="button"
					onClick={() => onSelect(note.id)}
					className="flex min-w-0 flex-1 items-center gap-1.5 py-2.5 pl-1 pr-20 text-left"
				>
					<span
						className={cn(
							"block truncate text-[11px] font-bold",
							isActive ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-700 dark:text-zinc-300",
						)}
					>
						{note.title || "Untitled"}
					</span>
				</button>
				<div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-hover:opacity-100">
					<span title="Drag to move into another note or folder" className="p-1 text-zinc-300">
						<GripVertical className="h-3 w-3" />
					</span>
					<button
						type="button"
						title="Open to the side"
						onClick={(e) => {
							e.stopPropagation();
							onSplit(note.id);
						}}
						className="p-1 text-zinc-300 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
					>
						<Columns2 className="h-3 w-3" />
					</button>
					<button
						type="button"
						title="Delete"
						onClick={(e) => {
							e.stopPropagation();
							onDelete(note);
						}}
						className="p-1 text-zinc-300 transition-colors hover:text-red-500"
					>
						<Trash className="h-3 w-3" />
					</button>
				</div>
			</div>
			{hasChildren && expanded && (
				<div className="ml-3 space-y-0.5 border-l border-zinc-100 pl-2 dark:border-zinc-800">
					{children.map((child) => (
						<NoteTreeItem
							key={child.id}
							note={child}
							childrenByParent={childrenByParent}
							visibleIds={visibleIds}
							activeId={activeId}
							openIds={openIds}
							searchQuery={searchQuery}
							onToggle={onToggle}
							onSelect={onSelect}
							onSplit={onSplit}
							onDelete={onDelete}
							onIconChange={onIconChange}
							expandedFor={expandedFor}
						/>
					))}
				</div>
			)}
		</div>
	);
});

const RootDropZone = () => {
	const { setNodeRef, isOver } = useDroppable({ id: "root" });
	return (
		<div
			ref={setNodeRef}
			className={cn(
				"rounded-xl border border-dashed bg-zinc-50 px-3 py-2 text-center dark:bg-zinc-950 text-[10px] font-bold uppercase tracking-widest transition-colors",
				isOver
					? "border-indigo-400 bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40"
					: "border-zinc-200 text-zinc-400 dark:border-zinc-800",
			)}
		>
			Move to top level
		</div>
	);
};

const Sidebar = ({ notes, user, mcpConnected, onOpenConfig }) => {
	const app = useApp();
	const { isDarkMode, toggleTheme } = useTheme();
	const [searchQuery, setSearchQuery] = useState("");
	const [expandOverrides, setExpandOverrides] = useState(() => new Map());
	const [pendingDelete, setPendingDelete] = useState(null);
	const [dragNote, setDragNote] = useState(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	const byId = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);
	const childrenByParent = useMemo(() => {
		const map = new Map();
		for (const note of notes) {
			if (note.parentId == null) continue;
			if (!map.has(note.parentId)) map.set(note.parentId, []);
			map.get(note.parentId).push(note);
		}
		for (const list of map.values()) list.sort((a, b) => b.updatedAt - a.updatedAt);
		return map;
	}, [notes]);
	const rootNotes = useMemo(
		() =>
			notes
				.filter((n) => n.parentId == null || !byId.has(n.parentId))
				.sort((a, b) => b.updatedAt - a.updatedAt),
		[notes, byId],
	);

	const visibleIds = useMemo(() => {
		if (!searchQuery) return null;
		const visible = new Set();
		const mark = (note) => {
			let childVisible = false;
			for (const child of childrenByParent.get(note.id) || []) {
				if (mark(child)) childVisible = true;
			}
			if (noteMatchesQuery(note, searchQuery) || childVisible) {
				visible.add(note.id);
				return true;
			}
			return false;
		};
		rootNotes.forEach(mark);
		return visible;
	}, [searchQuery, childrenByParent, rootNotes]);
	const filteredRoots = visibleIds ? rootNotes.filter((n) => visibleIds.has(n.id)) : rootNotes;

	// Ancestors of the open notes are expanded by default (derived, no effect needed).
	const defaultExpanded = useMemo(() => {
		const set = new Set();
		for (const id of app.tabIds) {
			let current = byId.get(id);
			const seen = new Set();
			while (current?.parentId != null && !seen.has(current.id)) {
				set.add(current.parentId);
				seen.add(current.id);
				current = byId.get(current.parentId);
			}
		}
		return set;
	}, [app.tabIds, byId]);
	const expandedFor = useCallback(
		(id) => (expandOverrides.has(id) ? expandOverrides.get(id) : defaultExpanded.has(id)),
		[expandOverrides, defaultExpanded],
	);
	const setExpanded = useCallback(
		(id, value) => setExpandOverrides((prev) => new Map(prev).set(id, value)),
		[],
	);

	const handleSelect = useCallback(
		(id) => {
			app.openNote(id);
			if (window.innerWidth < 768) app.setSidebarOpen(false);
		},
		[app.openNote, app.setSidebarOpen], // eslint-disable-line react-hooks/exhaustive-deps
	);

	/* ---- add file / folder: root when nothing is open, otherwise inside the active note ---- */
	const activeNote = byId.get(app.activeId);
	const createItem = async (isFolder) => {
		try {
			const note = await noteService.saveNote(user.uid, {
				title: isFolder ? "New folder" : "Untitled Note",
				content: isFolder ? "<p></p>" : "<p>Start typing...</p>",
				parentId: activeNote?.id,
				isFolder,
			});
			if (activeNote) setExpanded(activeNote.id, true);
			app.openNote(note.id);
			toast.success(isFolder ? "Folder created" : "Note created");
		} catch {
			toast.error("Failed to create");
		}
	};

	/* ---- icon / emoji (stored on the note in IndexedDB; no reorder, so updatedAt is untouched) ---- */
	const changeIcon = useCallback(
		(note, value) => localDb.notes.update(note.id, { icon: value || undefined }),
		[],
	);

	/* ---- delete (always behind a confirmation dialog) ---- */
	const confirmDelete = async () => {
		const target = pendingDelete;
		setPendingDelete(null);
		if (!target) return;
		try {
			await noteService.deleteNote(target.id);
			for (const id of app.tabIds) {
				if (isSelfOrDescendant(id, target.id, byId)) app.closeNote(id);
			}
			toast.success("Deleted");
		} catch {
			toast.error("Failed to delete");
		}
	};

	/* ---- drag & drop: drop on a note to nest, on the top strip to un-nest ---- */
	const onDragEnd = async ({ active, over }) => {
		setDragNote(null);
		if (!over || over.id === active.id) return;
		const parentId = over.id === "root" ? undefined : over.id;
		if (parentId != null && isSelfOrDescendant(parentId, active.id, byId)) {
			return toast.error("Can't move a note into itself");
		}
		if (byId.get(active.id)?.parentId === parentId) return;
		await localDb.notes.update(active.id, { parentId, updatedAt: Date.now() });
		if (parentId != null) setExpanded(parentId, true);
	};

	const target = activeNote ? `inside “${activeNote.title || "Untitled"}”` : "at the top level";

	return (
		<>
			{app.sidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
					onClick={() => app.setSidebarOpen(false)}
				/>
			)}

			<AnimatePresence>
				{app.sidebarCollapsed && (
					<motion.button
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						onClick={() => app.setSidebarCollapsed(false)}
						className="absolute left-4 top-4 z-50 hidden items-center justify-center rounded-xl border border-zinc-200 bg-white p-2.5 shadow-xl transition-all hover:scale-110 dark:border-zinc-800 dark:bg-zinc-900 md:flex"
						title="Show sidebar (⌘B)"
					>
						<Menu className="h-4 w-4 text-zinc-400" />
					</motion.button>
				)}
			</AnimatePresence>

			<aside
				className={cn(
					// floating rounded card (style from main)
					"fixed bottom-2 left-2 top-2 z-50 flex w-[min(18rem,calc(100%-1rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-950 md:static md:z-auto md:my-2 md:ml-2 md:h-[calc(100%-1rem)] md:w-72 md:shrink-0",
					app.sidebarOpen ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0",
					app.sidebarCollapsed && "md:hidden",
				)}
			>
				<div className="flex h-full flex-col p-5">
					<div className="mb-6 flex items-center justify-between">
						<h1 className="text-lg font-black tracking-tight">OpenNote</h1>
						<div className="flex items-center gap-1">
							<button
								onClick={() => app.setSidebarCollapsed(true)}
								className="hidden rounded-xl p-2 text-zinc-400 transition-all hover:bg-white hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 md:flex"
								title="Collapse sidebar (⌘B)"
							>
								<Menu className="h-4 w-4" />
							</button>
							<button
								type="button"
								title="Themes"
								onClick={() => app.setThemesOpen(!app.themesOpen)}
								className={`rounded-xl p-2 transition-all hover:bg-white hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 ${app.themesOpen ? "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" : "text-zinc-400"}`}
							>
								<HugeiconsIcon icon={PaintBoardIcon} size={16} strokeWidth={1.8} />
							</button>
							<button
								onClick={toggleTheme}
								className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-white hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
							>
								{isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
							</button>
						</div>
					</div>

					<div className="mb-3 flex items-center gap-2">
						<div className="relative flex-1">
							<Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-300" />
							<input
								type="text"
								placeholder="Search notes..."
								className="w-full rounded-xl border-none bg-white py-2 pl-10 pr-4 text-xs shadow-sm outline-none transition-all placeholder:text-zinc-300 focus:ring-1 focus:ring-zinc-500/20 dark:bg-zinc-900"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="icon" className="h-8 w-8 shrink-0 rounded-xl" title={`New ${target}`}>
									<Plus />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel>Create {target}</DropdownMenuLabel>
								<DropdownMenuItem onSelect={() => createItem(false)}>
									<FilePlus /> New note
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => createItem(true)}>
									<FolderPlus /> New folder
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<DndContext
						sensors={sensors}
						collisionDetection={pointerWithin}
						onDragStart={({ active }) => setDragNote(byId.get(active.id) || null)}
						onDragCancel={() => setDragNote(null)}
						onDragEnd={onDragEnd}
					>
						<div className="relative flex min-h-0 flex-1 flex-col">
						{/* floats over the list so starting a drag never shifts the rows */}
						{dragNote && (
							<div className="absolute inset-x-0 bottom-0 z-10">
								<RootDropZone />
							</div>
						)}
						<div className="hide-scrollbar -mx-1 flex-1 space-y-0.5 overflow-y-auto hide-scrollbar px-1 pb-12">
							{filteredRoots.length > 0 ? (
								filteredRoots.map((note) => (
									<NoteTreeItem
										key={note.id}
										note={note}
										childrenByParent={childrenByParent}
										visibleIds={visibleIds}
										activeId={app.activeId}
										openIds={app.tabIds}
										searchQuery={searchQuery}
										onToggle={setExpanded}
										onSelect={handleSelect}
										onSplit={app.openSplit}
										onDelete={setPendingDelete}
										onIconChange={changeIcon}
										expandedFor={expandedFor}
									/>
								))
							) : (
								<div className="flex flex-col items-center gap-2 py-12 text-center text-zinc-300">
									<p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
										No Results
									</p>
								</div>
							)}
						</div>
						</div>
						<DragOverlay dropAnimation={null}>
							{dragNote && (
								<div className="rounded-xl border bg-white px-3 py-2 text-[11px] font-bold shadow-lg dark:bg-zinc-900">
									{dragNote.title || "Untitled"}
								</div>
							)}
						</DragOverlay>
					</DndContext>

					<div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-900">
						<div className="flex items-center justify-between px-2 py-1">
							<div className="flex items-center gap-2">
								<div className={`h-1.5 w-1.5 rounded-full ${mcpConnected ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-800"}`} />
								<span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</span>
							</div>
							<span className={`text-[10px] font-bold ${mcpConnected ? "text-green-600 dark:text-green-400" : "text-zinc-400"}`}>
								{mcpConnected ? "MCP" : "OFFLINE"}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-1.5">
							<Link
								href="/graph-notes"
								className="group flex items-center justify-center gap-2 rounded-xl border border-transparent bg-white p-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 shadow-sm transition-all hover:border-zinc-500/20 dark:bg-zinc-900"
							>
								<Network className="h-3.5 w-3.5" />
								Map
							</Link>
							<button
								onClick={onOpenConfig}
								className="group flex items-center justify-center gap-2 rounded-xl border border-transparent bg-white p-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 shadow-sm transition-all hover:border-zinc-500/20 dark:bg-zinc-900"
							>
								<Settings className="h-3.5 w-3.5" />
								Config
							</button>
						</div>
						<div className="p-2 pl-12 text-xs">
							<p>
								Built using{" "}
								<a href="https://buildsaas.dev" className="text-indigo-500">
									BuildSaaS
								</a>
							</p>
							<p>
								Fully open-source,{" "}
								<a
									href="https://github.com/shreyvijayvargiya/opennote"
									className="text-indigo-500"
									target="_blank"
									rel="noreferrer"
								>
									OpenNote
								</a>
							</p>
						</div>
					</div>
				</div>
			</aside>

			<Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete “{pendingDelete?.title || "Untitled"}”?</DialogTitle>
						<DialogDescription>
							{pendingDelete && countDescendants(pendingDelete.id, childrenByParent) > 0
								? `This also deletes ${countDescendants(pendingDelete.id, childrenByParent)} nested page(s). `
								: ""}
							This can't be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="ghost" onClick={() => setPendingDelete(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default Sidebar;
