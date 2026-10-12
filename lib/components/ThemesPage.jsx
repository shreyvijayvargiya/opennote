import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Sun, Moon } from "lucide-react";
import { themes } from "../themes";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { cn } from "../utils/cn";

/**
 * Themes page (center content). Every card is a tiny app mock rendered under its own
 * `data-theme` (+ `dark` class), so it previews the theme in the current mode. Clicking
 * a card applies it to the whole app straight away and saves it.
 * Mock uses token classes only (no `dark:` variants) so it follows the card's own scope.
 */
const Mock = ({ id, dark }) => (
	<div
		data-theme={id}
		className={cn("flex h-36 overflow-hidden rounded-lg border border-border bg-background text-foreground", dark && "dark")}
	>
		<div className="flex w-1/4 flex-col gap-1.5 border-r border-border bg-card p-2">
			<div className="h-1.5 w-8 rounded-full bg-foreground" />
			<div className="h-3 rounded-md border border-border bg-background" />
			<div className="h-2 rounded bg-accent" />
			<div className="h-2 w-3/4 rounded bg-muted" />
			<div className="h-2 w-2/3 rounded bg-muted" />
		</div>
		<div className="flex-1 space-y-1.5 p-2.5">
			<div className="h-2.5 w-1/2 rounded-full bg-foreground" />
			<div className="h-1.5 w-full rounded-full bg-muted-foreground/40" />
			<div className="h-1.5 w-5/6 rounded-full bg-muted-foreground/40" />
			<div className="flex gap-1.5 pt-1">
				<div className="h-4 w-12 rounded-md bg-primary" />
				<div className="h-4 w-10 rounded-md border border-border bg-secondary" />
				<div className="h-4 w-8 rounded-md bg-destructive" />
			</div>
			<div className="h-6 rounded-md bg-muted" />
		</div>
	</div>
);

const ThemesPage = () => {
	const { themeId, setThemeId, isDarkMode, toggleTheme } = useTheme();
	const { setThemesOpen } = useApp();
	const current = themes.find((t) => t.id === themeId) || themes[0];

	return (
		<div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
				<div>
					<h1 className="text-lg font-bold tracking-tight">Themes</h1>
					<p className="text-xs text-zinc-500">
						Click a theme to preview it on the whole app. Active: <b>{current.name}</b> · {isDarkMode ? "dark" : "light"}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={toggleTheme}
						className="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
					>
						{isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
						{isDarkMode ? "Light" : "Dark"}
					</button>
					<button
						type="button"
						title="Close"
						onClick={() => setThemesOpen(false)}
						className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
					>
						<HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
					</button>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
				<div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{themes.map((t) => {
						const active = t.id === themeId;
						return (
							<button
								key={t.id}
								type="button"
								onClick={() => setThemeId(t.id)}
								className={cn(
									"group rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-left text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800",
									active && "ring-2 ring-indigo-500",
								)}
							>
								<Mock id={t.id} dark={isDarkMode} />
								<div className="flex items-center justify-between px-1 pb-0.5 pt-2.5">
									<div className="flex items-center gap-2">
										{t.swatch.map((c, i) => (
											<span key={i} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: c }} />
										))}
										<span className="text-sm font-semibold">{t.name}</span>
									</div>
									{active && <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.2} className="text-indigo-500" />}
								</div>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default ThemesPage;
