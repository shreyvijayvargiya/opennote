import Dexie from "dexie";

export const db = new Dexie("OpenNoteDB");

db.version(2).stores({
	notes:
		"++id, userId, title, content, createdAt, updatedAt, isSynced, lastSyncedAt",
	settings: "key, value",
	apiKeys: "++id, key, name, createdAt",
});

db.version(3).stores({
	notes:
		"++id, userId, parentId, title, content, createdAt, updatedAt, isSynced, lastSyncedAt",
	settings: "key, value",
	apiKeys: "++id, key, name, createdAt",
});

// v4 (from the earlier AI Writer): kept so browsers that already upgraded stay valid
db.version(4).stores({
	notes:
		"++id, userId, parentId, title, content, createdAt, updatedAt, isSynced, lastSyncedAt",
	settings: "key, value",
	apiKeys: "++id, key, name, createdAt",
	aiChats: "++id, noteId, updatedAt, createdAt",
});

// v5: assistant chat history ({ id, title, createdAt, updatedAt, messages[] }); old aiChats dropped
db.version(5).stores({
	notes:
		"++id, userId, parentId, title, content, createdAt, updatedAt, isSynced, lastSyncedAt",
	settings: "key, value",
	apiKeys: "++id, key, name, createdAt",
	chats: "++id, updatedAt",
	aiChats: null,
});

export default db;
