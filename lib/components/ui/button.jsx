import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
				gray: "bg-zinc-500 text-white hover:bg-zinc-600 dark:bg-zinc-600 dark:hover:bg-zinc-500",
				destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
				outline: "border border-input bg-transparent hover:bg-accent",
				ghost: "hover:bg-accent hover:text-accent-foreground",
			},
			size: {
				default: "h-9 px-4",
				sm: "h-8 px-3 text-xs",
				icon: "h-8 w-8",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

const Button = React.forwardRef(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				ref={ref}
				className={cn(buttonVariants({ variant, size }), className)}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
