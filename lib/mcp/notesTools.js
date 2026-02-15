import { noteService } from "../db/noteService";
import { getEmbedding, cosineSimilarity } from "../utils/embeddings";

export const getNotesTools = (user) => {
	const uid = user?.uid || "local-user";

	return [
		{
			name: "list_notes",
			description: "List all notes in the app",
			schema: { type: "object", properties: {} },
			execute: async () => {
				const allNotes = await noteService.getAllNotes(uid);
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(allNotes.map((n) => ({ id: n.id, title: n.title }))),
						},
					],
				};
			},
		},
		{
			name: "get_note",
			description: "Get a single note by its ID",
			schema: {
				type: "object",
				properties: {
					id: {
						type: "string",
						description: "The ID of the note to retrieve",
					},
				},
				required: ["id"],
			},
			execute: async ({ id }) => {
				const note = await noteService.getNote(id);
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(note || { error: "Note not found" }),
						},
					],
				};
			},
		},
		{
			name: "save_note",
			description: "Create or update a note",
			schema: {
				type: "object",
				properties: {
					id: {
						type: "string",
						description: "Optional ID of the note to update",
					},
					title: { type: "string", description: "The title of the note" },
					content: { type: "string", description: "The HTML content of the note" },
				},
				required: ["title", "content"],
			},
			execute: async ({ id, title, content }) => {
				const savedNote = await noteService.saveNote(uid, {
					id,
					title,
					content,
				});
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(savedNote),
						},
					],
				};
			},
		},
		{
			name: "delete_note",
			description: "Delete a note by its ID",
			schema: {
				type: "object",
				properties: {
					id: {
						type: "string",
						description: "The ID of the note to delete",
					},
				},
				required: ["id"],
			},
			execute: async ({ id }) => {
				await noteService.deleteNote(id);
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({ success: true }),
						},
					],
				};
			},
		},
		{
			name: "semantic_search",
			description: "Search notes using semantic similarity",
			schema: {
				type: "object",
				properties: {
					query: { type: "string", description: "The search query" },
					limit: {
						type: "number",
						description: "Max number of results to return",
						default: 5,
					},
				},
				required: ["query"],
			},
			execute: async ({ query, limit = 5 }) => {
				const allNotes = await noteService.getAllNotes(uid);
				const queryEmbedding = await getEmbedding(query);

				if (!queryEmbedding) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({ error: "Failed to generate embedding" }),
							},
						],
					};
				}

				const scoredNotes = await Promise.all(
					allNotes.map(async (note) => {
						const content = `${note.title} ${note.content?.replace(/<[^>]*>/g, "")}`;
						const noteEmbedding = await getEmbedding(content);
						const similarity = cosineSimilarity(queryEmbedding, noteEmbedding);
						return { ...note, similarity };
					}),
				);

				const results = scoredNotes
					.sort((a, b) => b.similarity - a.similarity)
					.slice(0, limit)
					.map((n) => ({
						id: n.id,
						title: n.title,
						similarity: n.similarity,
					}));

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(results),
						},
					],
				};
			},
		},
	];
};
