export const LOCAL_TOOL_NAMES = [
	"list_notes",
	"get_note",
	"update_note",
	"insert_content",
	"replace_selection",
	"create_note",
	"delete_note",
];

export const LOCAL_TOOLS = [
	{
		type: "function",
		function: {
			name: "list_notes",
			description:
				"List the writer's local notes. Returns id, title, and parent id only, never full document bodies.",
			parameters: {
				type: "object",
				properties: {
					query: {
						type: "string",
						description: "Optional title filter",
					},
				},
			},
		},
	},
	{
		type: "function",
		function: {
			name: "get_note",
			description: "Read one local note by id. Content is plain text and may be truncated.",
			parameters: {
				type: "object",
				properties: {
					id: { type: "string", description: "Note id" },
				},
				required: ["id"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "update_note",
			description:
				"Update a note title and/or replace its content. Replacing content asks the writer to confirm. Use HTML or markdown for content.",
			parameters: {
				type: "object",
				properties: {
					id: { type: "string", description: "Note id. Defaults to the open note." },
					title: { type: "string" },
					content: {
						type: "string",
						description: "Replacement content for the whole note, markdown or HTML",
					},
				},
			},
		},
	},
	{
		type: "function",
		function: {
			name: "insert_content",
			description:
				"Insert markdown or HTML into a note at the cursor, the start, or the end. Defaults to the open note at the cursor.",
			parameters: {
				type: "object",
				properties: {
					id: { type: "string" },
					content: { type: "string" },
					where: { type: "string", enum: ["cursor", "start", "end"] },
				},
				required: ["content"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "replace_selection",
			description: "Replace the currently selected text in the open note.",
			parameters: {
				type: "object",
				properties: {
					content: { type: "string" },
				},
				required: ["content"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "create_note",
			description: "Create a new local note.",
			parameters: {
				type: "object",
				properties: {
					title: { type: "string" },
					content: { type: "string" },
					parentId: { type: "string", description: "Optional parent note id" },
				},
				required: ["title"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "delete_note",
			description:
				"Delete a local note and its nested pages. The writer must confirm. This cannot be silently undone.",
			parameters: {
				type: "object",
				properties: {
					id: { type: "string" },
				},
				required: ["id"],
			},
		},
	},
];
