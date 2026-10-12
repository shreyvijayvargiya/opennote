import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PaintBoardIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { themes } from "../themes";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../utils/cn";

/** Chip row of color themes. Light/dark is the separate moon/sun button. */
const ThemePicker = ({ className }) => {
	const { themeId, setThemeId } = useTheme();
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					title="Color theme"
					className={cn(
						"rounded-xl p-2 text-zinc-400 transition-all hover:bg-white hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-200",
						className,
					)}
				>
					<HugeiconsIcon icon={PaintBoardIcon} size={16} strokeWidth={1.8} />
				</button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[19rem]">
				<div className="px-1 pb-2">
					<div className="text-sm font-semibold">Theme</div>
					<div className="text-[11px] text-muted-foreground">Every theme has a light and a dark mode.</div>
				</div>
				<div className="flex flex-wrap gap-1.5">
					{themes.map((t) => {
						const active = t.id === themeId;
						return (
							<button
								key={t.id}
								type="button"
								onClick={() => setThemeId(t.id)}
								className={cn(
									"flex items-center gap-1.5 rounded-full border bg-background py-1 pl-1 pr-2.5 text-xs font-medium transition-colors hover:bg-accent",
									active && "border-ring ring-1 ring-ring",
								)}
							>
								<span
									className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border"
									style={{ background: `linear-gradient(90deg, ${t.swatch[0]} 50%, ${t.swatch[3]} 50%)` }}
								>
									<span
										className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70"
										style={{ background: t.swatch[1] }}
									/>
								</span>
								{t.name}
								{active && <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={2.2} />}
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default ThemePicker;
