import React, { useState, useEffect, useMemo } from "react";
import {
	Plus,
	Search,
	Settings,
	User,
	FileText,
	Network,
	Sun,
	Moon,
	Menu,
	X,
	Key,
	Copy,
	Trash2,
	Trash,
	CalendarCheck,
	ChevronDown,
	ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { useLiveQuery } from "dexie-react-hooks";
import { noteService } from "../lib/db/noteService";
import { db as localDb } from "../lib/db/localDb";
import TiptapEditor from "../lib/components/TiptapEditor";
import { useTheme } from "../lib/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { getNotesTools } from "../lib/mcp/notesTools";

const noteMatchesQuery = (note, query) => {
	if (!query) return true;
	const q = query.toLowerCase();
	return (
		note.title?.toLowerCase().includes(q) ||
		note.content?.replace(/<[^>]*>/g, "").toLowerCase().includes(q)
	);
};

const isSelfOrDescendant = (noteId, ancestorId, notes) => {
	if (noteId == null || ancestorId == null) return false;
	if (noteId === ancestorId) return true;
	const byId = new Map(notes.map((n) => [n.id, n]));
	let current = byId.get(noteId);
	const seen = new Set();
	while (current?.parentId != null && !seen.has(current.id)) {
		if (current.parentId === ancestorId) return true;
		seen.add(current.id);
		current = byId.get(current.parentId);
	}
	return false;
};

const NoteTreeItem = ({
	note,
	childrenByParent,
	visibleIds,
	activeNoteId,
	expandedIds,
	searchQuery,
	onToggle,
	onSelect,
	onDelete,
}) => {
	const children = (childrenByParent.get(note.id) || []).filter(
		(child) => !visibleIds || visibleIds.has(child.id),
	);
	const hasChildren = children.length > 0;
	const isExpanded = expandedIds.has(note.id) || Boolean(searchQuery);
	const isActive = activeNoteId === note.id;

	return (
		<div>
			<div
				className={`w-full text-left rounded-xl transition-all group relative flex items-center ${
					isActive
						? "bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800"
						: "hover:bg-white/50 dark:hover:bg-zinc-900/50"
				}`}
			>
				{hasChildren ? (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onToggle(note.id);
						}}
						className="ml-1 p-0.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex-shrink-0"
						title={isExpanded ? "Collapse" : "Expand"}
					>
						{isExpanded ? (
							<ChevronDown className="w-3 h-3" />
						) : (
							<ChevronRight className="w-3 h-3" />
						)}
					</button>
				) : (
					<span className="w-4 ml-1 flex-shrink-0" />
				)}
				<button
					type="button"
					onClick={() => onSelect(note.id)}
					className="flex-1 min-w-0 text-left p-2.5 pr-8"
				>
					<span
						className={`block font-bold text-[11px] truncate ${isActive ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-700 dark:text-zinc-300"}`}
					>
						{note.title || "Untitled"}
					</span>
				</button>
				<div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDelete(note.id);
						}}
						className="p-1 text-zinc-300 hover:text-red-500 transition-colors"
					>
						<Trash className="w-3 h-3" />
					</button>
				</div>
			</div>
			{hasChildren && isExpanded && (
				<div className="ml-3 pl-2 border-l border-zinc-100 dark:border-zinc-800 space-y-0.5">
					{children.map((child) => (
						<NoteTreeItem
							key={child.id}
							note={child}
							childrenByParent={childrenByParent}
							visibleIds={visibleIds}
							activeNoteId={activeNoteId}
							expandedIds={expandedIds}
							searchQuery={searchQuery}
							onToggle={onToggle}
							onSelect={onSelect}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}
		</div>
	);
};

const IndexPage = () => {
	const { isDarkMode, toggleTheme } = useTheme();
	// Use a mock stable user for initial render to avoid hydration mismatch
	const [user, setUser] = useState({
		uid: "local-user",
		displayName: "Local User",
		photoURL: null,
	});
	const [activeNoteId, setActiveNoteId] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedIds, setExpandedIds] = useState(() => new Set());
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [systemInfo, setSystemInfo] = useState({
		workspacePath: "",
		connectScriptPath: "",
	});

	const [mcpStatus, setMcpStatus] = useState({ connected: false });
	const [isFetchingMcpStatus, setIsFetchingMcpStatus] = useState(false);

	const router = useRouter();

	// Live query for API keys
	const apiKeys = useLiveQuery(() => localDb.apiKeys.toArray()) || [];

	// Fetch MCP Status
	const fetchMcpStatus = async () => {
		setIsFetchingMcpStatus(true);
		try {
			const res = await fetch("/api/mcp-status");
			const data = await res.json();
			setMcpStatus(data);
		} catch (error) {
			console.error("Failed to fetch MCP status:", error);
		} finally {
			setIsFetchingMcpStatus(false);
		}
	};

	// Fetch System Info (Path)
	const fetchSystemInfo = async () => {
		try {
			const res = await fetch("/api/system-info");
			const data = await res.json();
			setSystemInfo(data);
		} catch (error) {
			console.error("Failed to fetch system info:", error);
		}
	};

	useEffect(() => {
		fetchMcpStatus();
		fetchSystemInfo();
		const interval = setInterval(fetchMcpStatus, 10000); // Check every 10s

		// Randomize user identity on client-side only
		const seed = Math.random();
		const newUser = {
			uid: "local-user",
			displayName: "Random User " + Math.floor(seed * 1000),
			photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
		};
		setUser(newUser);

		return () => clearInterval(interval);
	}, []);

	// WebMCP Integration
	useEffect(() => {
		const initWebMCP = () => {
			if (window.WebMCP && !window.webmcp) {
				const wmcp = new window.WebMCP();
				window.webmcp = wmcp;

				// Register tools using the externalized definitions
				const tools = getNotesTools(user);
				tools.forEach((tool) => {
					wmcp.registerTool(tool.name, tool.description, tool.schema, tool.execute);
				});
			}
		};

		if (typeof window !== "undefined") {
			if (window.WebMCP) {
				initWebMCP();
			} else {
				const handleLoad = () => initWebMCP();
				window.addEventListener("load", handleLoad);
				// Also try an interval just in case load already fired or script loads late
				const checkInterval = setInterval(() => {
					if (window.WebMCP) {
						initWebMCP();
						clearInterval(checkInterval);
					}
				}, 1000);
				return () => {
					window.removeEventListener("load", handleLoad);
					clearInterval(checkInterval);
				};
			}
		}
	}, [user]);

	// Fetch Notes Locally with useLiveQuery for real-time updates
	const notes =
		useLiveQuery(() => noteService.getAllNotes(user?.uid), [user?.uid]) || [];

	// Filter Notes
	const childrenByParent = useMemo(() => {
		const map = new Map();
		for (const note of notes) {
			if (note.parentId == null) continue;
			if (!map.has(note.parentId)) map.set(note.parentId, []);
			map.get(note.parentId).push(note);
		}
		for (const list of map.values()) {
			list.sort((a, b) => b.updatedAt - a.updatedAt);
		}
		return map;
	}, [notes]);

	const noteIds = useMemo(() => new Set(notes.map((n) => n.id)), [notes]);

	const rootNotes = useMemo(() => {
		return notes
			.filter((note) => note.parentId == null || !noteIds.has(note.parentId))
			.sort((a, b) => b.updatedAt - a.updatedAt);
	}, [notes, noteIds]);

	const visibleIds = useMemo(() => {
		if (!searchQuery) return null;
		const visible = new Set();
		const mark = (note) => {
			const kids = childrenByParent.get(note.id) || [];
			let childVisible = false;
			for (const child of kids) {
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

	const filteredRootNotes = useMemo(() => {
		if (!visibleIds) return rootNotes;
		return rootNotes.filter((note) => visibleIds.has(note.id));
	}, [rootNotes, visibleIds]);

	const breadcrumb = useMemo(() => {
		if (!activeNoteId) return [];
		const byId = new Map(notes.map((n) => [n.id, n]));
		const path = [];
		let current = byId.get(activeNoteId);
		const seen = new Set();
		while (current && !seen.has(current.id)) {
			path.unshift({ id: current.id, title: current.title || "Untitled" });
			seen.add(current.id);
			current =
				current.parentId != null ? byId.get(current.parentId) : null;
		}
		return path;
	}, [notes, activeNoteId]);

	useEffect(() => {
		if (!activeNoteId) return;
		const byId = new Map(notes.map((n) => [n.id, n]));
		setExpandedIds((prev) => {
			const next = new Set(prev);
			let changed = false;
			let current = byId.get(activeNoteId);
			const seen = new Set();
			while (current?.parentId != null && !seen.has(current.id)) {
				if (!next.has(current.parentId)) {
					next.add(current.parentId);
					changed = true;
				}
				seen.add(current.id);
				current = byId.get(current.parentId);
			}
			if (
				(childrenByParent.get(activeNoteId) || []).length > 0 &&
				!next.has(activeNoteId)
			) {
				next.add(activeNoteId);
				changed = true;
			}
			return changed ? next : prev;
		});
	}, [activeNoteId, notes, childrenByParent]);

	const handleSelectNote = (id) => {
		const numericId = Number(id);
		setActiveNoteId(Number.isNaN(numericId) ? id : numericId);
		if (typeof window !== "undefined" && window.innerWidth < 768) {
			setIsSidebarOpen(false);
		}
	};

	const handleToggleExpanded = (id) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	// Actions
	const handleCreateNote = async () => {
		try {
			const newNote = await noteService.saveNote(user.uid, {
				title: "Untitled Note",
				content: "<p>Start typing...</p>",
			});
			setActiveNoteId(newNote.id);
			toast.success("Note created locally");
		} catch (error) {
			toast.error("Failed to create note");
		}
	};

	const handleDeleteNote = async (id) => {
		try {
			const deleted = notes.find((n) => n.id === id);
			await noteService.deleteNote(id);
			if (isSelfOrDescendant(activeNoteId, id, notes)) {
				setActiveNoteId(deleted?.parentId ?? null);
			}
			toast.success("Note deleted");
		} catch (error) {
			toast.error("Failed to delete note");
		}
	};

	const generateNewApiKey = async () => {
		const newKey = {
			key: `sk_${uuidv4().replace(/-/g, "")}`,
			name: `Key ${apiKeys.length + 1}`,
			createdAt: Date.now(),
		};
		await localDb.apiKeys.add(newKey);
		toast.success("New API Key generated");
	};

	const deleteApiKey = async (id) => {
		await localDb.apiKeys.delete(id);
		toast.success("API Key deleted");
	};

	const activeNote = useMemo(
		() => notes.find((n) => n.id === activeNoteId),
		[notes, activeNoteId],
	);

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard!");
	};

	const getMcpConfig = (apiKey = "YOUR_API_KEY") => ({
		mcpServers: {
			opennote: {
				command: "node",
				args: [
					systemInfo.connectScriptPath ||
						"/path/to/opennote/mcp-server/connect.js",
				],
				env: {
					OpenNote_API_KEY: apiKey,
					OpenNote_URL: "http://localhost:3000",
				},
			},
		},
	});

	return (
		<div
			className={`${isDarkMode ? "dark bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"} font-sans transition-colors duration-300 min-h-screen`}
		>
			{/* Sidebar Overlay (Mobile) */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			<div className="flex h-screen overflow-hidden relative">
				{/* Sidebar Toggle (Floating) */}
				<AnimatePresence>
					{isSidebarCollapsed && (
						<motion.button
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							onClick={() => setIsSidebarCollapsed(false)}
							className={`absolute left-4 top-4 z-50 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl hover:scale-110 transition-all hidden md:flex items-center justify-center group`}
							title="Show Sidebar"
						>
							<Menu className="w-4 h-4 text-zinc-400 group-hover:text-zinc-500 transition-colors" />
						</motion.button>
					)}
				</AnimatePresence>

				{/* Sidebar */}
				<aside
					className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-zinc-100 dark:border-zinc-900 flex flex-col bg-zinc-50/50 dark:bg-zinc-950 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:relative ${
						isSidebarOpen ? "translate-x-0" : "-translate-x-full"
					} ${isSidebarCollapsed ? "md:-ml-72" : "md:ml-0"}`}
				>
					<div className="p-5 flex flex-col h-full">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-2.5">
								<h1 className="text-lg font-black tracking-tight">OpenNote</h1>
							</div>
							<div className="flex items-center gap-1">
								<button
									onClick={() => setIsSidebarCollapsed(true)}
									className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-all text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hidden md:flex"
									title="Collapse Sidebar"
								>
									<Menu className="w-4 h-4" />
								</button>
								<button
									onClick={toggleTheme}
									className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-all text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
								>
									{isDarkMode ? (
										<Sun className="w-4 h-4" />
									) : (
										<Moon className="w-4 h-4" />
									)}
								</button>
								<button
									onClick={handleCreateNote}
									className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 transition-all shadow-md"
								>
									<Plus className="w-4 h-4" />
								</button>
							</div>
						</div>

						<div className="relative mb-3">
							<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
							<input
								type="text"
								placeholder="Search notes..."
								className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border-none rounded-xl text-xs shadow-sm focus:ring-1 focus:ring-zinc-500/20 transition-all outline-none placeholder:text-zinc-300"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<Link
							href="/todos"
							className="flex items-center gap-2.5 p-2.5 mb-4 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-all group"
						>
							<CalendarCheck className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
							<span className="font-bold text-[11px] text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
								Todos
							</span>
						</Link>

						<div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-0.5 scrollbar-hide">
							{filteredRootNotes.length > 0 ? (
								filteredRootNotes.map((note) => (
									<NoteTreeItem
										key={note.id}
										note={note}
										childrenByParent={childrenByParent}
										visibleIds={visibleIds}
										activeNoteId={activeNoteId}
										expandedIds={expandedIds}
										searchQuery={searchQuery}
										onToggle={handleToggleExpanded}
										onSelect={handleSelectNote}
										onDelete={handleDeleteNote}
									/>
								))
							) : (
								<div className="py-12 text-center text-zinc-300 flex flex-col items-center gap-2">
									<p className="text-[10px] font-bold tracking-widest uppercase opacity-40">
										No Results
									</p>
								</div>
							)}
						</div>

						<div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-2">
							<div className="flex items-center justify-between px-2 py-1">
								<div className="flex items-center gap-2">
									<div
										className={`w-1.5 h-1.5 rounded-full ${mcpStatus.connected ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-800"}`}
									/>
									<span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
										Status
									</span>
								</div>
								<span
									className={`text-[10px] font-bold ${mcpStatus.connected ? "text-green-600 dark:text-green-400" : "text-zinc-400"}`}
								>
									{mcpStatus.connected ? "MCP" : "OFFLINE"}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-1.5">
								<Link
									href="/graph-notes"
									className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-transparent hover:border-zinc-500/20 transition-all text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-500 group shadow-sm"
								>
									<Network className="w-3.5 h-3.5" />
									Map
								</Link>
								<button
									onClick={() => setShowProfileModal(true)}
									className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-transparent hover:border-zinc-500/20 transition-all text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-500 group shadow-sm"
								>
									<Settings className="w-3.5 h-3.5" />
									Config
								</button>
							</div>
							<div className="p-2 text-xs">
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
									>
										OpenNote
									</a>
								</p>
							</div>
						</div>
					</div>
				</aside>

				{/* Main Content */}
				<main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 relative overflow-hidden">
					{/* Mobile Header */}
					<header className="md:hidden flex items-center justify-between p-6 border-b border-zinc-50 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
						<button
							onClick={() => setIsSidebarOpen(true)}
							className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-500"
						>
							<Menu className="w-5 h-5" />
						</button>
						<h1 className="text-xs font-black tracking-[0.2em] uppercase">
							OpenNote
						</h1>
						<button
							onClick={handleCreateNote}
							className="p-3 rounded-2xl bg-zinc-600 text-white shadow-lg shadow-zinc-500/20"
						>
							<Plus className="w-5 h-5" />
						</button>
					</header>

					<div className="flex-1 h-full overflow-hidden flex flex-col">
						{activeNote ? (
							<motion.div
								key={activeNote.id}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
								className="h-full flex flex-col"
							>
								<TiptapEditor
									initialNote={activeNote}
									breadcrumb={breadcrumb}
									onNavigateNote={handleSelectNote}
									onOpenPage={handleSelectNote}
									onUpdate={(updatedNote) => {
										// Local state is updated via useLiveQuery automatically
									}}
								/>
							</motion.div>
						) : (
							<div className="flex-1 h-full flex flex-col items-center justify-center p-12 bg-zinc-50/20 dark:bg-zinc-950/20">
								<div
									className="relative group cursor-pointer"
									onClick={handleCreateNote}
								>
									<div className="absolute inset-0 bg-zinc-500 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
									<div className="relative w-32 h-32 bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-12 rotate-6 group-hover:rotate-0 transition-all duration-700 ease-out">
										<FileText className="w-12 h-12 text-zinc-500" />
									</div>
								</div>
								<h2 className="text-3xl font-black mb-4 tracking-tight">
									Pure focus.
								</h2>
								<p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-[280px] text-center leading-relaxed mb-12 font-medium">
									Your ideas deserve a clean space. Select a note or start
									something fresh.
								</p>
								<button
									onClick={handleCreateNote}
									className="group px-8 py-4 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-black shadow-2xl shadow-zinc-500/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
								>
									<Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
									Create New Idea
								</button>
							</div>
						)}
					</div>
				</main>
			</div>

			{/* MCP Config Modal */}
			<AnimatePresence>
				{showProfileModal && (
					<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
						>
							<div className="flex flex-col">
								<div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
									<h3 className="font-bold">MCP Configuration</h3>
									<button
										onClick={() => setShowProfileModal(false)}
										className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
									>
										<X className="w-4 h-4" />
									</button>
								</div>

								<div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
									{/* User Section */}
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											{user.photoURL ? (
												<img
													src={user.photoURL}
													className="w-12 h-12 rounded-full ring-2 ring-zinc-100 dark:ring-zinc-800"
												/>
											) : (
												<div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
													<User className="w-4 h-4 text-zinc-400" />
												</div>
											)}
											<div>
												<h4 className="font-bold">{user.displayName}</h4>
												<p className="text-xs text-zinc-500">Local Data Only</p>
											</div>
										</div>
										<button
											onClick={generateNewApiKey}
											className="px-4 py-2 bg-zinc-600 text-white text-xs font-bold rounded-xl hover:bg-zinc-700 transition-colors flex items-center gap-2"
										>
											<Plus className="w-3.5 h-3.5" />
											New API Key
										</button>
									</div>

									{/* API Keys List */}
									<div className="space-y-3">
										<h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
											Active API Keys
										</h4>
										{apiKeys.length === 0 ? (
											<div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-700 text-center">
												<p className="text-xs text-zinc-400 italic">
													No API keys generated yet.
												</p>
											</div>
										) : (
											<div className="grid gap-2">
												{apiKeys.map((k) => (
													<div
														key={k.id}
														className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
													>
														<div className="flex flex-col gap-0.5">
															<span className="text-[10px] font-bold text-zinc-400 uppercase">
																{k.name}
															</span>
															<code className="text-xs font-mono">
																{k.key.substring(0, 8)}...
																{k.key.substring(k.key.length - 4)}
															</code>
														</div>
														<div className="flex items-center gap-1">
															<button
																onClick={() => copyToClipboard(k.key)}
																className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-zinc-500"
																title="Copy Key"
															>
																<Copy className="w-3.5 h-3.5" />
															</button>
															<button
																onClick={() => deleteApiKey(k.id)}
																className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-red-500"
																title="Delete Key"
															>
																<Trash2 className="w-3.5 h-3.5" />
															</button>
														</div>
													</div>
												))}
											</div>
										)}
									</div>

									{/* Claude Config Section */}
									<div className="space-y-3">
										<div className="flex items-center gap-2">
											<Key className="w-4 h-4 text-zinc-500" />
											<h4 className="font-bold text-sm">
												Claude Desktop Config
											</h4>
										</div>
										<p className="text-xs text-zinc-500 leading-relaxed">
											Copy this configuration to your{" "}
											<code>claude_desktop_config.json</code> to connect Claude
											to your local notes.
										</p>

										<div className="relative group">
											<pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-300 text-[10px] font-mono overflow-x-auto border border-zinc-800">
												{JSON.stringify(
													getMcpConfig(apiKeys[0]?.key || "YOUR_API_KEY"),
													null,
													2,
												)}
											</pre>
											<button
												onClick={() =>
													copyToClipboard(
														JSON.stringify(
															getMcpConfig(apiKeys[0]?.key || "YOUR_API_KEY"),
															null,
															2,
														),
													)
												}
												className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-all"
											>
												<Copy className="w-3.5 h-3.5" />
											</button>
										</div>
										<p className="text-[10px] text-zinc-400 italic">
											Note: Make sure <code>node</code> is in your system path.
										</p>
									</div>
								</div>

								<div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
									<button
										onClick={() => setShowProfileModal(false)}
										className="px-6 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold"
									>
										Done
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default IndexPage;
