import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Github, X } from "lucide-react";
import { DOCS } from "../../docs";
import { useApp } from "../../context/AppContext";
import { highlightCode } from "../../tables/highlight";
import { cn } from "../../utils/cn";

const components = {
	a: ({ href, children }) => (
		<a href={href} target="_blank" rel="noreferrer" className="text-indigo-600 underline decoration-indigo-300 underline-offset-2 dark:text-indigo-300">
			{children}
		</a>
	),
	pre: ({ children }) => <>{children}</>,
	code: ({ className, children }) => {
		const lang = /language-(\w+)/.exec(className || "")?.[1];
		const text = String(children).replace(/\n$/, "");
		if (!lang && !text.includes("\n")) return <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800">{text}</code>;
		return <pre className="hide-scrollbar overflow-x-auto rounded-xl border bg-zinc-50 p-4 font-mono text-xs leading-relaxed dark:bg-zinc-900" dangerouslySetInnerHTML={{ __html: highlightCode(text, lang === "json" ? "json" : lang === "bash" ? "bash" : lang || "plaintext") }} />;
	},
	table: ({ children }) => <div className="hide-scrollbar my-4 overflow-x-auto rounded-xl border"><table className="my-0 w-full border-collapse text-sm">{children}</table></div>,
	th: ({ children }) => <th className="border-b bg-zinc-50 px-3 py-2 text-left text-xs font-semibold dark:bg-zinc-900">{children}</th>,
	td: ({ children }) => <td className="border-b px-3 py-2 align-top last:border-0">{children}</td>,
};

/** "Getting started" page: documentation rendered from the Markdown files in /docs. */
const DocsPage = () => {
	const app = useApp();
	const [active, setActive] = useState(DOCS[0].id);
	const doc = DOCS.find((d) => d.id === active) || DOCS[0];
	return (
		<div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
			<div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
				<div className="hide-scrollbar flex gap-1 overflow-x-auto">
					{DOCS.map((d) => (
						<button
							key={d.id}
							type="button"
							onClick={() => setActive(d.id)}
							className={cn(
								"shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
								active === d.id ? "border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" : "border-transparent text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900",
							)}
						>
							{d.title}
						</button>
					))}
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<a href="https://github.com/shreyvijayvargiya/rowtabs" target="_blank" rel="noreferrer" className="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
						<Github className="h-3.5 w-3.5" /> GitHub
					</a>
					<button type="button" title="Close" onClick={() => app.setDocsOpen(false)} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800">
						<X className="h-4 w-4" />
					</button>
				</div>
			</div>
			<div className="hide-scrollbar flex-1 overflow-y-auto px-6 py-6">
				<article className="prose prose-zinc mx-auto max-w-3xl dark:prose-invert prose-headings:tracking-tight prose-pre:my-4 prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none">
					<ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{doc.body}</ReactMarkdown>
				</article>
			</div>
		</div>
	);
};

export default DocsPage;
