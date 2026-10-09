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

// v4: AI chat history ({ id, title, createdAt, updatedAt, messages[] })
db.version(4).stores({
	notes:
		"++id, userId, parentId, title, content, createdAt, updatedAt, isSynced, lastSyncedAt",
	settings: "key, value",
	apiKeys: "++id, key, name, createdAt",
	chats: "++id, updatedAt",
});

export default db;
