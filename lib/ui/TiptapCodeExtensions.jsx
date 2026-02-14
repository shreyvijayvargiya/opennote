import React, { useState, useRef, useEffect } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Copy,
	X,
	ChevronDown,
	Check,
	Plus,
	MoreVertical,
	Files,
	TrashIcon,
} from "lucide-react";
import { toast } from "sonner";

// Languages list
const LANGUAGES = [
	{ value: "javascript", label: "JavaScript" },
	{ value: "typescript", label: "TypeScript" },
	{ value: "html", label: "HTML" },
	{ value: "css", label: "CSS" },
	{ value: "rust", label: "Rust" },
	{ value: "go", label: "Go" },
	{ value: "golang", label: "Golang" },
	{ value: "cpp", label: "C++" },
	{ value: "python", label: "Python" },
	{ value: "java", label: "Java" },
	{ value: "php", label: "PHP" },
	{ value: "ruby", label: "Ruby" },
	{ value: "swift", label: "Swift" },
	{ value: "kotlin", label: "Kotlin" },
	{ value: "json", label: "JSON" },
	{ value: "xml", label: "XML" },
	{ value: "yaml", label: "YAML" },
	{ value: "markdown", label: "Markdown" },
	{ value: "bash", label: "Bash" },
	{ value: "shell", label: "Shell" },
	{ value: "sql", label: "SQL" },
	{ value: "graphql", label: "GraphQL" },
	{ value: "dockerfile", label: "Dockerfile" },
	{ value: "text", label: "Text" },
];

// CodeBlock Component
const CodeBlockComponent = ({ node, updateAttributes, getPos, editor }) => {
	const [language, setLanguage] = useState(node.attrs.language || "text");
	const [code, setCode] = useState(node.attrs.code || "");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const dropdownRef = useRef(null);

	const deleteNode = () => {
		if (typeof getPos === "function") {
			const pos = getPos();
			if (pos !== null && pos !== undefined) {
				editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
			}
		}
	};

	// Sync with node attributes when node changes
	useEffect(() => {
		setLanguage(node.attrs.language || "text");
		setCode(node.attrs.code || "");
	}, [node.attrs.language, node.attrs.code]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleLanguageChange = (lang) => {
		setLanguage(lang);
		updateAttributes({ language: lang });
		setIsDropdownOpen(false);
	};

	const handleCodeChange = (newCode) => {
		setCode(newCode);
		updateAttributes({ code: newCode });
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			toast.success("Code copied to clipboard!");
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			toast.error("Failed to copy code");
		}
	};

	return (
		<NodeViewWrapper
			className={`my-4 `}
			data-node-type="codeBlock"
			onClick={(e) => {
				// Only select if clicking on the wrapper itself, not on interactive elements
				if (
					e.target === e.currentTarget ||
					(!e.target.closest("button") &&
						!e.target.closest("input") &&
						!e.target.closest("textarea"))
				) {
					e.preventDefault();
					e.stopPropagation();
					if (typeof getPos === "function") {
						const pos = getPos();
						if (pos !== null && pos !== undefined) {
							editor.commands.setNodeSelection(pos);
						}
					}
				}
			}}
		>
			<div className="rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden">
				{/* Code Editor */}
				<div className="relative bg-white">
					<textarea
						value={code}
						onChange={(e) => handleCodeChange(e.target.value)}
						placeholder="Enter your code here..."
						className="w-full px-4 py-3 text-sm font-mono bg-transparent resize-none focus:outline-none text-zinc-900"
						style={{ minHeight: "100px" }}
						onKeyDown={(e) => {
							if (e.key === "Tab") {
								e.preventDefault();
								const start = e.target.selectionStart;
								const end = e.target.selectionEnd;
								const newCode =
									code.substring(0, start) + "  " + code.substring(end);
								handleCodeChange(newCode);
								setTimeout(() => {
									e.target.selectionStart = e.target.selectionEnd = start + 2;
								}, 0);
							}
						}}
					/>
					{/* Language Selector, Copy, and Options - Bottom Right */}
					<div className="absolute top-2 right-2 flex items-center gap-1.5">
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={() => setIsDropdownOpen(!isDropdownOpen)}
								className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors border border-zinc-200"
							>
								<span>
									{LANGUAGES.find((l) => l.value === language)?.label || "Text"}
								</span>
								<ChevronDown
									className={`w-3 h-3 transition-transform ${
										isDropdownOpen ? "rotate-180" : ""
									}`}
								/>
							</button>
							<AnimatePresence>
								{isDropdownOpen && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										className="absolute top-full right-0 mb-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto min-w-[150px]"
									>
										{LANGUAGES.map((lang) => (
											<button
												key={lang.value}
												onClick={() => handleLanguageChange(lang.value)}
												className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 transition-colors ${
													language === lang.value
														? "bg-zinc-100 font-medium"
														: ""
												}`}
											>
												{lang.label}
											</button>
										))}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
						<button
							onClick={handleCopy}
							className="p-1.5 text-zinc-600 hover:bg-zinc-200 rounded-full transition-colors bg-zinc-100 border border-zinc-200"
							title="Copy code"
						>
							{copied ? (
								<Check className="w-3.5 h-3.5 text-green-600" />
							) : (
								<Copy className="w-3.5 h-3.5" />
							)}
						</button>
						<button
							onClick={deleteNode}
							className="p-1.5 text-zinc-600 hover:bg-zinc-200 rounded-full transition-colors bg-zinc-100 border border-zinc-200"
							title="More options"
						>
							<TrashIcon className="w-3.5 h-3.5 text-red-400" />
						</button>
					</div>
				</div>
			</div>
		</NodeViewWrapper>
	);
};

// CodeBlockItem Component (for CodeGroup)
const CodeBlockItem = ({
	code,
	language,
	name,
	onCodeChange,
	onLanguageChange,
	onNameChange,
	onDelete,
}) => {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const dropdownRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			toast.success("Code copied to clipboard!");
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			toast.error("Failed to copy code");
		}
	};

	return (
		<div className="relative bg-white rounded-xl">
			{/* Code Editor */}
			<div className="relative">
				<textarea
					value={code}
					onChange={(e) => onCodeChange(e.target.value)}
					placeholder="Enter your code here..."
					className="w-full px-4 py-3 text-sm font-mono bg-transparent resize-none focus:outline-none text-zinc-900"
					style={{ minHeight: "100px" }}
					onKeyDown={(e) => {
						if (e.key === "Tab") {
							e.preventDefault();
							const start = e.target.selectionStart;
							const end = e.target.selectionEnd;
							const newCode =
								code.substring(0, start) + "  " + code.substring(end);
							onCodeChange(newCode);
							setTimeout(() => {
								e.target.selectionStart = e.target.selectionEnd = start + 2;
							}, 0);
						}
					}}
				/>
				{/* Language Selector, Copy, and Options - Bottom Right */}
				<div className="absolute top-2 right-2 flex items-center gap-1.5">
					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors border border-zinc-200"
						>
							<span>
								{LANGUAGES.find((l) => l.value === language)?.label || "Text"}
							</span>
							<ChevronDown
								className={`w-3 h-3 transition-transform ${
									isDropdownOpen ? "rotate-180" : ""
								}`}
							/>
						</button>
						<AnimatePresence>
							{isDropdownOpen && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="absolute top-full right-0 mb-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto min-w-[150px]"
								>
									{LANGUAGES.map((lang) => (
										<button
											key={lang.value}
											onClick={() => {
												onLanguageChange(lang.value);
												setIsDropdownOpen(false);
											}}
											className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 transition-colors ${
												language === lang.value ? "bg-zinc-100 font-medium" : ""
											}`}
										>
											{lang.label}
										</button>
									))}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
					<button
						onClick={handleCopy}
						className="p-1.5 text-zinc-600 hover:bg-zinc-200 rounded-full transition-colors bg-zinc-100 border border-zinc-200"
						title="Copy code"
					>
						{copied ? (
							<Check className="w-3.5 h-3.5 text-green-600" />
						) : (
							<Copy className="w-3.5 h-3.5" />
						)}
					</button>
					{onDelete && (
						<button
							onClick={onDelete}
							className="p-1.5 text-zinc-600 hover:bg-zinc-200 rounded-full transition-colors bg-zinc-100 border border-zinc-200"
							title="More options"
						>
							<TrashIcon className="w-3.5 h-3.5 text-red-400" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

// CodeGroup Component
const CodeGroupComponent = ({
	node,
	updateAttributes,
	selected,
	getPos,
	editor,
}) => {
	const [tabs, setTabs] = useState(
		node.attrs.tabs || [
			{
				id: Date.now(),
				name: "Tab 1",
				code: "",
				language: "text",
				codeBlocks: [
					{ id: Date.now() + 1, name: "", code: "", language: "text" },
				],
			},
		],
	);
	const [activeTab, setActiveTab] = useState(0);
	const [editingTabId, setEditingTabId] = useState(null);
	const [editingTabName, setEditingTabName] = useState("");

	const deleteNode = () => {
		if (typeof getPos === "function") {
			const pos = getPos();
			if (pos !== null && pos !== undefined) {
				editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
			}
		}
	};

	// Sync with node attributes when node changes
	useEffect(() => {
		if (
			node.attrs.tabs &&
			JSON.stringify(node.attrs.tabs) !== JSON.stringify(tabs)
		) {
			setTabs(node.attrs.tabs);
		}
	}, [node.attrs.tabs]);

	useEffect(() => {
		updateAttributes({ tabs });
	}, [tabs, updateAttributes]);

	const addTab = () => {
		const newTab = {
			id: Date.now(),
			name: `Tab ${tabs.length + 1}`,
			code: "",
			language: "text",
			codeBlocks: [
				{ id: Date.now() + 1, name: "", code: "", language: "text" },
			],
		};
		setTabs([...tabs, newTab]);
		setActiveTab(tabs.length);
	};

	const removeTab = (tabId) => {
		if (tabs.length === 1) return;
		const newTabs = tabs.filter((tab) => tab.id !== tabId);
		setTabs(newTabs);
		if (activeTab >= newTabs.length) {
			setActiveTab(newTabs.length - 1);
		}
	};

	const updateTabName = (tabId, name) => {
		setTabs(tabs.map((tab) => (tab.id === tabId ? { ...tab, name } : tab)));
	};

	const addCodeBlock = (tabId) => {
		setTabs(
			tabs.map((tab) =>
				tab.id === tabId
					? {
							...tab,
							codeBlocks: [
								...tab.codeBlocks,
								{ id: Date.now(), name: "", code: "", language: "text" },
							],
						}
					: tab,
			),
		);
	};

	const removeCodeBlock = (tabId, blockId) => {
		setTabs(
			tabs.map((tab) =>
				tab.id === tabId
					? {
							...tab,
							codeBlocks: tab.codeBlocks.filter(
								(block) => block.id !== blockId,
							),
						}
					: tab,
			),
		);
	};

	const updateCodeBlock = (tabId, blockId, updates) => {
		setTabs(
			tabs.map((tab) =>
				tab.id === tabId
					? {
							...tab,
							codeBlocks: tab.codeBlocks.map((block) =>
								block.id === blockId ? { ...block, ...updates } : block,
							),
						}
					: tab,
			),
		);
	};

	const currentTab = tabs[activeTab];

	return (
		<NodeViewWrapper
			className={`my-4`}
			data-node-type="codeGroup"
			onClick={(e) => {
				// Only select if clicking on the wrapper itself, not on interactive elements
				if (
					e.target === e.currentTarget ||
					e.target.closest(".node-view-wrapper") === e.currentTarget
				) {
					e.preventDefault();
					e.stopPropagation();
					if (typeof getPos === "function") {
						const pos = getPos();
						if (pos !== null && pos !== undefined) {
							editor.commands.setNodeSelection(pos);
						}
					}
				}
			}}
		>
			<div className="rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden">
				{/* Tabs Header */}
				<div className="flex items-center justify-between px-3 pt-2 bg-transparent border-b border-zinc-200">
					<div className="flex items-center gap-0.5 overflow-x-auto flex-1">
						{tabs.map((tab, index) => (
							<div
								key={tab.id}
								className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors relative ${
									activeTab === index
										? "text-zinc-900"
										: "text-zinc-600 hover:text-zinc-900"
								}`}
							>
								{editingTabId === tab.id ? (
									<input
										type="text"
										value={editingTabName}
										onChange={(e) => setEditingTabName(e.target.value)}
										onBlur={() => {
											if (editingTabName.trim()) {
												updateTabName(tab.id, editingTabName.trim());
											}
											setEditingTabId(null);
											setEditingTabName("");
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												if (editingTabName.trim()) {
													updateTabName(tab.id, editingTabName.trim());
												}
												setEditingTabId(null);
												setEditingTabName("");
											} else if (e.key === "Escape") {
												setEditingTabId(null);
												setEditingTabName("");
											}
										}}
										className="flex-1 px-1.5 py-0.5 text-xs bg-white border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-zinc-900 min-w-[60px]"
										autoFocus
										onClick={(e) => e.stopPropagation()}
									/>
								) : (
									<button
										onClick={() => setActiveTab(index)}
										onDoubleClick={(e) => {
											e.stopPropagation();
											setEditingTabId(tab.id);
											setEditingTabName(tab.name);
										}}
										className="flex-1 text-left"
										title="Double-click to edit"
									>
										{tab.name}
									</button>
								)}
								<button
									onClick={(e) => {
										e.stopPropagation();
										removeTab(tab.id);
									}}
									className="p-0.5 hover:bg-zinc-200 rounded transition-colors ml-1"
									title="Remove tab"
								>
									<X className="w-3 h-3" />
								</button>
								{activeTab === index && (
									<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
								)}
							</div>
						))}
						<button
							onClick={addTab}
							className="p-1.5 text-zinc-600 hover:bg-zinc-200 rounded transition-colors ml-1"
							title="Add tab"
						>
							<Plus className="w-3.5 h-3.5" />
						</button>
					</div>
					<div className="flex items-center gap-1 ml-2">
						<button
							onClick={() => {
								// Duplicate current tab
								if (currentTab) {
									const newTab = {
										...currentTab,
										id: Date.now(),
										name: `${currentTab.name} (copy)`,
									};
									setTabs([...tabs, newTab]);
									setActiveTab(tabs.length);
								}
							}}
							className="p-1.5 text-zinc-600 hover:bg-zinc-200 rounded transition-colors"
							title="Duplicate tab"
						>
							<Files className="w-3.5 h-3.5" />
						</button>
						<button
							onClick={deleteNode}
							className="p-1.5 text-zinc-600 hover:bg-zinc-200 rounded transition-colors"
							title="Delete code group"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>

				{/* Tab Content */}
				{currentTab && (
					<div className="p-3 space-y-1 bg-white">
						{currentTab.codeBlocks.map((block) => (
							<CodeBlockItem
								key={block.id}
								code={block.code}
								language={block.language}
								name={block.name}
								onCodeChange={(code) =>
									updateCodeBlock(currentTab.id, block.id, { code })
								}
								onLanguageChange={(language) =>
									updateCodeBlock(currentTab.id, block.id, { language })
								}
								onNameChange={(name) =>
									updateCodeBlock(currentTab.id, block.id, { name })
								}
								onDelete={() => removeCodeBlock(currentTab.id, block.id)}
							/>
						))}
					</div>
				)}
			</div>
		</NodeViewWrapper>
	);
};

// CodeBlock Extension
export const CodeBlock = Node.create({
	name: "codeBlock",
	group: "block",
	atom: true,
	attrs: {
		language: { default: "text" },
		code: { default: "" },
	},
	parseHTML() {
		return [{ tag: 'div[data-type="code-block"]' }];
	},
	renderHTML({ HTMLAttributes }) {
		return [
			"div",
			mergeAttributes(HTMLAttributes, { "data-type": "code-block" }),
		];
	},
	addNodeView() {
		return ReactNodeViewRenderer(CodeBlockComponent);
	},
});

// CodeGroup Extension
export const CodeGroup = Node.create({
	name: "codeGroup",
	group: "block",
	atom: true,
	attrs: {
		tabs: {
			default: [
				{
					id: Date.now(),
					name: "Tab 1",
					codeBlocks: [
						{ id: Date.now() + 1, name: "", code: "", language: "text" },
					],
				},
			],
		},
	},
	parseHTML() {
		return [{ tag: 'div[data-type="code-group"]' }];
	},
	renderHTML({ HTMLAttributes }) {
		return [
			"div",
			mergeAttributes(HTMLAttributes, { "data-type": "code-group" }),
		];
	},
	addNodeView() {
		return ReactNodeViewRenderer(CodeGroupComponent);
	},
});

// Export components for use in extensions
export { CodeBlockComponent, CodeGroupComponent };
