import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "../../utils/cn";

// react-markdown drops unknown protocols; keep our own page:// links for opening notes
const urlTransform = (url) => (url.startsWith("page://") ? url : /^(https?:|mailto:|tel:|#|\/)/i.test(url) ? url : "");

const CodeBlock = ({ children }) => {
	const [copied, setCopied] = React.useState(false);
	const code = children?.props?.children;
	const text = Array.isArray(code) ? code.join("") : String(code ?? "");
	return (
		<div className="group/code relative my-2">
			<pre className="hide-scrollbar overflow-x-auto rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
				{children}
			</pre>
			<button
				type="button"
				title="Copy code"
				onClick={async () => {
					await navigator.clipboard.writeText(text.replace(/\n$/, ""));
					setCopied(true);
					setTimeout(() => setCopied(false), 1200);
				}}
				className="absolute right-2 top-2 rounded-lg border border-zinc-200 bg-zinc-100 p-1.5 text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-200 group-hover/code:opacity-100 dark:border-zinc-700 dark:bg-zinc-800"
			>
				{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
			</button>
		</div>
	);
};

/** Assistant reply: GitHub-flavoured Markdown with clickable links and copyable code. */
const Markdown = ({ children, onOpenNote }) => (
	<div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			urlTransform={urlTransform}
			components={{
				a: ({ href = "", children }) =>
					href.startsWith("page://") ? (
						<button
							type="button"
							onClick={() => onOpenNote?.(href.slice(7))}
							className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800 dark:text-indigo-300"
						>
							{children}
						</button>
					) : (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-baseline gap-0.5 break-words font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800 dark:text-indigo-300"
						>
							{children}
							<ExternalLink className="h-2.5 w-2.5 shrink-0 self-center opacity-60" />
						</a>
					),
				h1: (p) => <h1 className="mb-2 mt-4 text-base font-bold" {...p} />,
				h2: (p) => <h2 className="mb-2 mt-4 text-[15px] font-bold" {...p} />,
				h3: (p) => <h3 className="mb-1.5 mt-3 text-sm font-semibold" {...p} />,
				h4: (p) => <h4 className="mb-1 mt-3 text-sm font-semibold" {...p} />,
				p: (p) => <p className="my-2" {...p} />,
				ul: ({ className, ...p }) => (
					<ul
						className={cn(
							"my-2 space-y-1",
							className?.includes("contains-task-list") ? "list-none pl-1" : "list-disc pl-5 marker:text-zinc-400",
						)}
						{...p}
					/>
				),
				ol: (p) => <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-zinc-400" {...p} />,
				li: (p) => <li className="pl-0.5" {...p} />,
				input: (p) => <input {...p} disabled className="mr-1.5 align-middle accent-zinc-500" />,
				blockquote: (p) => (
					<blockquote className="my-2 border-l-2 border-zinc-300 pl-3 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300" {...p} />
				),
				hr: () => <hr className="my-3 border-zinc-200 dark:border-zinc-800" />,
				strong: (p) => <strong className="font-semibold" {...p} />,
				pre: CodeBlock,
				code: ({ className, children, ...p }) =>
					className ? (
						<code className={cn(className, "font-mono")} {...p}>
							{children}
						</code>
					) : (
						<code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800" {...p}>
							{children}
						</code>
					),
				table: (p) => (
					<div className="hide-scrollbar my-2 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
						<table className="w-full border-collapse text-xs" {...p} />
					</div>
				),
				th: (p) => <th className="border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 text-left font-semibold dark:border-zinc-800 dark:bg-zinc-900" {...p} />,
				td: (p) => <td className="border-b border-zinc-100 px-3 py-1.5 align-top last:border-0 dark:border-zinc-800/60" {...p} />,
				img: ({ src, alt }) => <img src={src} alt={alt} className="my-2 max-h-64 rounded-xl border" />,
			}}
		>
			{children}
		</ReactMarkdown>
	</div>
);

export default Markdown;
