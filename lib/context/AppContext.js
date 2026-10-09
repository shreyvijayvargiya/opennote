import React, { createContext, useContext, useRef, useState } from "react";

/**
 * App-wide UI state: sidebar, AI chat panel and the (max 2) open note panes.
 * Plain useState — no effects. Hotkeys that drive this live in RootLayout.
 */
const AppContext = createContext(null);

const normalizeId = (id) => {
	const n = Number(id);
	return Number.isNaN(n) ? id : n;
};

export const AppProvider = ({ children }) => {
	const [sidebarOpen, setSidebarOpen] = useState(true); // mobile drawer
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop
	const [chatOpen, setChatOpen] = useState(false);
	const [openIds, setOpenIds] = useState([]); // max 2 (split view)
	const [activeId, setActiveId] = useState(null);
	const [selections, setSelections] = useState([]); // "Ask AI" text snippets
	const chatInputRef = useRef(null);

	const openChat = () => {
		setChatOpen(true);
		requestAnimationFrame(() => chatInputRef.current?.focus());
	};

	const toggleSidebar = () => {
		if (window.innerWidth < 768) setSidebarOpen((v) => !v);
		else setSidebarCollapsed((v) => !v);
	};

	/** Open in the active pane (replaces it), or fill the first pane. */
	const openNote = (rawId) => {
		const id = normalizeId(rawId);
		setOpenIds((prev) => {
			if (prev.includes(id)) return prev;
			if (!prev.length) return [id];
			const at = Math.max(0, prev.indexOf(activeId));
			const next = [...prev];
			next[at] = id;
			return next;
		});
		setActiveId(id);
	};

	/** Open beside the current note (split view, max 2 panes). */
	const openSplit = (rawId) => {
		const id = normalizeId(rawId);
		setOpenIds((prev) => {
			if (prev.includes(id)) return prev;
			if (prev.length < 2) return [...prev, id];
			const replace = prev.findIndex((p) => p !== activeId);
			const next = [...prev];
			next[replace] = id;
			return next;
		});
		setActiveId(id);
	};

	const closePane = (rawId) => {
		const id = normalizeId(rawId);
		const rest = openIds.filter((p) => p !== id);
		setOpenIds(rest);
		if (activeId === id) setActiveId(rest[0] ?? null);
	};

	/** "Ask AI" from the selection toolbar: add the text as chat context. */
	const askAI = (ctx) => {
		setSelections((prev) => [...prev, { id: Date.now() + Math.random(), ...ctx }].slice(-3));
		openChat();
	};

	const value = {
		sidebarOpen,
		setSidebarOpen,
		sidebarCollapsed,
		setSidebarCollapsed,
		toggleSidebar,
		chatOpen,
		setChatOpen,
		openChat,
		chatInputRef,
		openIds,
		activeId,
		setActiveId,
		openNote,
		openSplit,
		closePane,
		selections,
		askAI,
		removeSelection: (id) => setSelections((prev) => prev.filter((s) => s.id !== id)),
		clearSelections: () => setSelections([]),
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
	const ctx = useContext(AppContext);
	if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
	return ctx;
};
