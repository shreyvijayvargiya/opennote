import React, { useState, useMemo } from "react";
import {
	ChevronLeft,
	ChevronRight,
	Plus,
	X,
	CalendarDays,
	List,
} from "lucide-react";
import { useTodos, formatDateKey } from "../hooks/useTodos";
import TodoEditor from "./TodoEditor";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const PILL_COLORS = [
	"bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
	"bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
	"bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
	"bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
	"bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
	"bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300",
	"bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
];

function getCalendarDays(year, month) {
	const firstDay = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const daysInPrevMonth = new Date(year, month, 0).getDate();

	const days = [];

	for (let i = firstDay - 1; i >= 0; i--) {
		const prevMonth = month === 0 ? 11 : month - 1;
		const prevYear = month === 0 ? year - 1 : year;
		days.push({
			day: daysInPrevMonth - i,
			month: prevMonth,
			year: prevYear,
			isCurrentMonth: false,
		});
	}

	for (let d = 1; d <= daysInMonth; d++) {
		days.push({ day: d, month, year, isCurrentMonth: true });
	}

	const remaining = 42 - days.length;
	const nextMonth = month === 11 ? 0 : month + 1;
	const nextYear = month === 11 ? year + 1 : year;
	for (let d = 1; d <= remaining; d++) {
		days.push({
			day: d,
			month: nextMonth,
			year: nextYear,
			isCurrentMonth: false,
		});
	}

	return days;
}

function formatDayLabel(dateKey) {
	const [y, m, d] = dateKey.split("-").map(Number);
	return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

export default function TodoCalendar() {
	const today = new Date();
	const [view, setView] = useState("calendar");
	const [viewYear, setViewYear] = useState(today.getFullYear());
	const [viewMonth, setViewMonth] = useState(today.getMonth());
	const [editorDateKey, setEditorDateKey] = useState(null);

	const {
		todosByDate,
		getTodosForDate,
		getDateHtml,
		saveDateContent,
		toggleTodo,
		deleteTodo,
	} = useTodos();

	const calendarDays = useMemo(
		() => getCalendarDays(viewYear, viewMonth),
		[viewYear, viewMonth],
	);

	const todayKey = formatDateKey(
		today.getFullYear(),
		today.getMonth(),
		today.getDate(),
	);

	const orderedDays = useMemo(() => {
		const keys = Object.keys(todosByDate).filter(
			(key) => (todosByDate[key]?.items || []).length > 0,
		);
		const upcoming = keys.filter((key) => key >= todayKey).sort();
		const past = keys
			.filter((key) => key < todayKey)
			.sort()
			.reverse();
		return [...upcoming, ...past].map((dateKey) => ({
			dateKey,
			todos: [...(todosByDate[dateKey]?.items || [])].sort(
				(a, b) => (a.createdAt || 0) - (b.createdAt || 0),
			),
		}));
	}, [todosByDate, todayKey]);

	const goToPrevMonth = () => {
		if (viewMonth === 0) {
			setViewYear((y) => y - 1);
			setViewMonth(11);
		} else {
			setViewMonth((m) => m - 1);
		}
	};

	const goToNextMonth = () => {
		if (viewMonth === 11) {
			setViewYear((y) => y + 1);
			setViewMonth(0);
		} else {
			setViewMonth((m) => m + 1);
		}
	};

	const goToToday = () => {
		setViewYear(today.getFullYear());
		setViewMonth(today.getMonth());
	};

	const openEditor = (dateKey, e) => {
		e?.stopPropagation();
		setEditorDateKey(dateKey);
	};

	if (editorDateKey) {
		return (
			<TodoEditor
				key={editorDateKey}
				dateKey={editorDateKey}
				initialHtml={getDateHtml(editorDateKey)}
				initialItems={getTodosForDate(editorDateKey)}
				onSave={(html, items) => saveDateContent(editorDateKey, html, items)}
				onBack={() => setEditorDateKey(null)}
			/>
		);
	}

	return (
		<div className="flex flex-col h-full p-6 overflow-hidden">
			<div className="flex items-center justify-between mb-6 shrink-0">
				<div className="flex items-center gap-3">
					{view === "calendar" ? (
						<>
							<h2 className="text-xl font-black tracking-tight">
								{MONTH_NAMES[viewMonth]} {viewYear}
							</h2>
							<div className="flex items-center gap-1">
								<button
									onClick={goToPrevMonth}
									className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 transition-colors"
								>
									<ChevronLeft className="w-4 h-4" />
								</button>
								<button
									onClick={goToNextMonth}
									className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 transition-colors"
								>
									<ChevronRight className="w-4 h-4" />
								</button>
							</div>
						</>
					) : (
						<h2 className="text-xl font-black tracking-tight">Todos</h2>
					)}
				</div>

				<div className="flex items-center gap-2">
					{view === "calendar" && (
						<button
							onClick={goToToday}
							className="px-3 py-1.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
						>
							Today
						</button>
					)}
					{view === "list" && (
						<button
							onClick={() => openEditor(todayKey)}
							className="p-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 transition-all shadow-sm"
							title="Add todo"
						>
							<Plus className="w-4 h-4" />
						</button>
					)}
					<div className="flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
						<button
							onClick={() => setView("calendar")}
							className={`p-1.5 rounded-lg transition-colors ${
								view === "calendar"
									? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
									: "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
							}`}
							title="Calendar"
						>
							<CalendarDays className="w-4 h-4" />
						</button>
						<button
							onClick={() => setView("list")}
							className={`p-1.5 rounded-lg transition-colors ${
								view === "list"
									? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
									: "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
							}`}
							title="List"
						>
							<List className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>

			{view === "calendar" ? (
				<>
					<div className="grid grid-cols-7 gap-2 mb-2 shrink-0">
						{DAY_LABELS.map((label) => (
							<div
								key={label}
								className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 py-1"
							>
								{label}
							</div>
						))}
					</div>

					<div className="grid grid-cols-7 gap-2 flex-1 min-h-0 auto-rows-fr">
						{calendarDays.map((cell, idx) => {
							const dateKey = formatDateKey(cell.year, cell.month, cell.day);
							const isToday = dateKey === todayKey;
							const dayTodos = getTodosForDate(dateKey);
							const visibleTodos = dayTodos.slice(0, 3);
							const extraCount = dayTodos.length - 3;

							return (
								<div
									key={idx}
									onClick={() => openEditor(dateKey)}
									className={`relative group flex flex-col p-2 rounded-2xl border text-left transition-all min-h-[80px] overflow-hidden cursor-pointer border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/70 ${
										!cell.isCurrentMonth ? "opacity-40" : ""
									}`}
								>
									<span
										className={`text-xs font-medium mb-1 ${
											isToday
												? "text-zinc-900 dark:text-zinc-100 font-bold"
												: cell.isCurrentMonth
													? "text-zinc-500 dark:text-zinc-400"
													: "text-zinc-300 dark:text-zinc-600"
										}`}
									>
										{cell.day}
									</span>
									<button
										onClick={(e) => openEditor(dateKey, e)}
										className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-0.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 transition-all"
										title="Add todo"
									>
										<Plus className="w-3.5 h-3.5" />
									</button>
									<div className="flex flex-col gap-0.5 overflow-hidden">
										{visibleTodos.map((todo, i) => (
											<span
												key={todo.id}
												className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md truncate ${
													PILL_COLORS[i % PILL_COLORS.length]
												} ${todo.completed ? "opacity-50 line-through" : ""}`}
											>
												{todo.text}
											</span>
										))}
										{extraCount > 0 && (
											<span className="text-[9px] text-zinc-400 px-1">
												+{extraCount} more
											</span>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</>
			) : (
				<div className="flex-1 overflow-y-auto min-h-0 max-w-lg">
					{orderedDays.length === 0 ? (
						<div className="py-16 text-center text-zinc-400">
							<p className="text-sm font-medium mb-3">No todos yet</p>
							<button
								onClick={() => openEditor(todayKey)}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
							>
								<Plus className="w-3.5 h-3.5" />
								Add
							</button>
						</div>
					) : (
						<div className="space-y-6 pb-8">
							{orderedDays.map(({ dateKey, todos }) => (
								<div key={dateKey}>
									<div className="flex items-center justify-between mb-2">
										<button
											onClick={() => openEditor(dateKey)}
											className="text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
										>
											{dateKey === todayKey
												? "Today"
												: formatDayLabel(dateKey)}
										</button>
										<button
											onClick={() => openEditor(dateKey)}
											className="p-1 rounded-lg text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
											title="Edit todos"
										>
											<Plus className="w-3.5 h-3.5" />
										</button>
									</div>
									<div className="space-y-0.5">
										{todos.map((todo) => (
											<div
												key={todo.id}
												className="flex items-center gap-2.5 group px-1 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900"
											>
												<input
													type="checkbox"
													checked={todo.completed}
													onChange={() => toggleTodo(dateKey, todo.id)}
													className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 focus:ring-zinc-500 cursor-pointer shrink-0"
												/>
												<button
													onClick={() => openEditor(dateKey)}
													className={`flex-1 min-w-0 text-left text-sm ${
														todo.completed
															? "line-through text-zinc-400"
															: "text-zinc-700 dark:text-zinc-300"
													}`}
												>
													{todo.text}
												</button>
												<button
													onClick={() => deleteTodo(dateKey, todo.id)}
													className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-300 hover:text-red-500 transition-all shrink-0"
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
