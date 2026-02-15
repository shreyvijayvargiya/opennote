import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapImage from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import bash from "highlight.js/lib/languages/bash";
import markdown from "highlight.js/lib/languages/markdown";
import json from "highlight.js/lib/languages/json";

lowlight.registerLanguage("javascript", javascript);
lowlight.registerLanguage("css", css);
lowlight.registerLanguage("xml", xml);
lowlight.registerLanguage("html", xml);
lowlight.registerLanguage("python", python);
lowlight.registerLanguage("typescript", typescript);
lowlight.registerLanguage("bash", bash);
lowlight.registerLanguage("markdown", markdown);
lowlight.registerLanguage("json", json);

import SlashCommand from "../tiptap/slash-command";
import SlashCommandList from "./SlashCommandList";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import {
	Mic,
	Square,
	Send,
	Loader2,
	Save,
	Type,
	Bold,
	Italic,
	List,
	ListOrdered,
	Heading1,
	Heading2,
	CheckSquare,
	Code,
	Image as ImageIcon,
	Table as TableIcon,
	Link as LinkIcon,
	Info,
	Plus,
} from "lucide-react";
import { toast } from "sonner";
import { debounce } from "lodash";
import { useTheme } from "../context/ThemeContext";

import { noteService } from "../db/noteService";

const TiptapEditor = ({ initialNote, onUpdate }) => {
	const { isDarkMode } = useTheme();
	const user = { uid: "local-user" }; // Mock local user
	const [isRecording, setIsRecording] = useState(false);
	const [spokenText, setSpokenText] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [showMediaModal, setShowMediaModal] = useState(false);
	const [mediaType, setMediaType] = useState(null); // 'image' or 'table'
	const [mediaUrl, setMediaUrl] = useState("");
	const [linkUrl, setLinkUrl] = useState("");
	const [showLinkModal, setShowLinkModal] = useState(false);
	const [tableRows, setTableRows] = useState(3);
	const [tableCols, setTableCols] = useState(3);
	const fileInputRef = useRef(null);
	const recognitionRef = useRef(null);

	const handleMediaSubmit = () => {
		if (mediaType === "image") {
			if (mediaUrl) {
				editor.chain().focus().setImage({ src: mediaUrl }).run();
				// Update content ref and save immediately for large assets
				contentRef.current = editor.getHTML();
				saveNoteImmediately();
			}
		} else if (mediaType === "table") {
			editor
				.chain()
				.focus()
				.insertTable({
					rows: parseInt(tableRows),
					cols: parseInt(tableCols),
					withHeaderRow: true,
				})
				.run();
		}
		setShowMediaModal(false);
		setMediaUrl("");
		setMediaType(null);
	};

	const handleLinkSubmit = () => {
		if (linkUrl) {
			// Auto-prepend https:// if protocol is missing
			let url = linkUrl;
			if (
				!url.includes("://") &&
				!url.startsWith("mailto:") &&
				!url.startsWith("tel:")
			) {
				url = `https://${url}`;
			}

			const { from, to } = editor.state.selection;
			const isNoSelection = from === to;

			if (isNoSelection) {
				// If no selection, insert the link text and apply the link mark
				editor
					.chain()
					.focus()
					.insertContent(`<a href="${url}">${url}</a> `)
					.run();
			} else {
				// If there is a selection, apply the link mark to it
				editor
					.chain()
					.focus()
					.extendMarkRange("link")
					.setLink({ href: url })
					.run();
			}
		} else {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
		}
		setShowLinkModal(false);
		setLinkUrl("");
	};

	const handleFileUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				toast.error("Image too large (max 5MB)");
				return;
			}
			const reader = new FileReader();
			setIsSaving(true);
			toast.info("Processing image...");
			reader.onload = (event) => {
				editor.chain().focus().setImage({ src: event.target.result }).run();
				// Update content ref and save immediately for large assets
				const html = editor.getHTML();
				contentRef.current = html;
				saveNoteImmediately().then(() => {
					toast.success("Image saved locally");
				});
				setShowMediaModal(false);
			};
			reader.onerror = () => {
				toast.error("Failed to read image file");
				setIsSaving(false);
			};
			reader.readAsDataURL(file);
		}
	};

	const suggestion = {
		items: ({ query }) => {
			return [
				{
					title: "Heading 1",
					description: "Large section heading",
					icon: <Heading1 className="w-4 h-4" />,
					command: ({ editor, range }) => {
						editor
							.chain()
							.focus()
							.deleteRange(range)
							.setNode("heading", { level: 1 })
							.run();
					},
				},
				{
					title: "Heading 2",
					description: "Medium section heading",
					icon: <Heading2 className="w-4 h-4" />,
					command: ({ editor, range }) => {
						editor
							.chain()
							.focus()
							.deleteRange(range)
							.setNode("heading", { level: 2 })
							.run();
					},
				},
				{
					title: "Bullet List",
					description: "Create a simple bullet list",
					icon: <List className="w-4 h-4" />,
					command: ({ editor, range }) => {
						editor.chain().focus().deleteRange(range).toggleBulletList().run();
					},
				},
				{
					title: "Numbered List",
					description: "Create a list with numbering",
					icon: <ListOrdered className="w-4 h-4" />,
					command: ({ editor, range }) => {
						editor.chain().focus().deleteRange(range).toggleOrderedList().run();
					},
				},
				{
					title: "Checklist",
					description: "Track tasks with a checklist",
					icon: <CheckSquare className="w-4 h-4" />,
					command: ({ editor, range }) => {
						editor.chain().focus().deleteRange(range).toggleTaskList().run();
					},
				},
				{
					title: "Code Block",
					description: "Add a code snippet",
					icon: <Code className="w-4 h-4" />,
					command: ({ editor, range }) => {
						editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
					},
				},
				{
					title: "Link",
					description: "Add a link to selected text",
					icon: <LinkIcon className="w-4 h-4" />,
					command: ({ editor, range }) => {
						editor.chain().focus().deleteRange(range).run();
						const previousUrl = editor.getAttributes("link").href;
						setLinkUrl(previousUrl || "");
						setShowLinkModal(true);
					},
				},
				{
					title: "Table",
					description: "Insert a simple table",
					icon: <TableIcon className="w-4 h-4" />,
					command: ({ editor, range }) => {
						editor.chain().focus().deleteRange(range).run();
						setMediaType("table");
						setShowMediaModal(true);
					},
				},
				{
					title: "Image",
					description: "Insert an image from URL",
					icon: <ImageIcon className="w-4 h-4" />,
					command: ({ editor, range }) => {
						editor.chain().focus().deleteRange(range).run();
						setMediaType("image");
						setShowMediaModal(true);
					},
				},
				{
					title: "Info Block",
					description: "Add an information callout",
					icon: <Info className="w-4 h-4" />,
					command: ({ editor, range }) => {
						editor.chain().focus().deleteRange(range).toggleBlockquote().run();
					},
				},
			].filter((item) =>
				item.title.toLowerCase().startsWith(query.toLowerCase()),
			);
		},

		render: () => {
			let component;
			let popup;

			return {
				onStart: (props) => {
					component = new ReactRenderer(SlashCommandList, {
						props,
						editor: props.editor,
					});

					if (!props.clientRect) {
						return;
					}

					popup = tippy("body", {
						getReferenceClientRect: props.clientRect,
						appendTo: () => document.body,
						content: component.element,
						showOnCreate: true,
						interactive: true,
						trigger: "manual",
						placement: "bottom-start",
						theme: "light",
					});
				},

				onUpdate(props) {
					component.updateProps(props);

					if (!props.clientRect) {
						return;
					}

					popup[0].setProps({
						getReferenceClientRect: props.clientRect,
					});
				},

				onKeyDown(props) {
					if (props.event.key === "Escape") {
						popup[0].hide();
						return true;
					}

					return component.ref?.onKeyDown(props);
				},

				onExit() {
					popup[0].destroy();
					component.destroy();
				},
			};
		},
	};

	const [title, setTitle] = useState(initialNote.title || "Untitled Note");

	// Use refs to avoid stale closures in debounced function
	const titleRef = useRef(title);
	const contentRef = useRef(initialNote.content || "");
	const initialNoteRef = useRef(initialNote);

	const saveNoteImmediately = async () => {
		setIsSaving(true);
		try {
			const savedNote = await noteService.saveNote(user.uid, {
				...initialNoteRef.current,
				title: titleRef.current,
				content: contentRef.current,
			});
			if (onUpdate) onUpdate(savedNote);
		} catch (error) {
			console.error("Manual save failed:", error);
			toast.error("Save failed locally");
		} finally {
			setIsSaving(false);
		}
	};

	const debouncedUpdate = useRef(
		debounce(async () => {
			await saveNoteImmediately();
		}, 1000),
	).current;

	useEffect(() => {
		return () => {
			debouncedUpdate.cancel();
		};
	}, [debouncedUpdate]);

	const handleTitleChange = (e) => {
		const newTitle = e.target.value;
		setTitle(newTitle);
		titleRef.current = newTitle;
		debouncedUpdate();
	};

	const editor = useEditor({
		extensions: [
			StarterKit,
			Placeholder.configure({
				placeholder: "Type / for commands...",
			}),
			TiptapImage.configure({
				allowBase64: true,
				HTMLAttributes: {
					class:
						"rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 my-8",
				},
			}),
			Table.configure({
				resizable: true,
			}),
			TableRow,
			TableHeader,
			TableCell,
			TaskList,
			TaskItem.configure({
				nested: true,
			}),
			CodeBlockLowlight.configure({
				lowlight,
			}),
			Link.configure({
				openOnClick: true,
				autolink: true,
				defaultProtocol: "https",
				protocols: ["http", "https"],
				isAllowedUri: (url, ctx) => {
					try {
						// construct URL
						const parsedUrl = url.includes(":")
							? new URL(url)
							: new URL(`${ctx.defaultProtocol}://${url}`);

						// use default validation
						if (!ctx.defaultValidate(parsedUrl.href)) {
							return false;
						}

						// disallowed protocols
						const disallowedProtocols = ["ftp", "file", "mailto"];
						const protocol = parsedUrl.protocol.replace(":", "");

						if (disallowedProtocols.includes(protocol)) {
							return false;
						}

						// only allow protocols specified in ctx.protocols
						const allowedProtocols = ctx.protocols.map((p) =>
							typeof p === "string" ? p : p.scheme,
						);

						if (!allowedProtocols.includes(protocol)) {
							return false;
						}

						// disallowed domains
						const disallowedDomains = [
							"example-phishing.com",
							"malicious-site.net",
						];
						const domain = parsedUrl.hostname;

						if (disallowedDomains.includes(domain)) {
							return false;
						}

						// all checks have passed
						return true;
					} catch {
						return false;
					}
				},
				shouldAutoLink: (url) => {
					try {
						// construct URL
						const parsedUrl = url.includes(":")
							? new URL(url)
							: new URL(`https://${url}`);

						// only auto-link if the domain is not in the disallowed list
						const disallowedDomains = [
							"example-no-autolink.com",
							"another-no-autolink.com",
						];
						const domain = parsedUrl.hostname;

						return !disallowedDomains.includes(domain);
					} catch {
						return false;
					}
				},
				HTMLAttributes: {
					class:
						"text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400/50 underline-offset-4 cursor-pointer font-medium transition-all hover:text-indigo-800 dark:hover:text-indigo-200",
				},
			}),
			Markdown.configure({
				html: true,
				tightLists: true,
				bulletListMarker: "-",
				linkify: true,
			}),
			SlashCommand.configure({
				suggestion,
			}),
		],
		content: initialNote.content || "",
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			contentRef.current = html;
			debouncedUpdate();
		},
		onBlur: () => {
			saveNoteImmediately();
		},
	});
	// Update refs when props change
	useEffect(() => {
		// Only update local state if the note ID actually changed
		if (initialNote.id !== initialNoteRef.current?.id) {
			setTitle(initialNote.title || "Untitled Note");
			titleRef.current = initialNote.title || "Untitled Note";
			contentRef.current = initialNote.content || "";
			// If we have an editor, we should also update its content
			if (editor) {
				editor.commands.setContent(initialNote.content || "");
			}
		}
		initialNoteRef.current = initialNote;
	}, [initialNote, editor]);

	// Voice Recording Logic
	useEffect(() => {
		if (
			typeof window !== "undefined" &&
			("webkitSpeechRecognition" in window || "speechRecognition" in window)
		) {
			const SpeechRecognition =
				window.webkitSpeechRecognition || window.speechRecognition;
			recognitionRef.current = new SpeechRecognition();
			recognitionRef.current.continuous = true;
			recognitionRef.current.interimResults = true;

			recognitionRef.current.onresult = (event) => {
				let interimTranscript = "";
				for (let i = event.resultIndex; i < event.results.length; ++i) {
					if (event.results[i].isFinal) {
						setSpokenText(
							(prev) => prev + " " + event.results[i][0].transcript,
						);
					} else {
						interimTranscript += event.results[i][0].transcript;
					}
				}
			};

			recognitionRef.current.onerror = (event) => {
				console.error("Speech recognition error:", event.error);
				setIsRecording(false);
				toast.error("Speech recognition failed");
			};
		}
	}, []);

	const toggleRecording = () => {
		if (isRecording) {
			recognitionRef.current?.stop();
			setIsRecording(false);
		} else {
			setSpokenText("");
			recognitionRef.current?.start();
			setIsRecording(true);
			toast.info("Listening...");
		}
	};

	const insertSpokenText = () => {
		if (spokenText.trim() && editor) {
			editor.chain().focus("end").insertContent(`<p>${spokenText}</p>`).run();
			setSpokenText("");
			toast.success("Voice note added!");
		}
	};

	const handleTranslateAndInsert = async () => {
		if (!spokenText.trim()) return;

		setIsProcessing(true);
		toast.info("Processing with AI...");

		try {
			if (editor) {
				editor
					.chain()
					.focus("end")
					.insertContent(`<p><em>AI Processed:</em> ${spokenText}</p>`)
					.run();
				setSpokenText("");
				toast.success("AI-processed note added!");
			} else {
				toast.error("AI processing failed. Using raw text.");
				insertSpokenText();
			}
		} catch (error) {
			console.error("AI Error:", error);
			toast.error("Processing failed");
			insertSpokenText();
		} finally {
			setIsProcessing(false);
		}
	};

	if (!editor) return null;

	return (
		<div
			className={`flex-1 flex flex-col h-full ${isDarkMode ? "bg-zinc-950" : "bg-white"} overflow-hidden relative`}
		>
			{/* Editor Header */}
			<div
				className={`px-8 pt-12 pb-6 flex items-end justify-between z-10 max-w-4xl mx-auto w-full`}
			>
				<div className="flex-1 min-w-0">
					<input
						type="text"
						value={title}
						onChange={handleTitleChange}
						placeholder="Note Title"
						className={`text-4xl font-black bg-transparent border-none outline-none w-full placeholder:opacity-20 ${isDarkMode ? "text-zinc-100 placeholder:text-zinc-100" : "text-zinc-900 placeholder:text-zinc-900"}`}
					/>
				</div>
				<div className="flex items-center gap-3 ml-4 mb-2">
					{isSaving && (
						<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 animate-pulse">
							<Loader2 className="w-3 h-3 animate-spin" />
							SAVING
						</div>
					)}
					<button
						onClick={toggleRecording}
						className={`p-2 rounded-xl transition-all ${
							isRecording
								? "bg-red-500 text-white animate-pulse"
								: `text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900`
						}`}
						title="Voice Note"
					>
						{isRecording ? (
							<Square className="w-4 h-4 fill-current" />
						) : (
							<Mic className="w-4 h-4" />
						)}
					</button>
				</div>
			</div>

			{/* Toolbar - Floating & Minimal */}
			<div className="max-w-4xl mx-auto w-full px-8 mb-4">
				<div
					className={`py-1.5 px-2 border ${isDarkMode ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-white/50"} backdrop-blur-md rounded-2xl flex items-center gap-0.5 overflow-x-auto scrollbar-hide sticky top-0 z-10 `}
				>
					<ToolbarButton
						active={false}
						onClick={() => saveNoteImmediately()}
						isDarkMode={isDarkMode}
					>
						<Save
							className={`w-3.5 h-3.5 ${isSaving ? "animate-pulse text-indigo-500" : ""}`}
						/>
					</ToolbarButton>
					<div
						className={`w-px h-4 ${isDarkMode ? "bg-zinc-800" : "bg-zinc-200"} mx-1`}
					/>
					<ToolbarButton
						active={editor.isActive("heading", { level: 1 })}
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 1 }).run()
						}
						isDarkMode={isDarkMode}
					>
						<Heading1 className="w-3.5 h-3.5" />
					</ToolbarButton>
					<ToolbarButton
						active={editor.isActive("heading", { level: 2 })}
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 2 }).run()
						}
						isDarkMode={isDarkMode}
					>
						<Heading2 className="w-3.5 h-3.5" />
					</ToolbarButton>
					<div
						className={`w-px h-4 ${isDarkMode ? "bg-zinc-800" : "bg-zinc-200"} mx-1`}
					/>
					<ToolbarButton
						active={editor.isActive("bold")}
						onClick={() => editor.chain().focus().toggleBold().run()}
						isDarkMode={isDarkMode}
					>
						<Bold className="w-3.5 h-3.5" />
					</ToolbarButton>
					<ToolbarButton
						active={editor.isActive("italic")}
						onClick={() => editor.chain().focus().toggleItalic().run()}
						isDarkMode={isDarkMode}
					>
						<Italic className="w-3.5 h-3.5" />
					</ToolbarButton>
					<ToolbarButton
						active={editor.isActive("link")}
						onClick={() => {
							const previousUrl = editor.getAttributes("link").href;
							setLinkUrl(previousUrl || "");
							setShowLinkModal(true);
						}}
						isDarkMode={isDarkMode}
					>
						<LinkIcon className="w-3.5 h-3.5" />
					</ToolbarButton>
					<div
						className={`w-px h-4 ${isDarkMode ? "bg-zinc-800" : "bg-zinc-200"} mx-1`}
					/>
					<ToolbarButton
						active={editor.isActive("bulletList")}
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						isDarkMode={isDarkMode}
					>
						<List className="w-3.5 h-3.5" />
					</ToolbarButton>
					<ToolbarButton
						active={editor.isActive("orderedList")}
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						isDarkMode={isDarkMode}
					>
						<ListOrdered className="w-3.5 h-3.5" />
					</ToolbarButton>
					<ToolbarButton
						active={editor.isActive("taskList")}
						onClick={() => editor.chain().focus().toggleTaskList().run()}
						isDarkMode={isDarkMode}
					>
						<CheckSquare className="w-3.5 h-3.5" />
					</ToolbarButton>
					<div
						className={`w-px h-4 ${isDarkMode ? "bg-zinc-800" : "bg-zinc-200"} mx-1`}
					/>
					<ToolbarButton
						active={editor.isActive("codeBlock")}
						onClick={() => editor.chain().focus().toggleCodeBlock().run()}
						isDarkMode={isDarkMode}
					>
						<Code className="w-3.5 h-3.5" />
					</ToolbarButton>
					<ToolbarButton
						active={false}
						onClick={() => {
							setMediaType("image");
							setShowMediaModal(true);
						}}
						isDarkMode={isDarkMode}
					>
						<ImageIcon className="w-3.5 h-3.5" />
					</ToolbarButton>
					<ToolbarButton
						active={editor.isActive("table")}
						onClick={() => {
							setMediaType("table");
							setShowMediaModal(true);
						}}
						isDarkMode={isDarkMode}
					>
						<TableIcon className="w-3.5 h-3.5" />
					</ToolbarButton>
				</div>
			</div>

			{/* Editor Content */}
			<div className="flex-1 overflow-y-auto scrollbar-hide">
				<div
					className={`px-8 pb-32 prose ${isDarkMode ? "prose-invert prose-zinc" : "prose-zinc"} max-w-4xl mx-auto w-full prose-p:my-1 prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:underline decoration-indigo-400/30 underline-offset-4 hover:prose-a:text-indigo-700 dark:hover:prose-a:text-indigo-300`}
				>
					<style>{`
						.ProseMirror a {
							color: ${isDarkMode ? "#818cf8" : "#4f46e5"} !important;
							text-decoration: underline !important;
							text-decoration-color: ${isDarkMode ? "rgba(129, 140, 248, 0.4)" : "rgba(79, 70, 229, 0.4)"} !important;
							text-underline-offset: 4px !important;
							font-weight: 500 !important;
						}
						.ProseMirror a:hover {
							color: ${isDarkMode ? "#a5b4fc" : "#4338ca"} !important;
						}
						.ProseMirror p.is-editor-empty:first-child::before {
							content: "Start writing your thoughts...";
							color: ${isDarkMode ? "#71717a" : "#9ca3af"};
							font-style: normal;
						}
					`}</style>
					<EditorContent editor={editor} />
				</div>
			</div>

			{/* Voice Input Modal/Overlay */}
			{(isRecording || spokenText) && (
				<div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50">
					<div
						className={`${isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"} border shadow-2xl rounded-3xl p-5 flex flex-col gap-4`}
					>
						<div className="flex items-center gap-3">
							<div
								className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500 animate-ping" : "bg-zinc-300"}`}
							/>
							<span
								className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-zinc-500" : "text-zinc-500"}`}
							>
								{isRecording ? "Recording..." : "Voice Note Ready"}
							</span>
						</div>

						<div
							className={`max-h-32 overflow-y-auto text-sm ${isDarkMode ? "text-zinc-300 bg-zinc-800" : "text-zinc-600 bg-zinc-50"} p-4 rounded-2xl italic`}
						>
							{spokenText || (isRecording ? "Say something..." : "")}
						</div>

						<div className="flex items-center justify-end gap-2">
							<button
								onClick={() => {
									setSpokenText("");
									if (isRecording) toggleRecording();
								}}
								className={`px-4 py-2 rounded-xl text-sm font-medium ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-100"} transition-colors`}
							>
								Discard
							</button>
							{spokenText && !isRecording && (
								<div className="flex gap-2">
									<button
										onClick={insertSpokenText}
										disabled={isProcessing}
										className={`px-4 py-2 rounded-xl border ${isDarkMode ? "border-zinc-800 text-zinc-400 hover:bg-zinc-800" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"} text-sm font-medium transition-colors`}
									>
										Raw Text
									</button>
									<button
										onClick={handleTranslateAndInsert}
										disabled={isProcessing}
										className={`px-5 py-2 rounded-xl ${isDarkMode ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"} text-sm font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50`}
									>
										{isProcessing ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Send className="w-4 h-4" />
										)}
										Translate & Add
									</button>
								</div>
							)}
							{isRecording && (
								<button
									onClick={toggleRecording}
									className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
								>
									<Square className="w-4 h-4 fill-current" />
									Stop Recording
								</button>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Media Selection Modal */}
			{showMediaModal && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm">
					<div
						className={`w-full max-w-md ${isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"} border shadow-2xl rounded-3xl overflow-hidden`}
					>
						<div className="p-6">
							<h3 className="text-lg font-bold mb-4 capitalize">
								Insert {mediaType}
							</h3>

							{mediaType === "image" ? (
								<div className="space-y-4">
									<div className="space-y-2">
										<label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
											Image URL
										</label>
										<input
											type="text"
											value={mediaUrl}
											onChange={(e) => setMediaUrl(e.target.value)}
											placeholder="https://example.com/image.jpg"
											className={`w-full px-4 py-2 rounded-xl text-sm border ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-200"} focus:ring-2 focus:ring-zinc-500 outline-none`}
										/>
									</div>
									<div className="relative">
										<div className="absolute inset-0 flex items-center">
											<div
												className={`w-full border-t ${isDarkMode ? "border-zinc-800" : "border-zinc-100"}`}
											></div>
										</div>
										<div className="relative flex justify-center text-xs uppercase">
											<span
												className={`px-2 ${isDarkMode ? "bg-zinc-900 text-zinc-500" : "bg-white text-zinc-400"}`}
											>
												Or
											</span>
										</div>
									</div>
									<button
										onClick={() => fileInputRef.current?.click()}
										className={`w-full py-3 rounded-xl border-2 border-dashed ${isDarkMode ? "border-zinc-800 hover:border-zinc-700 text-zinc-400" : "border-zinc-200 hover:border-zinc-300 text-zinc-500"} transition-all flex flex-col items-center gap-2`}
									>
										<ImageIcon className="w-5 h-5" />
										<span className="text-xs font-medium">
											Upload from computer
										</span>
									</button>
									<input
										type="file"
										ref={fileInputRef}
										onChange={handleFileUpload}
										accept="image/*"
										className="hidden"
									/>
								</div>
							) : (
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
											Rows
										</label>
										<input
											type="number"
											min="1"
											max="10"
											value={tableRows}
											onChange={(e) => setTableRows(e.target.value)}
											className={`w-full px-4 py-2 rounded-xl text-sm border ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-200"} outline-none`}
										/>
									</div>
									<div className="space-y-2">
										<label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
											Columns
										</label>
										<input
											type="number"
											min="1"
											max="10"
											value={tableCols}
											onChange={(e) => setTableCols(e.target.value)}
											className={`w-full px-4 py-2 rounded-xl text-sm border ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-200"} outline-none`}
										/>
									</div>
								</div>
							)}

							<div className="flex items-center justify-end gap-2 mt-8">
								<button
									onClick={() => {
										setShowMediaModal(false);
										setMediaUrl("");
									}}
									className={`px-4 py-2 rounded-xl text-sm font-medium ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-100"} transition-colors`}
								>
									Cancel
								</button>
								<button
									onClick={handleMediaSubmit}
									className={`px-6 py-2 rounded-xl ${isDarkMode ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"} text-sm font-medium transition-colors`}
								>
									Insert {mediaType}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Link Modal */}
			{showLinkModal && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm">
					<div
						className={`w-full max-w-md ${isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"} border shadow-2xl rounded-3xl overflow-hidden`}
					>
						<div className="p-6">
							<h3 className="text-lg font-bold mb-4">Edit Link</h3>
							<div className="space-y-4">
								<div className="space-y-2">
									<label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
										URL
									</label>
									<input
										type="text"
										value={linkUrl}
										onChange={(e) => setLinkUrl(e.target.value)}
										placeholder="https://example.com"
										className={`w-full px-4 py-2 rounded-xl text-sm border ${isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-200"} focus:ring-2 focus:ring-zinc-500 outline-none`}
										autoFocus
										onKeyDown={(e) => {
											if (e.key === "Enter") handleLinkSubmit();
											if (e.key === "Escape") setShowLinkModal(false);
										}}
									/>
								</div>
							</div>

							<div className="flex items-center justify-end gap-2 mt-8">
								<button
									onClick={() => {
										setShowLinkModal(false);
										setLinkUrl("");
									}}
									className={`px-4 py-2 rounded-xl text-sm font-medium ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-100"} transition-colors`}
								>
									Cancel
								</button>
								<button
									onClick={handleLinkSubmit}
									className={`px-6 py-2 rounded-xl ${isDarkMode ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"} text-sm font-medium transition-colors`}
								>
									{editor.isActive("link") ? "Update" : "Set Link"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};;

const ToolbarButton = ({ active, onClick, children, isDarkMode }) => (
	<button
		onClick={onClick}
		className={`p-2 rounded-xl transition-all ${
			active
				? isDarkMode
					? "bg-zinc-800 text-zinc-100 shadow-sm"
					: "bg-zinc-100 text-zinc-900 shadow-sm"
				: isDarkMode
					? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
					: "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
		}`}
	>
		{children}
	</button>
);

export default TiptapEditor;
