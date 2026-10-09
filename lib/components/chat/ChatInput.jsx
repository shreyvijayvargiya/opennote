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
import { cn } from "../../utils/cn";

const AttachmentChip = ({ a, onRemove }) => (
	<div className="group relative flex h-12 items-center gap-2 rounded-xl border bg-muted/50 pl-1.5 pr-7 text-xs">
		{a.kind === "image" ? (
			<img src={a.thumb} alt={a.name} className="h-9 w-9 rounded-lg object-cover" />
		) : (
			<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-muted-foreground">
				{a.kind === "pdf" ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
			</span>
		)}
		<span className="max-w-[110px] truncate">{a.name}</span>
		<button
			type="button"
			onClick={onRemove}
			className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
		>
			<X className="h-3 w-3" />
		</button>
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
}) => {
	const [value, setValue] = useState("");
	const [attachments, setAttachments] = useState([]);
	const [mentions, setMentions] = useState([]); // [{ id, title }]
	const [mention, setMention] = useState(null); // { query, start, top, left, index }
	const [listening, setListening] = useState(false);
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
			className="rounded-2xl border bg-background p-2 shadow-sm transition-shadow focus-within:shadow-md"
			onDragOver={(e) => e.preventDefault()}
			onDrop={(e) => {
				e.preventDefault();
				addFiles([...e.dataTransfer.files]);
			}}
		>
			{(attachments.length > 0 || selections.length > 0) && (
				<div className="mb-2 flex flex-wrap gap-1.5">
					{selections.map((s) => (
						<div
							key={s.id}
							className="relative flex h-12 max-w-[220px] items-center gap-2 rounded-xl border bg-muted/50 pl-2 pr-7 text-xs"
							title={s.text}
						>
							<Quote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
							<span className="line-clamp-2 text-muted-foreground">
								<b className="text-foreground">{s.title}</b> · {s.text}
							</span>
							<button
								type="button"
								onClick={() => onRemoveSelection(s.id)}
								className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
					{attachments.map((a) => (
						<AttachmentChip
							key={a.id}
							a={a}
							onRemove={() => setAttachments((p) => p.filter((x) => x.id !== a.id))}
						/>
					))}
				</div>
			)}

			<div className="relative">
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
					onKeyDown={onKeyDown}
					onKeyUp={(e) => {
						if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) detectMention(e.target);
					}}
					onClick={(e) => detectMention(e.target)}
					onPaste={onPaste}
					className="block max-h-[200px] w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
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
					<Button size="icon" className="rounded-full" onClick={onStop} title="Stop">
						<Square className="fill-current" />
					</Button>
				) : (
					<Button
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
