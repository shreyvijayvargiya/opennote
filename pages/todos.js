import React, { useState, useEffect, useMemo } from "react";
import {
	Plus,
	Search,
	Settings,
	Network,
	Sun,
	Moon,
	Menu,
	CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLiveQuery } from "dexie-react-hooks";
import { noteService } from "../lib/db/noteService";
import { useTheme } from "../lib/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import TodoCalendar from "../lib/components/TodoCalendar";

const TodosPage = () => {
	const { isDarkMode, toggleTheme } = useTheme();
	const [user] = useState({ uid: "local-user" });
	const [searchQuery, setSearchQuery] = useState("");
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [mcpStatus, setMcpStatus] = useState({ connected: false });
	const router = useRouter();

	useEffect(() => {
		const fetchMcpStatus = async () => {
			try {
				const res = await fetch("/api/mcp-status");
				const data = await res.json();
				setMcpStatus(data);
			} catch {
				/* ignore */
			}
		};
		fetchMcpStatus();
		const interval = setInterval(fetchMcpStatus, 10000);
		return () => clearInterval(interval);
	}, []);

	const notes =
		useLiveQuery(() => noteService.getAllNotes(user?.uid), [user?.uid]) || [];

	const filteredNotes = useMemo(() => {
		return notes
			.sort((a, b) => b.updatedAt - a.updatedAt)
			.filter(
				(note) =>
					note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					note.content?.toLowerCase().includes(searchQuery.toLowerCase()),
			);
	}, [notes, searchQuery]);

	return (
		<div
			className={`${isDarkMode ? "dark bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"} font-sans transition-colors duration-300 min-h-screen`}
		>
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			<div className="flex h-screen overflow-hidden relative">
				<AnimatePresence>
					{isSidebarCollapsed && (
						<motion.button
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							onClick={() => setIsSidebarCollapsed(false)}
							className="absolute left-4 top-4 z-50 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl hover:scale-110 transition-all hidden md:flex items-center justify-center group"
							title="Show Sidebar"
						>
							<Menu className="w-4 h-4 text-zinc-400 group-hover:text-zinc-500 transition-colors" />
						</motion.button>
					)}
				</AnimatePresence>

				<aside
					className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-zinc-100 dark:border-zinc-900 flex flex-col bg-zinc-50/50 dark:bg-zinc-950 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:relative ${
						isSidebarOpen ? "translate-x-0" : "-translate-x-full"
					} ${isSidebarCollapsed ? "md:-ml-72" : "md:ml-0"}`}
				>
					<div className="p-5 flex flex-col h-full">
						<div className="flex items-center justify-between mb-6">
							<Link href="/" className="flex items-center gap-2.5">
								<h1 className="text-lg font-black tracking-tight">OpenNote</h1>
							</Link>
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
								<Link
									href="/"
									className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 transition-all shadow-md"
								>
									<Plus className="w-4 h-4" />
								</Link>
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
							className="flex items-center gap-2.5 p-2.5 mb-4 rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all"
						>
							<CalendarCheck className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
							<span className="font-bold text-[11px] text-zinc-600 dark:text-zinc-400">
								Todos
							</span>
						</Link>

						<div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-0.5 scrollbar-hide">
							{filteredNotes.length > 0 ? (
								filteredNotes.map((note) => (
									<button
										key={note.id}
										onClick={() => router.push(`/?note=${note.id}`)}
										className="w-full text-left p-2.5 rounded-xl transition-all group relative flex flex-col gap-0.5 hover:bg-white/50 dark:hover:bg-zinc-900/50"
									>
										<span className="font-bold text-[11px] truncate pr-6 text-zinc-700 dark:text-zinc-300">
											{note.title || "Untitled"}
										</span>
										<span className="text-[9px] truncate leading-relaxed text-zinc-400 dark:text-zinc-500">
											{note.content?.replace(/<[^>]*>/g, "") || "No content"}
										</span>
									</button>
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
								<Link
									href="/?config=1"
									className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-transparent hover:border-zinc-500/20 transition-all text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-500 group shadow-sm"
								>
									<Settings className="w-3.5 h-3.5" />
									Config
								</Link>
							</div>
						</div>
					</div>
				</aside>

				<main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 relative overflow-hidden">
					<header className="md:hidden flex items-center justify-between p-6 border-b border-zinc-50 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
						<button
							onClick={() => setIsSidebarOpen(true)}
							className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-500"
						>
							<Menu className="w-5 h-5" />
						</button>
						<h1 className="text-xs font-black tracking-[0.2em] uppercase">
							Todos
						</h1>
						<div className="w-11" />
					</header>

					<div className="flex-1 h-full overflow-hidden">
						<TodoCalendar />
					</div>
				</main>
			</div>
		</div>
	);
};

export default TodosPage;
