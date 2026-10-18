import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Table01Icon, Folder01Icon } from "@hugeicons/core-free-icons";
import { parseIcon } from "../icons";
import { cn } from "../utils/cn";

/** Icon of a table/folder: its custom icon/emoji, else the default table/folder icon. */
const NoteIcon = ({ note, size = 14, className }) => {
	const custom = parseIcon(note?.icon);
	if (custom?.type === "emoji") {
		return (
			<span
				className={cn("inline-flex shrink-0 items-center justify-center leading-none", className)}
				style={{ fontSize: size, width: size, height: size }}
			>
				{custom.value}
			</span>
		);
	}
	return (
		<HugeiconsIcon
			icon={custom?.value || (note?.isFolder ? Folder01Icon : Table01Icon)}
			size={size}
			strokeWidth={1.8}
			className={cn("shrink-0", className)}
		/>
	);
};

export default NoteIcon;
