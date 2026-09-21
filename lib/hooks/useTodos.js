import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "opennote-todos";

function normalizeEntry(val) {
	if (!val) return { html: null, items: [] };
	if (Array.isArray(val)) return { html: null, items: val };
	return {
		html: val.html ?? null,
		items: Array.isArray(val.items) ? val.items : [],
	};
}

function loadTodos() {
	if (typeof window === "undefined") return {};
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		const parsed = stored ? JSON.parse(stored) : {};
		const next = {};
		for (const [key, val] of Object.entries(parsed)) {
			next[key] = normalizeEntry(val);
		}
		return next;
	} catch {
		return {};
	}
}

export function useTodos() {
	const [todosByDate, setTodosByDate] = useState({});

	useEffect(() => {
		setTodosByDate(loadTodos());
	}, []);

	const persist = useCallback((updater) => {
		setTodosByDate((prev) => {
			const next = typeof updater === "function" ? updater(prev) : updater;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			return next;
		});
	}, []);

	const getTodosForDate = useCallback(
		(dateKey) => normalizeEntry(todosByDate[dateKey]).items,
		[todosByDate],
	);

	const getDateHtml = useCallback(
		(dateKey) => normalizeEntry(todosByDate[dateKey]).html,
		[todosByDate],
	);

	const saveDateContent = useCallback(
		(dateKey, html, items) => {
			persist((prev) => ({
				...prev,
				[dateKey]: { html, items },
			}));
		},
		[persist],
	);

	const addTodo = useCallback(
		(dateKey, text) => {
			if (!text.trim()) return;
			const todo = {
				id: uuidv4(),
				text: text.trim(),
				completed: false,
				createdAt: Date.now(),
			};
			persist((prev) => {
				const existing = normalizeEntry(prev[dateKey]);
				return {
					...prev,
					[dateKey]: { html: null, items: [...existing.items, todo] },
				};
			});
		},
		[persist],
	);

	const toggleTodo = useCallback(
		(dateKey, todoId) => {
			persist((prev) => {
				const existing = normalizeEntry(prev[dateKey]);
				return {
					...prev,
					[dateKey]: {
						html: null,
						items: existing.items.map((t) =>
							t.id === todoId ? { ...t, completed: !t.completed } : t,
						),
					},
				};
			});
		},
		[persist],
	);

	const updateTodo = useCallback(
		(dateKey, todoId, text) => {
			persist((prev) => {
				const existing = normalizeEntry(prev[dateKey]);
				return {
					...prev,
					[dateKey]: {
						html: null,
						items: existing.items.map((t) =>
							t.id === todoId ? { ...t, text } : t,
						),
					},
				};
			});
		},
		[persist],
	);

	const deleteTodo = useCallback(
		(dateKey, todoId) => {
			persist((prev) => {
				const existing = normalizeEntry(prev[dateKey]);
				return {
					...prev,
					[dateKey]: {
						html: null,
						items: existing.items.filter((t) => t.id !== todoId),
					},
				};
			});
		},
		[persist],
	);

	return {
		todosByDate,
		getTodosForDate,
		getDateHtml,
		saveDateContent,
		addTodo,
		toggleTodo,
		updateTodo,
		deleteTodo,
	};
}

export function formatDateKey(year, month, day) {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseDateKey(dateKey) {
	const [y, m, d] = dateKey.split("-").map(Number);
	return { year: y, month: m - 1, day: d };
}
