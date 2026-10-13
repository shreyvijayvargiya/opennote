import React, { useState, useEffect, useMemo } from "react";
import {
	Plus,
	FileText,
	Menu,
	X,
	Key,
	Copy,
	Trash2,
	User,
	Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useLiveQuery } from "dexie-react-hooks";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { noteService } from "../lib/db/noteService";
import { db as localDb } from "../lib/db/localDb";
import TiptapEditor from "../lib/components/TiptapEditor";
import Sidebar from "../lib/components/Sidebar";
import ChatPanel from "../lib/components/chat/ChatPanel";
import TabBar from "../lib/components/TabBar";
import { useTheme } from "../lib/context/ThemeContext";
import { useApp } from "../lib/context/AppContext";
import ThemesPage from "../lib/components/ThemesPage";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { getNotesTools } from "../lib/mcp/notesTools";

const IndexPage = () => {
	const { isDarkMode } = useTheme();
	const app = useApp();
	// Use a mock stable user for initial render to avoid hydration mismatch
	const [user, setUser] = useState({
		uid: "local-user",
		displayName: "Local User",
		photoURL: null,
	});
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [systemInfo, setSystemInfo] = useState({
		workspacePath: "",
		connectScriptPath: "",
	});

	const [mcpStatus, setMcpStatus] = useState({ connected: false });
	const [isFetchingMcpStatus, setIsFetchingMcpStatus] = useState(false);


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
				// bottom-left keeps the widget clear of the chat send button
				const wmcp = new window.WebMCP({ position: "bottom-left", padding: "12px" });
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

	/* ---------- editor groups: max 2 (split view), each with tabs ---------- */
	const byId = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);
	// Tabs whose note was deleted (by the user or the AI) simply drop out.
	const viewGroups = app.groups
		.map((g) => {
			const tabs = g.tabs.filter((id) => byId.has(id));
			return { tabs, active: tabs.includes(g.active) ? g.active : tabs.at(-1) };
		})
		.map((g, i) => ({ ...g, index: i }))
		.filter((g) => g.tabs.length);
	const activeGroup = Math.min(app.activeGroup, viewGroups.length - 1);
	const splitCandidates = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

	const getBreadcrumb = (id) => {
		const path = [];
		let current = byId.get(id);
		const seen = new Set();
		while (current && !seen.has(current.id)) {
			path.unshift({ id: current.id, title: current.title || "Untitled" });
			seen.add(current.id);
			current = current.parentId != null ? byId.get(current.parentId) : null;
		}
		return path;
	};

	const handleCreateNote = async () => {
		try {
			const newNote = await noteService.saveNote(user.uid, {
				title: "Untitled Note",
				content: "<p>Start typing...</p>",
			});
			app.openNote(newNote.id);
			toast.success("Note created locally");
		} catch (error) {
			toast.error("Failed to create note");
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
			className={`${isDarkMode ? "dark bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900"} font-sans transition-colors duration-300 min-h-screen`}
		>
			<div className="flex h-screen overflow-hidden relative">
				<Sidebar
					notes={notes}
					user={user}
					mcpConnected={mcpStatus.connected}
					onOpenConfig={() => setShowProfileModal(true)}
				/>

				<main className="flex-1 flex min-w-0 relative overflow-hidden">
					<div className="flex-1 flex flex-col min-w-0 relative">
						{/* Mobile Header */}
						<header className="md:hidden flex items-center justify-between p-6 border-b border-zinc-50 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
							<button
								onClick={() => app.setSidebarOpen(true)}
								className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-500"
							>
								<Menu className="w-5 h-5" />
							</button>
							<h1 className="text-xs font-black tracking-[0.2em] uppercase">OpenNote</h1>
							<div className="flex items-center gap-2">
								<button
									onClick={app.openChat}
									className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-500"
									title="Assistant"
								>
									<Sparkles className="w-5 h-5" />
								</button>
								<button
									onClick={handleCreateNote}
									className="p-3 rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
								>
									<Plus className="w-5 h-5" />
								</button>
							</div>
						</header>

						<div className="flex-1 min-h-0 overflow-hidden flex flex-col px-2 py-2">
							{app.themesOpen ? (
								<ThemesPage />
							) : viewGroups.length > 0 ? (
								<PanelGroup direction="horizontal" className="h-full">
									{viewGroups.map((group, i) => {
										const note = byId.get(group.active);
										return (
											<React.Fragment key={group.index}>
												{i > 0 && (
													<PanelResizeHandle className="group/handle relative flex w-2 items-center justify-center outline-none">
														{/* the gap between the two cards: a grip that turns indigo and grows on hover / drag */}
														<div className="h-10 w-1 rounded-full bg-zinc-200 transition-all group-hover/handle:h-16 group-hover/handle:bg-indigo-400 group-data-[resize-handle-state=drag]/handle:h-16 group-data-[resize-handle-state=drag]/handle:bg-indigo-500 dark:bg-zinc-700 dark:group-hover/handle:bg-indigo-400" />
													</PanelResizeHandle>
												)}
												<Panel id={`group-${group.index}`} order={i} minSize={25} maxSize={75}>
													<div
														className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950"
														onPointerDownCapture={() => app.setActiveGroup(i)}
													>
														<TabBar
															tabs={group.tabs}
															active={group.active}
															byId={byId}
															isActiveGroup={viewGroups.length > 1 && i === activeGroup}
															onSelect={(id) => app.activateTab(group.index, id)}
															onClose={(id) => app.closeTab(group.index, id)}
															onNew={handleCreateNote}
															right={
																!app.chatOpen &&
																i === viewGroups.length - 1 && (
																	<button
																		onClick={app.openChat}
																		className="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100 px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
																		title="Open assistant (⌘L)"
																	>
																		<Sparkles className="h-3.5 w-3.5" />
																		Ask AI
																	</button>
																)
															}
														/>
														<motion.div
															key={note.id}
															initial={{ opacity: 0, x: 12 }}
															animate={{ opacity: 1, x: 0 }}
															transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
															className="flex-1 min-h-0 flex flex-col"
														>
															<TiptapEditor
																initialNote={note}
																breadcrumb={getBreadcrumb(note.id)}
																onNavigateNote={app.openNote}
																onOpenPage={app.openNote}
																splitCandidates={splitCandidates.filter((n) => n.id !== note.id)}
																onSplitPick={app.openSplit}
																onSplitNew={async () => {
																	const created = await noteService.saveNote(user.uid, {
																		title: "Untitled Note",
																		content: "<p>Start typing...</p>",
																	});
																	app.openSplit(created.id);
																}}
																onUpdate={() => {
																	// Local state is updated via useLiveQuery automatically
																}}
															/>
														</motion.div>
													</div>
												</Panel>
											</React.Fragment>
										);
									})}
								</PanelGroup>
							) : (
								<div className="flex-1 h-full flex flex-col items-center justify-center p-12 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
									<div className="relative group cursor-pointer" onClick={handleCreateNote}>
										<div className="absolute inset-0 bg-zinc-500 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
										<div className="relative w-32 h-32 bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-12 rotate-6 group-hover:rotate-0 transition-all duration-700 ease-out">
											<FileText className="w-12 h-12 text-zinc-500" />
										</div>
									</div>
									<h2 className="text-3xl font-black mb-4 tracking-tight">Pure focus.</h2>
									<p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-[280px] text-center leading-relaxed mb-12 font-medium">
										Your ideas deserve a clean space. Select a note or start something fresh.
									</p>
									<button
										onClick={handleCreateNote}
										className="group px-8 py-4 rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-transparent dark:bg-zinc-100 dark:text-zinc-900 text-sm font-black shadow-sm hover:bg-zinc-200 dark:hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
									>
										<Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
										Create New Idea
									</button>
									<p className="mt-6 text-[11px] text-zinc-400">
										<kbd className="rounded border px-1">⌘B</kbd> sidebar ·{" "}
										<kbd className="rounded border px-1">⌘L</kbd> assistant
									</p>
								</div>
							)}
						</div>
					</div>

					<ChatPanel notes={notes} />
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

								<div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto hide-scrollbar">
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
											className="px-4 py-2 border border-zinc-200 bg-zinc-100 text-zinc-800 text-xs font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
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
											<pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-300 text-[10px] font-mono overflow-x-auto hide-scrollbar border border-zinc-800">
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
										className="px-6 py-2 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:border-transparent dark:bg-zinc-100 dark:text-zinc-900 text-sm font-bold"
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
