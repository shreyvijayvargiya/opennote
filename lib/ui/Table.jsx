import React from "react";

/**
 * Table Component - Shadcn-style white table
 * Reusable table component for admin panels
 */
export const Table = ({ className = "", children, ...props }) => {
	return (
		<div className="w-full border border-zinc-200 rounded-xl overflow-hidden bg-white">
			<table className={`w-full ${className}`} {...props}>
				{children}
			</table>
		</div>
	);
};

/**
 * Table Header Component
 */
export const TableHeader = ({ className = "", children, ...props }) => {
	return (
		<thead
			className={`bg-white border-b border-zinc-200 ${className}`}
			{...props}
		>
			{children}
		</thead>
	);
};

/**
 * Table Body Component
 */
export const TableBody = ({ className = "", children, ...props }) => {
	return (
		<tbody
			className={`bg-white divide-y divide-zinc-200 ${className}`}
			{...props}
		>
			{children}
		</tbody>
	);
};

/**
 * Table Row Component
 */
export const TableRow = ({
	className = "",
	children,
	onClick,
	hover = true,
	...props
}) => {
	return (
		<tr
			className={`border-b border-zinc-200 last:border-b-0 ${
				hover ? "hover:bg-zinc-50/50 transition-colors" : ""
			} ${onClick ? "cursor-pointer" : ""} ${className}`}
			onClick={onClick}
			{...props}
		>
			{children}
		</tr>
	);
};

/**
 * Table Head Cell Component
 */
export const TableHead = ({
	className = "",
	children,
	onClick,
	sortable = false,
	...props
}) => {
	return (
		<th
			className={`px-4 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider ${
				sortable || onClick
					? "cursor-pointer hover:bg-zinc-50 transition-colors"
					: ""
			} ${className}`}
			onClick={onClick}
			{...props}
		>
			{children}
		</th>
	);
};

/**
 * Table Cell Component
 */
export const TableCell = ({ className = "", children, ...props }) => {
	return (
		<td className={`px-4 py-3 text-sm text-zinc-900 ${className}`} {...props}>
			{children}
		</td>
	);
};

/**
 * Table Container - Wrapper for the entire table with optional loading/empty states
 */
export const TableContainer = ({
	children,
	isLoading = false,
	emptyMessage = "No data available",
	emptyIcon: EmptyIcon,
	columns = 0,
	rows = 0,
	...props
}) => {
	if (isLoading) {
		return (
			<div className="w-full border border-zinc-200 rounded-xl overflow-hidden bg-white">
				<div className="p-8 text-center">
					<div className="animate-pulse space-y-3">
						{Array.from({ length: rows || 5 }).map((_, i) => (
							<div key={i} className="flex gap-4">
								{Array.from({ length: columns || 5 }).map((_, j) => (
									<div key={j} className="h-4 bg-zinc-200 rounded flex-1"></div>
								))}
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full" {...props}>
			{children}
		</div>
	);
};

/**
 * Table Empty State Component
 */
export const TableEmpty = ({
	message = "No data available",
	icon: Icon,
	colSpan = 1,
}) => {
	return (
		<tr>
			<td colSpan={colSpan} className="px-4 py-12 text-center">
				{Icon && (
					<div className="flex justify-center mb-3">
						<Icon className="w-12 h-12 text-zinc-400" />
					</div>
				)}
				<p className="text-sm text-zinc-500">{message}</p>
			</td>
		</tr>
	);
};
