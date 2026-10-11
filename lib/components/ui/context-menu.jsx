import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { cn } from "../../utils/cn";

const ContextMenu = ContextMenuPrimitive.Root;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuContent = React.forwardRef(({ className, ...props }, ref) => (
	<ContextMenuPrimitive.Portal>
		<ContextMenuPrimitive.Content
			ref={ref}
			className={cn(
				"z-[90] min-w-[10rem] overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
				className,
			)}
			{...props}
		/>
	</ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = "ContextMenuContent";

const ContextMenuItem = React.forwardRef(({ className, ...props }, ref) => (
	<ContextMenuPrimitive.Item
		ref={ref}
		className={cn(
			"relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors focus:bg-accent focus:text-accent-foreground [&_svg]:size-3.5 [&_svg]:shrink-0",
			className,
		)}
		{...props}
	/>
));
ContextMenuItem.displayName = "ContextMenuItem";

export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem };
