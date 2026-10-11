import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { formatInline, parseMarkdown } from "../ai/markdown";

const Inline = ({ text }) =>
	formatInline(text).map((part, index) => {
		if (part.type === "strong") return <strong key={index}>{part.value}</strong>;
		if (part.type === "em") return <em key={index}>{part.value}</em>;
		if (part.type === "code") {
			return (
				<code
					key={index}
					className="rounded bg-zinc-100 px-1 py-0.5 text-[11px] dark:bg-zinc-800"
				>
					{part.value}
				</code>
			);
		}
		if (part.type === "link") {
			return (
				<a
					key={index}
					href={part.href}
					target="_blank"
					rel="noreferrer"
					className="underline underline-offset-2"
				>
					{part.value}
				</a>
			);
		}
		return <span key={index}>{part.value}</span>;
	});

const MarkdownView = ({ content }) => {
	const blocks = parseMarkdown(content);
	if (!blocks.length) return null;
	return (
		<div className="space-y-2">
			{blocks.map((block, index) => {
				if (block.type === "heading") {
					const Tag = block.level === 1 ? "h3" : "h4";
					return (
						<Tag key={index} className="text-[13px] font-semibold tracking-tight">
							<Inline text={block.text} />
						</Tag>
					);
				}
				if (block.type === "quote") {
					return (
						<blockquote
							key={index}
							className="border-l-2 border-zinc-200 pl-2 text-zinc-500 dark:border-zinc-700"
						>
							<Inline text={block.text} />
						</blockquote>
					);
				}
				if (block.type === "code" || block.type === "proposal") {
					return (
						<pre
							key={index}
							className={`overflow-x-auto rounded-xl px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap ${
								block.type === "proposal"
									? "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
									: "bg-zinc-950 text-zinc-100"
							}`}
						>
							{block.type === "proposal" && (
								<div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
									Proposed text
								</div>
							)}
							{block.text}
						</pre>
					);
				}
				if (block.type === "list") {
					const Tag = block.ordered ? "ol" : "ul";
					return (
						<Tag
							key={index}
							className={`space-y-1 pl-4 ${block.ordered ? "list-decimal" : "list-disc"}`}
						>
							{block.items.map((item, itemIndex) => (
								<li key={itemIndex}>
									<Inline text={item} />
								</li>
							))}
						</Tag>
					);
				}
				return (
					<p key={index} className="leading-relaxed">
						<Inline text={block.text} />
					</p>
				);
			})}
		</div>
	);
};

const AIMessage = ({
	message,
	hasSelection,
	onInsert,
	onReplaceSelection,
	onCopy,
	onReplaceDocument,
}) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef(null);

	useEffect(() => {
		if (!menuOpen) return undefined;
		const onPointer = (event) => {
			if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
		};
		document.addEventListener("mousedown", onPointer);
		return () => document.removeEventListener("mousedown", onPointer);
	}, [menuOpen]);

	if (message.role === "user") {
		return (
			<div className="ml-8">
				{message.images?.length > 0 && (
					<div className="mb-1.5 flex justify-end gap-1.5">
						{message.images.map((image) => (
							<img
								key={image.dataUrl}
								src={image.dataUrl}
								alt={image.name || "Attachment"}
								className="h-14 w-14 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
							/>
						))}
					</div>
				)}
				<div className="rounded-2xl bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-white dark:bg-zinc-100 dark:text-zinc-900">
					{message.content}
				</div>
			</div>
		);
	}

	if (message.role === "error") {
		return (
			<div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
				{message.content}
			</div>
		);
	}

	const canReplaceDocument = message.intent === "rewrite-document";

	return (
		<div className="mr-2 text-xs text-zinc-800 dark:text-zinc-200">
			{message.activity?.length > 0 && (
				<div className="mb-2 space-y-1">
					{message.activity.map((item, index) => (
						<div
							key={`${item}-${index}`}
							className="mb-1 mr-1 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-900"
						>
							<Check className="h-3 w-3" />
							{item}
						</div>
					))}
				</div>
			)}
			{message.content ? <MarkdownView content={message.content} /> : null}
			{message.content ? (
				<div className="mt-2 flex flex-wrap items-center gap-1">
					<button
						type="button"
						onClick={() => onInsert(message)}
						className="rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
					>
						Insert
					</button>
					<button
						type="button"
						disabled={!hasSelection}
						onClick={() => onReplaceSelection(message)}
						className="rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
					>
						Replace selection
					</button>
					<button
						type="button"
						onClick={() => onCopy(message)}
						className="rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
					>
						<Copy className="mr-1 inline h-3 w-3" />
						Copy
					</button>
					<div className="relative" ref={menuRef}>
						<button
							type="button"
							onClick={() => setMenuOpen((open) => !open)}
							className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
						>
							Use this
							<ChevronDown className="h-3 w-3" />
						</button>
						{menuOpen && (
							<div className="absolute left-0 top-7 z-20 w-48 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
								<button
									type="button"
									onClick={() => {
										setMenuOpen(false);
										onInsert(message);
									}}
									className="block w-full rounded-lg px-2 py-1.5 text-left text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-900"
								>
									Insert at cursor
								</button>
								<button
									type="button"
									disabled={!hasSelection}
									onClick={() => {
										setMenuOpen(false);
										onReplaceSelection(message);
									}}
									className="block w-full rounded-lg px-2 py-1.5 text-left text-[11px] hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-900"
								>
									Replace selected text
								</button>
								<button
									type="button"
									onClick={() => {
										setMenuOpen(false);
										onCopy(message);
									}}
									className="block w-full rounded-lg px-2 py-1.5 text-left text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-900"
								>
									Copy
								</button>
								{canReplaceDocument && (
									<button
										type="button"
										onClick={() => {
											setMenuOpen(false);
											onReplaceDocument(message);
										}}
										className="block w-full rounded-lg px-2 py-1.5 text-left text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-900"
									>
										Replace document
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			) : null}
		</div>
	);
};

export default AIMessage;
