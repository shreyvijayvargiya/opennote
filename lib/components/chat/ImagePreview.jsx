import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useHotkeys } from "react-hotkeys-hook";
import { Copy, Download, X } from "lucide-react";
import { toast } from "sonner";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "../ui/context-menu";

const toPngBlob = async (src) => {
	const bitmap = await createImageBitmap(await (await fetch(src)).blob());
	const canvas = document.createElement("canvas");
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	canvas.getContext("2d").drawImage(bitmap, 0, 0);
	return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
};

/**
 * Full-size image preview (like Cursor). Only mounted while open, so its
 * keyboard shortcuts exist only for the preview:
 *   Esc close · ⌘/Ctrl+C copy image · ⌘/Ctrl+S download image
 * Right-click the image for the same actions.
 */
const ImagePreview = ({ image, onClose }) => {
	const [menuOpen, setMenuOpen] = useState(false); // Esc should close the menu first
	const copyImage = async () => {
		try {
			const blob = await toPngBlob(image.src);
			await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
			toast.success("Image copied");
		} catch {
			toast.error("Couldn't copy the image");
		}
	};
	const downloadImage = () => {
		const a = document.createElement("a");
		a.href = image.src;
		a.download = (image.name || "image").replace(/\.[^.]+$/, "") + ".png";
		a.click();
	};

	useHotkeys("esc", onClose, { enabled: !menuOpen });
	useHotkeys("mod+c", copyImage, { preventDefault: true });
	useHotkeys("mod+s", downloadImage, { preventDefault: true });

	return (
		<DialogPrimitive.Root open onOpenChange={(o) => !o && onClose()}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm" />
				<DialogPrimitive.Content
					onEscapeKeyDown={(e) => e.preventDefault()} // handled by useHotkeys above
					aria-describedby={undefined}
					className="fixed inset-0 z-[71] flex items-center justify-center p-8 outline-none"
					onClick={onClose}
				>
					<DialogPrimitive.Title className="sr-only">{image.name}</DialogPrimitive.Title>
					<div className="absolute right-4 top-4 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
						{[
							{ title: "Copy image (⌘C)", icon: Copy, onClick: copyImage },
							{ title: "Download image (⌘S)", icon: Download, onClick: downloadImage },
							{ title: "Close (Esc)", icon: X, onClick: onClose },
						].map(({ title, icon: Icon, onClick }) => (
							<button
								key={title}
								type="button"
								title={title}
								onClick={onClick}
								className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-500/80 text-white transition-colors hover:bg-zinc-500"
							>
								<Icon className="h-4 w-4" />
							</button>
						))}
					</div>
					<ContextMenu onOpenChange={setMenuOpen}>
						<ContextMenuTrigger asChild>
							<img
								src={image.src}
								alt={image.name}
								onClick={(e) => e.stopPropagation()}
								className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
							/>
						</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuItem onSelect={copyImage}>
								<Copy /> Copy image
							</ContextMenuItem>
							<ContextMenuItem onSelect={downloadImage}>
								<Download /> Download image
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
};

export default ImagePreview;
