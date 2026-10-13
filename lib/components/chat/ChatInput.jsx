import React, { useState } from "react";
import getCaretCoordinates from "textarea-caret";
import {
	ArrowUp,
	ChevronDown,
	FileSpreadsheet,
	FileText,
	Folder,
	Mic,
	Plus,
	Quote,
	Square,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MODELS } from "../../ai/openrouter";
import { processFile } from "../../ai/attachments";
import { splitTags, TAG_CLASS } from "../../ai/mentions";
import { cn } from "../../utils/cn";

const CloseDot = ({ onClick }) => (
	<button
		type="button"
		onClick={onClick}
		className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-zinc-600 shadow-sm transition-colors hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
	>
		<X className="h-2.5 w-2.5" />
	</button>
);

const AttachmentChip = ({ a, onRemove, onPreview }) => (
	<div className="relative flex h-12 items-center gap-2 rounded-xl border bg-muted/50 pl-1.5 pr-3 text-xs">
		{a.kind === "image" ? (
			<button
				type="button"
				title="Preview"
				onClick={() => onPreview({ src: a.dataUrl || a.preview || a.thumb, name: a.name })}
			>
				<img src={a.thumb} alt={a.name} className="h-9 w-9 rounded-lg object-cover" />
			</button>
		) : (
			<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-muted-foreground">
				{a.kind === "pdf" ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
			</span>
		)}
		<span className="max-w-[110px] truncate">{a.name}</span>
		<CloseDot onClick={onRemove} />
	</div>
);

const ChatInput = ({
	notes,
	model,
	onModelChange,
	streaming,
	onSend,
	onStop,
	inputRef,
	selections,
	onRemoveSelection,
	onPreview,
	onOpenNote,
}) => {
	const [value, setValue] = useState("");
	const [attachments, setAttachments] = useState([]);
	const [mentions, setMentions] = useState([]); // [{ id, title }]
	const [mention, setMention] = useState(null); // { query, start, top, left, index }
	const [listening, setListening] = useState(false);
	const [scrollTop, setScrollTop] = useState(0);
	const mirrorRef = React.useRef(null);
	const recRef = React.useRef(null);
	const fileRef = React.useRef(null);

	const autosize = () => {
		const el = inputRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
	};
	const setText = (v) => {
		setValue(v);
		requestAnimationFrame(autosize);
	};

	/* ---------- @ mentions ---------- */
	const detectMention = (el) => {
		const caret = el.selectionStart;
		const m = /(^|\s)@([^\s@]*)$/.exec(el.value.slice(0, caret));
		if (!m) return setMention(null);
		const coords = getCaretCoordinates(el, caret);
		setMention({
			query: m[2],
			start: caret - m[2].length - 1,
			top: el.offsetTop + coords.top - el.scrollTop,
			left: Math.min(el.offsetLeft + coords.left, el.offsetWidth - 240),
			index: 0,
		});
	};

	const mentionItems = mention
		? notes
				.filter((n) => (n.title || "Untitled").toLowerCase().includes(mention.query.toLowerCase()))
				.slice(0, 6)
		: [];

	const pickMention = (note) => {
		const el = inputRef.current;
		const title = note.title || "Untitled";
		const before = value.slice(0, mention.start);
		const after = value.slice(el.selectionStart);
		const insert = `@${title} `;
		setText(before + insert + after);
		setMentions((prev) =>
			prev.some((m) => m.id === note.id) ? prev : [...prev, { id: note.id, title }],
		);
		setMention(null);
		requestAnimationFrame(() => {
			const pos = before.length + insert.length;
			el.focus();
			el.setSelectionRange(pos, pos);
		});
	};

	/* ---------- tagged notes: highlighted inline, click to open ---------- */
	// The textarea text is transparent; a mirror layer behind it paints the same
	// text with the tags coloured (colour only, so glyph widths never change).
	const tagUnderPointer = (e) => {
		for (const el of mirrorRef.current?.querySelectorAll("[data-tag]") || []) {
			for (const r of el.getClientRects()) {
				if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
					return el.getAttribute("data-tag");
				}
			}
		}
		return null;
	};

	/* ---------- attachments ---------- */
	const addFiles = async (files) => {
		for (const file of files) {
			try {
				const a = await processFile(file);
				setAttachments((prev) => [...prev, a].slice(0, 6));
			} catch (err) {
				toast.error(err.message);
			}
		}
	};

	const onPaste = (e) => {
		const files = [...e.clipboardData.files];
		if (files.length) {
			e.preventDefault();
			addFiles(files);
		}
	};

	/* ---------- speech to text ---------- */
	const toggleMic = () => {
		if (listening) return recRef.current?.stop();
		const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SR) return toast.error("Speech recognition isn't supported in this browser");
		const rec = new SR();
		rec.continuous = true;
		rec.interimResults = true;
		rec.lang = navigator.language;
		const base = value ? value.replace(/\s*$/, " ") : "";
		let finalText = "";
		rec.onresult = (e) => {
			let interim = "";
			for (let i = e.resultIndex; i < e.results.length; i++) {
				const r = e.results[i];
				if (r.isFinal) finalText += r[0].transcript;
				else interim += r[0].transcript;
			}
			setText(base + finalText + interim);
		};
		rec.onend = () => setListening(false);
		rec.onerror = (e) => {
			setListening(false);
			if (e.error !== "no-speech" && e.error !== "aborted") toast.error("Speech recognition failed");
		};
		rec.start();
		recRef.current = rec;
		setListening(true);
	};

	/* ---------- send ---------- */
	const canSend = value.trim() || attachments.length;
	const submit = () => {
		if (!canSend || streaming) return;
		const text = value.trim();
		recRef.current?.stop();
		onSend({
			text,
			attachments,
			mentions: mentions.filter((m) => text.includes(`@${m.title}`)),
		});
		setValue("");
		setAttachments([]);
		setMentions([]);
		requestAnimationFrame(autosize);
	};

	const onKeyDown = (e) => {
		if (mention && mentionItems.length) {
			if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				const d = e.key === "ArrowDown" ? 1 : -1;
				return setMention((m) => ({
					...m,
					index: (m.index + d + mentionItems.length) % mentionItems.length,
				}));
			}
			if (e.key === "Enter" || e.key === "Tab") {
				e.preventDefault();
				return pickMention(mentionItems[mention.index]);
			}
		}
		if (mention && e.key === "Escape") return setMention(null);
		if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
			e.preventDefault();
			submit();
		}
	};

	const modelLabel = MODELS.find((m) => m.id === model)?.label || model.split("/").pop();

	return (
		<div
			className="rounded-2xl border border-zinc-200 bg-background p-2 shadow-sm dark:border-zinc-800 transition-shadow focus-within:shadow-md"
			onDragOver={(e) => e.preventDefault()}
			onDrop={(e) => {
				e.preventDefault();
				addFiles([...e.dataTransfer.files]);
			}}
		>
			{(attachments.length > 0 || selections.length > 0) && (
				<div className="mb-2 flex flex-wrap gap-2 pr-1.5 pt-1.5">
					{selections.map((s) => (
						<div
							key={s.id}
							className="relative flex h-12 max-w-[220px] items-center gap-2 rounded-xl border bg-muted/50 pl-2 pr-3 text-xs"
							title={s.text}
						>
							<Quote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
							<span className="line-clamp-2 text-muted-foreground">
								<b className="text-foreground">{s.title}</b> · {s.text}
							</span>
							<CloseDot onClick={() => onRemoveSelection(s.id)} />
						</div>
					))}
					{attachments.map((a) => (
						<AttachmentChip
							key={a.id}
							a={a}
							onRemove={() => setAttachments((p) => p.filter((x) => x.id !== a.id))}
							onPreview={onPreview}
						/>
					))}
				</div>
			)}

			<div className="relative">
				<div ref={mirrorRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
					<div
						className="whitespace-pre-wrap break-words px-2 py-1.5 text-sm text-foreground"
						style={{ transform: `translateY(-${scrollTop}px)` }}
					>
						{splitTags(value, mentions).map((part, i) =>
							part.id != null ? (
								<span key={i} data-tag={part.id} className={TAG_CLASS}>
									{part.text}
								</span>
							) : (
								<span key={i}>{part.text}</span>
							),
						)}
						{"\u200b"}
					</div>
				</div>
				<textarea
					ref={inputRef}
					value={value}
					rows={1}
					placeholder="Ask anything · @ to tag a note"
					onChange={(e) => {
						setValue(e.target.value);
						autosize();
						detectMention(e.target);
					}}
					onScroll={(e) => setScrollTop(e.target.scrollTop)}
					onKeyDown={onKeyDown}
					onKeyUp={(e) => {
						if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) detectMention(e.target);
					}}
					onClick={(e) => {
						const tagId = tagUnderPointer(e);
						if (tagId != null && e.currentTarget.selectionStart === e.currentTarget.selectionEnd) {
							return onOpenNote?.(tagId);
						}
						detectMention(e.target);
					}}
					onMouseMove={(e) => {
						e.currentTarget.style.cursor = tagUnderPointer(e) != null ? "pointer" : "text";
					}}
					onPaste={onPaste}
					style={{ scrollbarWidth: "none" }}
					className="hide-scrollbar relative block max-h-[200px] w-full resize-none bg-transparent px-2 py-1.5 text-sm text-transparent caret-zinc-800 outline-none placeholder:text-muted-foreground dark:caret-zinc-100 [&::-webkit-scrollbar]:hidden"
				/>

				{mention && (
					<div
						className="absolute z-20 w-60 -translate-y-full overflow-hidden rounded-xl border bg-popover p-1 shadow-lg"
						style={{ top: mention.top - 4, left: Math.max(0, mention.left) }}
					>
						{mentionItems.length === 0 ? (
							<div className="px-2.5 py-2 text-xs text-muted-foreground">No notes found</div>
						) : (
							mentionItems.map((n, i) => (
								<button
									key={n.id}
									type="button"
									onMouseDown={(e) => {
										e.preventDefault();
										pickMention(n);
									}}
									onMouseEnter={() => setMention((m) => ({ ...m, index: i }))}
									className={cn(
										"flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs",
										i === mention.index && "bg-accent",
									)}
								>
									{n.isFolder ? (
										<Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
									) : (
										<FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
									)}
									<span className="truncate">{n.title || "Untitled"}</span>
								</button>
							))
						)}
					</div>
				)}
			</div>

			<div className="mt-1 flex items-center gap-1">
				<input
					ref={fileRef}
					type="file"
					multiple
					accept="image/*,application/pdf,.pdf,text/csv,.csv"
					className="hidden"
					onChange={(e) => {
						addFiles([...e.target.files]);
						e.target.value = "";
					}}
				/>
				<Button
					variant="ghost"
					size="icon"
					title="Attach image, PDF or CSV"
					onClick={() => fileRef.current?.click()}
				>
					<Plus />
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none"
						>
							{modelLabel}
							<ChevronDown className="h-3 w-3" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent side="top" align="start" className="w-56">
						<DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
							{MODELS.map((m) => (
								<DropdownMenuRadioItem key={m.id} value={m.id}>
									{m.label}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				<div className="flex-1" />

				<Button
					variant="ghost"
					size="icon"
					title={listening ? "Stop dictation" : "Dictate"}
					onClick={toggleMic}
					className={cn(listening && "bg-red-500/10 text-red-500 hover:bg-red-500/20")}
				>
					<Mic className={cn(listening && "animate-pulse")} />
				</Button>
				{streaming ? (
					<Button variant="gray" size="icon" className="rounded-full" onClick={onStop} title="Stop">
						<Square className="fill-current" />
					</Button>
				) : (
					<Button
						variant="gray"
						size="icon"
						className="rounded-full"
						disabled={!canSend}
						onClick={submit}
						title="Send"
					>
						<ArrowUp />
					</Button>
				)}
			</div>
		</div>
	);
};

export default ChatInput;
