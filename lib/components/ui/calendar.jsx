import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

/** shadcn-style calendar (react-day-picker v8) using the app's tokens. */
function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn("p-1", className)}
			classNames={{
				months: "flex flex-col space-y-4",
				month: "space-y-3",
				caption: "relative flex items-center justify-center pt-1",
				caption_label: "text-sm font-medium",
				nav: "flex items-center",
				nav_button:
					"inline-flex h-7 w-7 items-center justify-center rounded-lg border bg-transparent p-0 opacity-70 hover:bg-accent hover:opacity-100",
				nav_button_previous: "absolute left-1",
				nav_button_next: "absolute right-1",
				table: "w-full border-collapse",
				head_row: "flex",
				head_cell: "w-9 rounded-md text-[0.7rem] font-normal text-muted-foreground",
				row: "mt-1 flex w-full",
				cell: "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
				day: "inline-flex h-9 w-9 items-center justify-center rounded-lg p-0 text-sm font-normal hover:bg-accent aria-selected:opacity-100",
				day_selected: "bg-primary text-primary-foreground hover:bg-primary",
				day_today: "border border-ring",
				day_outside: "text-muted-foreground opacity-40",
				day_disabled: "text-muted-foreground opacity-40",
				day_hidden: "invisible",
				...classNames,
			}}
			components={{
				IconLeft: () => <ChevronLeft className="h-4 w-4" />,
				IconRight: () => <ChevronRight className="h-4 w-4" />,
			}}
			{...props}
		/>
	);
}
Calendar.displayName = "Calendar";

export { Calendar };
