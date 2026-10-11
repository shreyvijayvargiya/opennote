import React, { useRef } from "react";
import { ImagePlus, Send, Square, X } from "lucide-react";
import { WRITER_ACTIONS, WRITER_MODES } from "../ai/actions";
import { MAX_IMAGE_BYTES, MAX_IMAGES } from "../ai/limits";

const readImage = (file) =>
	new Promise((resolve, reject) => {
		if (!file.type?.startsWith("image/")) {
			reject(new Error("Only images can be attached."));
			return;
		}
		if (file.size > MAX_IMAGE_BYTES) {
			reject(new Error("Each image must be under 800KB."));
			return;
		}
		const reader = new FileReader();
		reader.onload = () =>
			resolve({
				name: file.name || "image",
				dataUrl: String(reader.result || ""),
			});
		reader.onerror = () => reject(new Error("Could not read that image."));
		reader.readAsDataURL(file);
	});

const AIInput = ({
	inputRef,
	value,
	onChange,
	onSubmit,
	disabled,
	mode,
	onMode,
	onQuickAction,
	images,
	onImages,
	onError,
	busy,
	onStop,
}) => {
	const fileRef = useRef(null);

	const addFiles = async (fileList) => {
		const files = [...fileList].slice(0, MAX_IMAGES - images.length);
		if (!files.length) return;
		try {
			const next = [];
			for (const file of files) {
				next.push(await readImage(file));
			}
			onImages([...images, ...next].slice(0, MAX_IMAGES));
		} catch (error) {
			onError?.(error.message || "Could not attach that image.");
		}
	};

	return (
		<div className="shrink-0 border-t border-zinc-100 px-3 py-3 dark:border-zinc-900">
			<div className="mb-2 flex gap-1 overflow-x-auto pb-1">
				{WRITER_ACTIONS.map((action) => (
					<button
						key={action.id}
						type="button"
						disabled={disabled}
						onClick={() => onQuickAction(action)}
						className="shrink-0 rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-zinc-900"
					>
						{action.label}
					</button>
				))}
			</div>

			<div className="mb-2 flex rounded-xl bg-zinc-100 p-0.5 dark:bg-zinc-900">
				{WRITER_MODES.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => onMode(item.id)}
						className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${
							mode === item.id
								? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
								: "text-zinc-400"
						}`}
						title={item.hint}
					>
						{item.label}
					</button>
				))}
			</div>

			{images.length > 0 && (
				<div className="mb-2 flex gap-2">
					{images.map((image) => (
						<div key={image.dataUrl} className="relative">
							<img
								src={image.dataUrl}
								alt={image.name}
								className="h-12 w-12 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
							/>
							<button
								type="button"
								onClick={() =>
									onImages(images.filter((item) => item.dataUrl !== image.dataUrl))
								}
								className="absolute -right-1 -top-1 rounded-full bg-zinc-900 p-0.5 text-white dark:bg-zinc-100 dark:text-zinc-900"
							>
								<X className="h-2.5 w-2.5" />
							</button>
						</div>
					))}
				</div>
			)}

			<div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
				<textarea
					ref={inputRef}
					value={value}
					disabled={disabled}
					rows={3}
					placeholder="Ask about this note, or describe the edit"
					onChange={(event) => onChange(event.target.value)}
					onPaste={(event) => {
						const files = [...event.clipboardData.files].filter((file) =>
							file.type.startsWith("image/"),
						);
						if (!files.length) return;
						event.preventDefault();
						addFiles(files);
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter" && !event.shiftKey) {
							event.preventDefault();
							onSubmit();
						}
					}}
					className="w-full resize-none bg-transparent px-3 py-2 text-xs outline-none placeholder:text-zinc-400 disabled:opacity-60"
				/>
				<div className="flex items-center justify-between px-2 pb-2">
					<button
						type="button"
						disabled={disabled || images.length >= MAX_IMAGES}
						onClick={() => fileRef.current?.click()}
						className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-900"
						title="Attach an image"
					>
						<ImagePlus className="h-3.5 w-3.5" />
					</button>
					<input
						ref={fileRef}
						type="file"
						accept="image/png,image/jpeg,image/gif,image/webp"
						multiple
						className="hidden"
						onChange={(event) => {
							addFiles(event.target.files || []);
							event.target.value = "";
						}}
					/>
					{busy ? (
						<button
							type="button"
							onClick={onStop}
							className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
						>
							<Square className="h-3 w-3 fill-current" />
							Stop
						</button>
					) : (
						<button
							type="button"
							disabled={disabled || !value.trim()}
							onClick={onSubmit}
							className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
						>
							<Send className="h-3 w-3" />
							Send
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default AIInput;
