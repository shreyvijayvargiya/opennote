import React, {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useState,
} from "react";
import {
	Heading1,
	Heading2,
	List,
	ListOrdered,
	Type,
	CheckSquare,
	Code,
	Image as ImageIcon,
	Table as TableIcon,
	Info,
} from "lucide-react";

const SlashCommandList = forwardRef((props, ref) => {
	const [selectedIndex, setSelectedIndex] = useState(0);

	const selectItem = (index) => {
		const item = props.items[index];

		if (item) {
			props.command(item);
		}
	};

	const upHandler = () => {
		setSelectedIndex(
			(selectedIndex + props.items.length - 1) % props.items.length,
		);
	};

	const downHandler = () => {
		setSelectedIndex((selectedIndex + 1) % props.items.length);
	};

	const enterHandler = () => {
		selectItem(selectedIndex);
	};

	useEffect(() => setSelectedIndex(0), [props.items]);

	useImperativeHandle(ref, () => ({
		onKeyDown: ({ event }) => {
			if (event.key === "ArrowUp") {
				upHandler();
				return true;
			}

			if (event.key === "ArrowDown") {
				downHandler();
				return true;
			}

			if (event.key === "Enter") {
				enterHandler();
				return true;
			}

			return false;
		},
	}));

	return (
		<div className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
			{props.items.length ? (
				props.items.map((item, index) => (
					<button
						key={index}
						onClick={() => selectItem(index)}
						className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
							index === selectedIndex
								? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
								: "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
						}`}
					>
						<div className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
							{item.icon}
						</div>
						<div>
							<p className="font-medium">{item.title}</p>
							<p className="text-[11px] text-zinc-500 dark:text-zinc-500">
								{item.description}
							</p>
						</div>
					</button>
				))
			) : (
				<div className="px-3 py-2 text-sm text-zinc-500">No results</div>
			)}
		</div>
	);
});

SlashCommandList.displayName = "SlashCommandList";

export default SlashCommandList;
