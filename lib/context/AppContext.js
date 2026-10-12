import React, { createContext, useContext, useMemo, useRef, useState } from "react";

/**
 * App-wide UI state: sidebar, AI chat panel and the editor layout.
 *
 * Editor layout = up to 2 GROUPS (split view), each with its own TABS:
 *   groups = [{ tabs: [noteId, ...], active: noteId }, ...]
 *
 * Plain useState — no effects. Hotkeys that drive this live in RootLayout.
 * Handlers are created once and read the latest state through a ref, so they
 * can be passed to memoized children without going stale.
 */
const AppContext = createContext(null);

export const MAX_GROUPS = 2;
const MAX_TABS = 10;

const normalizeId = (id) => {
	const n = Number(id);
	return Number.isNaN(n) ? id : n;
};

// keep `active` pointing at one of the tabs
const fix = (g) => (g.tabs.includes(g.active) ? g : { ...g, active: g.tabs.at(-1) });

export const AppProvider = ({ children }) => {
	const [sidebarOpen, setSidebarOpen] = useState(true); // mobile drawer
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop
	const [chatOpen, setChatOpen] = useState(false);
	const [themesOpen, setThemesOpen] = useState(false); // center content shows the Themes page
	const [groups, setGroups] = useState([]);
	const [activeGroup, setActiveGroup] = useState(0);
	const [selections, setSelections] = useState([]); // "Ask AI" text snippets
	const chatInputRef = useRef(null);

	const live = useRef({});
	live.current = { groups, activeGroup };

	const api = useMemo(() => {
		const commit = (nextGroups, nextActive) => {
			setThemesOpen(false); // any note navigation leaves the Themes page
			setGroups(nextGroups);
			setActiveGroup(Math.max(0, Math.min(nextActive, nextGroups.length - 1)));
		};
		const indexOfTab = (gs, id) => gs.findIndex((g) => g.tabs.includes(id));

		const openNote = (rawId) => {
			const id = normalizeId(rawId);
			const { groups: gs, activeGroup: ag } = live.current;
			const at = indexOfTab(gs, id);
			if (at !== -1) {
				return commit(gs.map((g, i) => (i === at ? { ...g, active: id } : g)), at);
			}
			if (!gs.length) return commit([{ tabs: [id], active: id }], 0);
			const gi = Math.min(ag, gs.length - 1);
			commit(
				gs.map((g, i) => {
					if (i !== gi) return g;
					let tabs = [...g.tabs, id];
					if (tabs.length > MAX_TABS) {
						const drop = tabs.findIndex((t) => t !== g.active && t !== id);
						tabs = tabs.filter((_, k) => k !== drop);
					}
					return { tabs, active: id };
				}),
				gi,
			);
		};

		/** Show a note in the OTHER group (creates the 2nd group). */
		const openSplit = (rawId) => {
			const id = normalizeId(rawId);
			const { groups: gs, activeGroup: ag } = live.current;
			const src = indexOfTab(gs, id);
			if (!gs.length) return commit([{ tabs: [id], active: id }], 0);
			const target = gs.length < MAX_GROUPS ? gs.length : 1 - Math.min(ag, 1);
			// can't move the only tab out of its group: just focus it
			if (src !== -1 && src !== target && gs[src].tabs.length < 2) return openNote(id);
			let next = gs.map((g) => fix({ ...g, tabs: g.tabs.filter((t) => t !== id) }));
			if (target >= next.length) next = [...next, { tabs: [id], active: id }];
			else next[target] = { tabs: [...next[target].tabs, id], active: id };
			commit(next, target);
		};

		const closeTab = (gi, id) => {
			const { groups: gs, activeGroup: ag } = live.current;
			const g = gs[gi];
			if (!g) return;
			const idx = g.tabs.indexOf(id);
			const tabs = g.tabs.filter((t) => t !== id);
			if (!tabs.length) {
				const next = gs.filter((_, i) => i !== gi);
				return commit(next, ag > gi ? ag - 1 : Math.min(ag, next.length - 1));
			}
			const active = g.active === id ? tabs[Math.max(0, idx - 1)] : g.active;
			commit(gs.map((x, i) => (i === gi ? { tabs, active } : x)), ag);
		};

		/** Remove a note from every group (it was deleted). */
		const closeNote = (rawId) => {
			const id = normalizeId(rawId);
			let { groups: gs, activeGroup: ag } = live.current;
			const next = gs
				.map((g) => fix({ ...g, tabs: g.tabs.filter((t) => t !== id) }))
				.filter((g) => g.tabs.length);
			commit(next, ag);
		};

		const activateTab = (gi, id) => {
			const { groups: gs } = live.current;
			commit(gs.map((g, i) => (i === gi ? { ...g, active: id } : g)), gi);
		};

		const openChat = () => {
			setChatOpen(true);
			requestAnimationFrame(() => chatInputRef.current?.focus());
		};

		return {
			openNote,
			openSplit,
			closeTab,
			closeNote,
			activateTab,
			setActiveGroup,
			openChat,
			toggleSidebar: () => {
				if (window.innerWidth < 768) setSidebarOpen((v) => !v);
				else setSidebarCollapsed((v) => !v);
			},
			/** "Ask AI" from the selection toolbar: add the text as chat context. */
			askAI: (ctx) => {
				setSelections((prev) => [...prev, { id: Date.now() + Math.random(), ...ctx }].slice(-3));
				openChat();
			},
			removeSelection: (id) => setSelections((prev) => prev.filter((s) => s.id !== id)),
			clearSelections: () => setSelections([]),
		};
	}, []);

	const value = {
		...api,
		sidebarOpen,
		setSidebarOpen,
		sidebarCollapsed,
		setSidebarCollapsed,
		chatOpen,
		setChatOpen,
		themesOpen,
		setThemesOpen,
		chatInputRef,
		groups,
		activeGroup,
		activeId: groups[activeGroup]?.active ?? null,
		openIds: groups.map((g) => g.active), // visible notes (one per group)
		tabIds: groups.flatMap((g) => g.tabs), // every open tab
		selections,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
	const ctx = useContext(AppContext);
	if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
	return ctx;
};
