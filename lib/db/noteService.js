import { db as localDb } from "./localDb";

export const noteService = {
	// Get all notes (local only)
	async getAllNotes(userId = "local-user") {
		return await localDb.notes.where("userId").equals(userId).toArray();
	},

	// Get a single note
	async getNote(id) {
		// Check local first
		const localNote = await localDb.notes.get(id);
		if (localNote) return localNote;
		return null;
	},

	// Save a note (always save locally)
	async saveNote(userId = "local-user", note) {
		const timestamp = Date.now();
		const noteData = {
			...note,
			userId,
			updatedAt: timestamp,
			isSynced: true, // Always true now as there is no cloud
		};

		let id = note.id;
		if (id) {
			// Ensure we don't try to update with the id in the data object if it's auto-incremented
			const { id: _, ...dataToUpdate } = noteData;
			await localDb.notes.update(id, dataToUpdate);
		} else {
			noteData.createdAt = timestamp;
			id = await localDb.notes.add(noteData);
		}

		return { ...noteData, id };
	},

	// Delete a note
	async deleteNote(id) {
		await localDb.notes.delete(id);
	},

	// Sync is no longer needed but kept as stub to avoid breaking calls
	async syncAllWithCloud(userId) {
		console.log("Cloud sync is disabled. Storing locally only.");
		return;
	},
};
