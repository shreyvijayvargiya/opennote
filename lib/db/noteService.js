import { db as localDb } from "./localDb";

const normalizeId = (id) => {
	if (id == null || id === "") return null;
	const num = Number(id);
	return Number.isNaN(num) ? id : num;
};

const normalizeNote = (note) => {
	if (!note) return note;
	return {
		...note,
		parentId: normalizeId(note.parentId),
	};
};

export const noteService = {
	// Get all notes (local only)
	async getAllNotes(userId = "local-user") {
		const notes = await localDb.notes.where("userId").equals(userId).toArray();
		return notes.map(normalizeNote);
	},

	// Get a single note
	async getNote(id) {
		// Check local first
		const localNote = await localDb.notes.get(normalizeId(id) ?? id);
		if (localNote) return normalizeNote(localNote);
		return null;
	},

	// Save a note (always save locally)
	async saveNote(userId = "local-user", note) {
		const timestamp = Date.now();
		const parentId = normalizeId(note.parentId);
		const noteData = {
			...note,
			userId,
			updatedAt: timestamp,
			isSynced: true, // Always true now as there is no cloud
		};

		if (parentId != null) {
			noteData.parentId = parentId;
		} else {
			delete noteData.parentId;
		}

		let id = normalizeId(note.id);
		if (id) {
			// Ensure we don't try to update with the id in the data object if it's auto-incremented
			const { id: _, ...dataToUpdate } = noteData;
			await localDb.notes.update(id, dataToUpdate);
		} else {
			noteData.createdAt = timestamp;
			id = await localDb.notes.add(noteData);
		}

		return normalizeNote({ ...noteData, id });
	},

	// Delete a note and its nested pages
	async deleteNote(id) {
		const noteId = normalizeId(id) ?? id;
		const children = await localDb.notes.where("parentId").equals(noteId).toArray();
		for (const child of children) {
			await this.deleteNote(child.id);
		}
		await localDb.notes.delete(noteId);
	},

	// Sync is no longer needed but kept as stub to avoid breaking calls
	async syncAllWithCloud(userId) {
		console.log("Cloud sync is disabled. Storing locally only.");
		return;
	},
};
