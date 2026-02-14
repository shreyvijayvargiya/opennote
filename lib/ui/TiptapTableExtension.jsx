import React, { useState, useRef, useEffect } from "react";
import { Node } from "@tiptap/core";
import { mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import {
	Settings,
	Plus,
	Minus,
	Trash2,
	Columns,
	Rows,
} from "lucide-react";

// Table Component with editing capabilities
const TableComponent = ({
	node,
	updateAttributes,
	selected,
	editor,
	getPos,
}) => {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const [hasError, setHasError] = useState(false);
	const dropdownRef = useRef(null);
	const updateTimeoutRef = useRef(null);

	const rows = node.attrs.rows || [];
	const hasHeader = node.attrs.hasHeader || false;

	const createCell = (content = "") => ({
		id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
		content,
	});

	const ensureCellIds = (rowsToFix) =>
		(rowsToFix || []).map((row) =>
			(row || []).map((cell) => {
				if (cell && typeof cell === "object" && cell.id) return cell;
				return { ...(cell || {}), id: createCell().id, content: cell?.content ?? cell ?? "" };
			})
		);

	// Error boundary for component
	useEffect(() => {
		const errorHandler = (error) => {
			if (error.message && error.message.includes("insertBefore")) {
				console.warn("Table component insertBefore error caught:", error);
				setHasError(true);
				// Retry mounting after a delay
				setTimeout(() => {
					setHasError(false);
					setIsMounted(true);
				}, 100);
			}
		};

		window.addEventListener("error", errorHandler);
		return () => window.removeEventListener("error", errorHandler);
	}, []);

	// Delay mounting to ensure DOM is ready
	useEffect(() => {
		// Use multiple RAFs to ensure DOM is completely stable
		const timeoutId = setTimeout(() => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setIsMounted(true);
				});
			});
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			if (updateTimeoutRef.current) {
				clearTimeout(updateTimeoutRef.current);
			}
		};
	}, []);

	// Handle click outside for dropdown
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		};
		if (selected) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [selected]);

	// Initialize table if empty (only after mount)
	useEffect(() => {
		if (!isMounted) return;

		if (!rows || rows.length === 0) {
			const initialRows = [];
			// Create header row if needed
			if (hasHeader) {
				initialRows.push([createCell(""), createCell(""), createCell("")]);
			}
			// Create data rows
			for (let i = 0; i < 2; i++) {
				initialRows.push([createCell(""), createCell(""), createCell("")]);
			}
			// Delay attribute update to avoid DOM manipulation during render
			safeUpdateAttributes({ rows: initialRows });
		}
	}, [isMounted, rows, hasHeader, updateAttributes]);

	// Ensure all existing cells have stable ids (for stable React keys)
	useEffect(() => {
		if (!isMounted) return;
		if (!rows || rows.length === 0) return;

		let needsFix = false;
		for (const row of rows) {
			for (const cell of row || []) {
				if (!cell || typeof cell !== "object" || !cell.id) {
					needsFix = true;
					break;
				}
			}
			if (needsFix) break;
		}

		if (needsFix) {
			safeUpdateAttributes({ rows: ensureCellIds(rows) });
		}
	}, [isMounted, rows]);

	// Safe update attributes function that batches updates
	const safeUpdateAttributes = (attrs) => {
		// Apply via setNodeMarkup at the table node position (most reliable).
		try {
			if (typeof getPos === "function" && editor?.view) {
				const pos = getPos();
				if (pos !== null && pos !== undefined) {
					const tr = editor.view.state.tr.setNodeMarkup(pos, undefined, {
						...(node?.attrs || {}),
						...attrs,
					});
					editor.view.dispatch(tr);
					return;
				}
			}
		} catch (error) {
			// fall back
		}

		// Fallback
		try {
			updateAttributes(attrs);
		} catch (error) {
			console.error("Error updating table attributes:", error);
		}
	};

	// Update cell content (debounced to avoid rapid re-renders)
	const updateCell = (rowIndex, cellIndex, content) => {
		const newRows = ensureCellIds([...rows]);
		if (!newRows[rowIndex]) {
			newRows[rowIndex] = [];
		}
		if (!newRows[rowIndex][cellIndex]) {
			newRows[rowIndex][cellIndex] = createCell("");
		}
		newRows[rowIndex][cellIndex] = {
			...newRows[rowIndex][cellIndex],
			content,
		};
		safeUpdateAttributes({ rows: newRows });
	};

	// Add column
	const addColumn = (index = null) => {
		const newRows = ensureCellIds(rows).map((row) => {
			const newRow = [...row];
			if (index === null) {
				newRow.push(createCell(""));
			} else {
				newRow.splice(index, 0, createCell(""));
			}
			return newRow;
		});
		safeUpdateAttributes({ rows: newRows });
	};

	// Delete column
	const deleteColumn = (index) => {
		if (rows[0] && rows[0].length <= 1) return; // Don't delete last column
		const newRows = ensureCellIds(rows).map((row) => {
			const newRow = [...row];
			newRow.splice(index, 1);
			return newRow;
		});
		safeUpdateAttributes({ rows: newRows });
	};

	// Add row
	const addRow = (index = null) => {
		const newRows = ensureCellIds([...rows]);
		const colCount = rows[0]?.length || 3;
		const newRow = Array(colCount)
			.fill(null)
			.map(() => createCell(""));
		if (index === null) {
			newRows.push(newRow);
		} else {
			newRows.splice(index, 0, newRow);
		}
		safeUpdateAttributes({ rows: newRows });
	};


	// Delete row
	const deleteRow = (index) => {
		if (rows.length <= 1) return; // Don't delete last row
		const newRows = ensureCellIds([...rows]);
		newRows.splice(index, 1);
		safeUpdateAttributes({ rows: newRows });
	};

	// Toggle header
	const toggleHeader = () => {
		safeUpdateAttributes({ hasHeader: !hasHeader });
	};

	// Delete table
	const deleteTable = () => {
		if (typeof getPos === "function") {
			const pos = getPos();
			if (pos !== null && pos !== undefined) {
				editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
			}
		}
	};

	const currentRows =
		rows.length > 0
			? ensureCellIds(rows)
			: [
					[createCell(""), createCell(""), createCell("")],
					[createCell(""), createCell(""), createCell("")],
			  ];
	const colCount = currentRows[0]?.length || 3;

	// Don't render until mounted to avoid DOM manipulation errors
	if (!isMounted || hasError) {
		return (
			<NodeViewWrapper className="my-4" data-node-type="table">
				<div className="p-4 text-zinc-400 text-sm border border-zinc-200 rounded">
					{hasError ? "Table loading..." : "Loading table..."}
				</div>
			</NodeViewWrapper>
		);
	}
	

	return (
		<NodeViewWrapper
			className="my-4"
			data-node-type="table"
			onClick={(e) => {
				if (
					e.target === e.currentTarget ||
					e.target.closest(".node-view-wrapper") === e.currentTarget
				) {
					if (typeof getPos === "function") {
						const pos = getPos();
						if (pos !== null && pos !== undefined) {
							editor.commands.setNodeSelection(pos);
						}
					}
				}
			}}
		>
			<div className="relative">
				{/* Table Dropdown - Top Right Corner */}
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
							title="Table options"
							style={{ zIndex: 1001 }}
						>
							<Settings className="w-3.5 h-3.5 text-zinc-700" />
						</button>
						{isDropdownOpen && (
							<div
								className="absolute top-full right-0 mt-1 bg-white border border-zinc-200 rounded shadow-lg min-w-[200px] p-2 max-h-[400px] overflow-y-auto"
								style={{ zIndex: 1002 }}
								onClick={(e) => e.stopPropagation()}
							>
								{/* Column Operations */}
								<div className="mb-2">
									<label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 mb-1.5">
										<Columns className="w-3.5 h-3.5" />
										Columns
									</label>
									<div className="space-y-1">
										<button
											onClick={() => {
												addColumn(0);
												setIsDropdownOpen(false);
											}}
											className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-zinc-50"
										>
											<Plus className="w-3.5 h-3.5 text-zinc-600" />
											Add Column Before
										</button>
										<button
											onClick={() => {
												addColumn();
												setIsDropdownOpen(false);
											}}
											className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-zinc-50"
										>
											<Plus className="w-3.5 h-3.5 text-zinc-600" />
											Add Column After
										</button>
										<button
											onClick={() => {
												if (colCount > 1) {
													deleteColumn(colCount - 1);
												}
												setIsDropdownOpen(false);
											}}
											disabled={colCount <= 1}
											className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<Minus className="w-3.5 h-3.5 text-zinc-600" />
											Delete Column
										</button>
									</div>
								</div>

								{/* Row Operations */}
								<div className="mb-2">
									<label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 mb-1.5">
										<Rows className="w-3.5 h-3.5" />
										Rows
									</label>
									<div className="space-y-1">
										<button
											onClick={() => {
												addRow(hasHeader ? 1 : 0);
												setIsDropdownOpen(false);
											}}
											className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-zinc-50"
										>
											<Plus className="w-3.5 h-3.5 text-zinc-600" />
											Add Row Before
										</button>
										<button
											onClick={() => {
												addRow();
												setIsDropdownOpen(false);
											}}
											className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-zinc-50"
										>
											<Plus className="w-3.5 h-3.5 text-zinc-600" />
											Add Row After
										</button>
										<button
											onClick={() => {
												if (currentRows.length > 1) {
													deleteRow(currentRows.length - 1);
												}
												setIsDropdownOpen(false);
											}}
											disabled={currentRows.length <= 1}
											className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<Minus className="w-3.5 h-3.5 text-zinc-600" />
											Delete Row
										</button>
									</div>
								</div>

								<div className="border-t border-zinc-200 my-2" />

								{/* Header Toggle */}
								<button
									onClick={() => {
										toggleHeader();
										setIsDropdownOpen(false);
									}}
									className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-zinc-50"
								>
									{hasHeader ? "Remove Header" : "Add Header"}
								</button>

								<div className="border-t border-zinc-200 my-2" />

								{/* Delete Table */}
								<button
									onClick={() => {
										deleteTable();
										setIsDropdownOpen(false);
									}}
									className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-red-50 text-red-600"
								>
									<Trash2 className="w-3.5 h-3.5" />
									Delete Table
								</button>
							</div>
						)}
					</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table
						className="w-full border-collapse"
						style={{
							border: "1px solid #e4e4e7",
						}}
					>
						{hasHeader && currentRows.length > 0 && (
							<thead>
								<tr>
									{currentRows[0].map((cell, cellIndex) => (
										<th
											key={cell.id || cellIndex}
											className="border border-zinc-200 px-3 py-2 bg-zinc-100 font-semibold text-left"
											style={{ minWidth: "100px" }}
										>
											<input
												type="text"
												id={`table-0-${cellIndex}`}
												name={`table-0-${cellIndex}`}
												value={cell.content || ""}
												onMouseDown={(e) => e.stopPropagation()}
												onClick={(e) => e.stopPropagation()}
												onChange={(e) => updateCell(0, cellIndex, e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														e.currentTarget.blur();
													}
												}}
												className="w-full bg-transparent border-none outline-none"
											/>
										</th>
									))}
								</tr>
							</thead>
						)}
						<tbody>
							{currentRows.slice(hasHeader ? 1 : 0).map((row, rowIndex) => (
								<tr key={rowIndex}>
									{row.map((cell, cellIndex) => {
										const actualRowIndex = hasHeader ? rowIndex + 1 : rowIndex;
										return (
											<td
												key={cell.id || cellIndex}
												className="border border-zinc-200 px-3 py-2"
												style={{ minWidth: "100px" }}
											>
												<input
													type="text"
													id={`table-${actualRowIndex}-${cellIndex}`}
													name={`table-${actualRowIndex}-${cellIndex}`}
													value={cell.content || ""}
													onMouseDown={(e) => e.stopPropagation()}
													onClick={(e) => e.stopPropagation()}
													onChange={(e) =>
														updateCell(actualRowIndex, cellIndex, e.target.value)
													}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.preventDefault();
															e.currentTarget.blur();
														}
													}}
													className="w-full bg-transparent border-none outline-none"
												/>
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</NodeViewWrapper>
	);
};

// Custom Table Extension - completely custom, no Tiptap table extension
export const CustomTable = Node.create({
	name: "customTable",
	group: "block",
	atom: true,
	attrs: {
		rows: {
			default: [
				[{ content: "" }, { content: "" }, { content: "" }],
				[{ content: "" }, { content: "" }, { content: "" }],
			],
		},
		hasHeader: {
			default: true,
		},
	},
	parseHTML() {
		return [{ tag: 'div[data-type="custom-table"]' }];
	},
	renderHTML({ HTMLAttributes }) {
		return [
			"div",
			mergeAttributes(HTMLAttributes, { "data-type": "custom-table" }),
		];
	},
	addNodeView() {
		// Use ReactNodeViewRenderer with proper error handling
		// Wrap in try-catch to handle any DOM manipulation errors
		try {
			return ReactNodeViewRenderer(TableComponent, {
				// React-controlled node view: prevent ProseMirror from reconciling DOM inside it.
				stopEvent: () => true,
				ignoreMutation: () => true,
			});
		} catch (error) {
			console.error("Error creating table node view:", error);
			// Fallback: return a simple node view
			return (props) => {
				const dom = document.createElement("div");
				dom.className = "my-4";
				dom.setAttribute("data-node-type", "table");
				dom.textContent = "Table (error loading)";
				return { dom };
			};
		}
	},
});

// Table Menu Component - Floating menu for table operations (when cursor is in table)
// NOTE: Removed the old floating `TableMenu` (it was redundant with the in-table gear menu).
