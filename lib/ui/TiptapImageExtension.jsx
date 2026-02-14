import React, { useState, useRef, useEffect } from "react";
import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Settings,
	ChevronDown,
	X,
	Square,
	Circle,
	Box,
	Palette,
	Layers,
	Move,
	Minus,
	Maximize2,
} from "lucide-react";

// Image Component with resize handles and styling options
const ImageComponent = ({
	node,
	updateAttributes,
	selected,
	getPos,
	editor,
}) => {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [resizeSide, setResizeSide] = useState(null);
	const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 });
	const imageRef = useRef(null);
	const dropdownRef = useRef(null);
	const leftHandleRef = useRef(null);
	const rightHandleRef = useRef(null);

	const src = node.attrs.src || "";
	const widthAttr = node.attrs.width || "100%";
	const border = node.attrs.border || "none";
	const borderColor = node.attrs.borderColor || "#e4e4e7";
	const shadow = node.attrs.shadow || "none";
	const shadowOpacity = node.attrs.shadowOpacity || 0.1;
	const objectFit = node.attrs.objectFit || "cover";

	// Parse width - handle both string percentages and pixel values
	const getWidthStyle = () => {
		if (typeof widthAttr === "string" && widthAttr.includes("%")) {
			return { width: widthAttr };
		}
		if (typeof widthAttr === "string" && widthAttr.includes("px")) {
			return { width: widthAttr };
		}
		if (typeof widthAttr === "number") {
			return { width: `${widthAttr}px` };
		}
		return { width: "100%" };
	};

	// Handle click outside for dropdown
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Handle resize
	const handleMouseDown = (e, side) => {
		e.preventDefault();
		e.stopPropagation();
		setIsResizing(true);
		setResizeSide(side);
		const rect = imageRef.current?.getBoundingClientRect();
		if (rect) {
			setResizeStart({
				x: e.clientX,
				width: rect.width,
			});
		}
	};

	useEffect(() => {
		if (!isResizing || !resizeSide) return;

		const handleMouseMove = (e) => {
			if (!imageRef.current || !editor) return;

			// Get the editor's content area width - try multiple methods
			let editorWidth = 1200; // fallback

			// Method 1: Get from editor view DOM
			if (editor.view && editor.view.dom) {
				const editorDom = editor.view.dom;
				// Find the prose container or use the editor DOM directly
				const proseContainer =
					editorDom.closest(".ProseMirror") || editorDom.parentElement;
				if (proseContainer) {
					editorWidth =
						proseContainer.clientWidth ||
						proseContainer.offsetWidth ||
						editorWidth;
				} else {
					editorWidth =
						editorDom.clientWidth || editorDom.offsetWidth || editorWidth;
				}
			}

			// Method 2: Fallback to parent element chain
			if (editorWidth === 1200 && imageRef.current.parentElement) {
				let parent = imageRef.current.parentElement;
				// Traverse up to find a container with a defined width
				while (parent && parent !== document.body) {
					const width = parent.clientWidth || parent.offsetWidth;
					if (width > 0 && width < 5000) {
						editorWidth = width;
						break;
					}
					parent = parent.parentElement;
				}
			}

			const deltaX = e.clientX - resizeStart.x;
			const newWidth =
				resizeStart.width + (resizeSide === "left" ? -deltaX : deltaX);
			const minWidth = 100;
			const maxWidth = editorWidth;
			const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
			updateAttributes({ width: `${clampedWidth}px` });
		};

		const handleMouseUp = () => {
			setIsResizing(false);
			setResizeSide(null);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isResizing, resizeSide, resizeStart, updateAttributes, editor]);

	const borderOptions = [
		{ value: "none", label: "None", icon: Minus },
		{ value: "1px", label: "Thin", icon: Minus },
		{ value: "2px", label: "Medium", icon: Square },
		{ value: "3px", label: "Thick", icon: Box },
		{ value: "4px", label: "Extra Thick", icon: Maximize2 },
	];

	const borderColors = [
		{ value: "#e4e4e7", label: "Light Gray", color: "#e4e4e7" },
		{ value: "#a1a1aa", label: "Gray", color: "#a1a1aa" },
		{ value: "#71717a", label: "Dark Gray", color: "#71717a" },
		{ value: "#000000", label: "Black", color: "#000000" },
		{ value: "#ffffff", label: "White", color: "#ffffff" },
		{ value: "#ef4444", label: "Red", color: "#ef4444" },
		{ value: "#3b82f6", label: "Blue", color: "#3b82f6" },
		{ value: "#22c55e", label: "Green", color: "#22c55e" },
	];

	const shadowOptions = [
		{ value: "none", label: "None", icon: Minus },
		{ value: "small", label: "Small", icon: Circle },
		{ value: "medium", label: "Medium", icon: Layers },
		{ value: "large", label: "Large", icon: Box },
		{ value: "xlarge", label: "XLarge", icon: Maximize2 },
	];

	const shadowOpacityOptions = [
		{ value: 0.05, label: "5%" },
		{ value: 0.1, label: "10%" },
		{ value: 0.15, label: "15%" },
		{ value: 0.2, label: "20%" },
		{ value: 0.25, label: "25%" },
		{ value: 0.3, label: "30%" },
	];

	// Helper function to generate shadow CSS
	const getShadowValue = (size, opacity) => {
		if (size === "none") return "none";
		const op = opacity || shadowOpacity;
		switch (size) {
			case "small":
				return `0 1px 2px 0 rgba(0, 0, 0, ${op})`;
			case "medium":
				return `0 1px 3px 0 rgba(0, 0, 0, ${op}), 0 1px 2px -1px rgba(0, 0, 0, ${op})`;
			case "large":
				return `0 4px 6px -1px rgba(0, 0, 0, ${op}), 0 2px 4px -2px rgba(0, 0, 0, ${op})`;
			case "xlarge":
				return `0 10px 15px -3px rgba(0, 0, 0, ${op}), 0 4px 6px -4px rgba(0, 0, 0, ${op})`;
			default:
				return "none";
		}
	};

	// Parse current shadow to get size
	const getShadowSize = () => {
		if (shadow === "none") return "none";
		if (shadow.includes("1px 2px")) return "small";
		if (shadow.includes("1px 3px")) return "medium";
		if (shadow.includes("4px 6px")) return "large";
		if (shadow.includes("10px 15px")) return "xlarge";
		return "none";
	};

	// Helper function to get border CSS
	const getBorderValue = (width, color) => {
		if (width === "none") return "none";
		return `${width} solid ${color || borderColor}`;
	};

	// Parse current border to get width
	const getBorderWidth = () => {
		if (border === "none") return "none";
		const match = border.match(/(\d+px)/);
		return match ? match[1] : "none";
	};

	const objectFitOptions = [
		{ value: "fill", label: "Fill", icon: Maximize2 },
		{ value: "cover", label: "Cover", icon: Box },
		{ value: "contain", label: "Contain", icon: Square },
	];

	if (!src) return null;

	return (
		<NodeViewWrapper
			className="my-4 block"
			data-node-type="image"
			style={{
				position: "relative",
				zIndex: selected ? 10 : "auto",
				overflow: "visible",
			}}
		>
			<div
				className="relative inline-block"
				style={{
					...getWidthStyle(),
					maxWidth: "100%",
					overflow: "visible",
					position: "relative",
				}}
			>
				{/* Image */}
				<img
					ref={imageRef}
					src={src}
					alt={node.attrs.alt || ""}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						if (typeof getPos === "function") {
							const pos = getPos();
							if (pos !== null && pos !== undefined) {
								editor.commands.setNodeSelection(pos);
							}
						}
					}}
					style={{
						width: "100%",
						maxWidth: "100%",
						height: "auto",
						display: "block",
						border: getBorderValue(getBorderWidth(), borderColor),
						boxShadow: getShadowValue(getShadowSize(), shadowOpacity),
						objectFit: objectFit,
						cursor: "pointer",
						position: "relative",
					}}
					draggable={false}
				/>

				{/* Resize Handles */}
				{selected && (
					<>
						{/* Left Handle */}
						<div
							ref={leftHandleRef}
							onMouseDown={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleMouseDown(e, "left");
							}}
							className="absolute cursor-ew-resize transition-colors"
							style={{
								left: "-10px",
								top: "20%",
								bottom: "20%",
								width: "8px",
								borderRadius: "4px",
								zIndex: 1000,
								pointerEvents: "auto",
								position: "absolute",
								backgroundColor: "#f4f4f5", // zinc-100
								border: "1px solid #000000", // black border
								borderRadius: "4px",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#e4e4e7"; // zinc-200
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#f4f4f5"; // zinc-100
							}}
							title="Resize"
						/>
						{/* Right Handle */}
						<div
							ref={rightHandleRef}
							onMouseDown={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleMouseDown(e, "right");
							}}
							className="absolute cursor-ew-resize transition-colors"
							style={{
								right: "-10px",
								top: "20%",
								bottom: "20%",
								width: "8px",
								borderRadius: "4px",
								zIndex: 1000,
								pointerEvents: "auto",
								position: "absolute",
								backgroundColor: "#f4f4f5", // zinc-100
								border: "1px solid #000000", // black border
								borderRadius: "4px",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#e4e4e7"; // zinc-200
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#f4f4f5"; // zinc-100
							}}
							title="Resize"
						/>
					</>
				)}

				{/* Styling Dropdown - Top Right Corner */}
				{selected && (
					<div
						className="absolute top-2 right-2"
						ref={dropdownRef}
						style={{ zIndex: 1001, pointerEvents: "auto" }}
					>
						<button
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setIsDropdownOpen(!isDropdownOpen);
							}}
							className="p-1.5 bg-white border border-zinc-200 rounded shadow-lg hover:bg-zinc-50 transition-colors"
							title="Image settings"
							style={{ zIndex: 1001 }}
						>
							<Settings className="w-3.5 h-3.5 text-zinc-700" />
						</button>
						<AnimatePresence>
							{isDropdownOpen && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="absolute top-full right-0 mt-1 bg-white border border-zinc-200 rounded shadow-lg min-w-[220px] p-2 max-h-[400px] overflow-y-auto"
									style={{ zIndex: 1002 }}
								>
									{/* Border Options */}
									<div className="mb-3">
										<label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 mb-1.5">
											<Square className="w-3.5 h-3.5" />
											Border Width
										</label>
										<div className="space-y-1">
											{borderOptions.map((option) => {
												const Icon = option.icon;
												const currentWidth = getBorderWidth();
												return (
													<button
														key={option.value}
														onClick={() => {
															updateAttributes({
																border: option.value,
															});
														}}
														className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors ${
															currentWidth === option.value
																? "bg-zinc-100 font-medium"
																: "hover:bg-zinc-50"
														}`}
													>
														<Icon className="w-3.5 h-3.5 text-zinc-600" />
														{option.label}
													</button>
												);
											})}
										</div>
									</div>

									{/* Border Color Options */}
									<div className="mb-3">
										<label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 mb-1.5">
											<Palette className="w-3.5 h-3.5" />
											Border Color
										</label>
										<div className="grid grid-cols-4 gap-1.5">
											{borderColors.map((color) => (
												<button
													key={color.value}
													onClick={() => {
														updateAttributes({
															borderColor: color.value,
														});
													}}
													className={`w-full h-8 rounded border-2 transition-all ${
														borderColor === color.value
															? "border-zinc-900 scale-110"
															: "border-zinc-200 hover:border-zinc-300"
													}`}
													style={{ backgroundColor: color.color }}
													title={color.label}
												/>
											))}
										</div>
									</div>

									{/* Shadow Options */}
									<div className="mb-3">
										<label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 mb-1.5">
											<Layers className="w-3.5 h-3.5" />
											Shadow Size
										</label>
										<div className="space-y-1">
											{shadowOptions.map((option) => {
												const Icon = option.icon;
												const currentSize = getShadowSize();
												return (
													<button
														key={option.value}
														onClick={() => {
															updateAttributes({
																shadow: getShadowValue(
																	option.value,
																	shadowOpacity
																),
															});
														}}
														className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors ${
															currentSize === option.value
																? "bg-zinc-100 font-medium"
																: "hover:bg-zinc-50"
														}`}
													>
														<Icon className="w-3.5 h-3.5 text-zinc-600" />
														{option.label}
													</button>
												);
											})}
										</div>
									</div>

									{/* Shadow Opacity Options */}
									<div className="mb-3">
										<label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 mb-1.5">
											<Circle className="w-3.5 h-3.5" />
											Shadow Opacity
										</label>
										<div className="space-y-1">
											{shadowOpacityOptions.map((option) => (
												<button
													key={option.value}
													onClick={() => {
														updateAttributes({
															shadowOpacity: option.value,
															shadow: getShadowValue(
																getShadowSize(),
																option.value
															),
														});
													}}
													className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
														Math.abs(shadowOpacity - option.value) < 0.01
															? "bg-zinc-100 font-medium"
															: "hover:bg-zinc-50"
													}`}
												>
													{option.label}
												</button>
											))}
										</div>
									</div>

									{/* Object Fit Options */}
									<div>
										<label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 mb-1.5">
											<Box className="w-3.5 h-3.5" />
											Object Fit
										</label>
										<div className="space-y-1">
											{objectFitOptions.map((option) => {
												const Icon = option.icon;
												return (
													<button
														key={option.value}
														onClick={() => {
															updateAttributes({
																objectFit: option.value,
															});
														}}
														className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors ${
															objectFit === option.value
																? "bg-zinc-100 font-medium"
																: "hover:bg-zinc-50"
														}`}
													>
														<Icon className="w-3.5 h-3.5 text-zinc-600" />
														{option.label}
													</button>
												);
											})}
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}
			</div>
		</NodeViewWrapper>
	);
};

// Custom Image Extension extending the official Image extension
export const CustomImage = Image.extend({
	group: "block",
	atom: true,
	addAttributes() {
		return {
			...this.parent?.(),
			width: {
				default: "100%",
				parseHTML: (element) => element.getAttribute("width") || "100%",
				renderHTML: (attributes) => {
					if (!attributes.width) {
						return {};
					}
					return {
						width: attributes.width,
					};
				},
			},
			border: {
				default: "none",
				parseHTML: (element) => {
					const borderStyle = element.getAttribute("data-border") || "none";
					return borderStyle;
				},
				renderHTML: (attributes) => {
					if (!attributes.border || attributes.border === "none") {
						return {};
					}
					return {
						"data-border": attributes.border,
					};
				},
			},
			borderColor: {
				default: "#e4e4e7",
				parseHTML: (element) =>
					element.getAttribute("data-border-color") || "#e4e4e7",
				renderHTML: (attributes) => {
					return {
						"data-border-color": attributes.borderColor,
					};
				},
			},
			shadow: {
				default: "none",
				parseHTML: (element) => element.getAttribute("data-shadow") || "none",
				renderHTML: (attributes) => {
					if (!attributes.shadow || attributes.shadow === "none") {
						return {};
					}
					return {
						"data-shadow": attributes.shadow,
					};
				},
			},
			shadowOpacity: {
				default: 0.1,
				parseHTML: (element) => {
					const opacity = element.getAttribute("data-shadow-opacity");
					return opacity ? parseFloat(opacity) : 0.1;
				},
				renderHTML: (attributes) => {
					return {
						"data-shadow-opacity": attributes.shadowOpacity,
					};
				},
			},
			objectFit: {
				default: "cover",
				parseHTML: (element) =>
					element.getAttribute("data-object-fit") || "cover",
				renderHTML: (attributes) => {
					if (!attributes.objectFit || attributes.objectFit === "cover") {
						return {};
					}
					return {
						"data-object-fit": attributes.objectFit,
					};
				},
			},
		};
	},
	addNodeView() {
		return ReactNodeViewRenderer(ImageComponent);
	},
	renderHTML({ HTMLAttributes, node }) {
		const { border, shadow, objectFit, width, ...attrs } = HTMLAttributes;
		return [
			"img",
			mergeAttributes(attrs, {
				width: node.attrs.width || width,
				"data-border": node.attrs.border,
				"data-shadow": node.attrs.shadow,
				"data-object-fit": node.attrs.objectFit || "cover",
				style: `border: ${node.attrs.border}; box-shadow: ${
					node.attrs.shadow
				}; object-fit: ${node.attrs.objectFit || "cover"};`,
			}),
		];
	},
});
