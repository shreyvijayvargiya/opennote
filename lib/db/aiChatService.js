import { db } from "./localDb";

export const aiChatService = {
	async listByNote(noteId) {
		if (noteId == null) return [];
		const chats = await db.aiChats.where("noteId").equals(noteId).toArray();
		return chats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
	},

	async create(noteId, title = "New chat") {
		const now = Date.now();
		const chat = {
			noteId,
			title: title || "New chat",
			messages: [],
			model: null,
			mode: "ask",
			createdAt: now,
			updatedAt: now,
		};
		const id = await db.aiChats.add(chat);
		return { ...chat, id };
	},

	async save(chat) {
		if (!chat?.id) return;
		await db.aiChats.update(chat.id, {
			title: chat.title || "New chat",
			messages: chat.messages || [],
			model: chat.model || null,
			mode: chat.mode || "ask",
			updatedAt: Date.now(),
		});
	},

	async remove(id) {
		await db.aiChats.delete(id);
	},
};
