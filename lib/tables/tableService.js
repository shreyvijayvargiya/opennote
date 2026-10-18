import { noteService } from "../db/noteService";
import { db } from "../db/localDb";
import { LIMITS, serializeTable } from "./schema";
import { buildTableFromTemplate } from "./gallery";

const USER_ID = "local-user";

/** Create a table record (respecting the per-browser table cap). Returns the saved record. */
export const createTable = async ({ title, table, parentId, isFolder = false }) => {
	const count = await db.notes.count();
	if (count >= LIMITS.TABLES) throw new Error(`Table limit reached (${LIMITS.TABLES} per browser). Delete a table first.`);
	return noteService.saveNote(USER_ID, {
		title: title || "Untitled table",
		content: serializeTable(table),
		parentId,
		isFolder,
	});
};

export const createFromTemplate = (tpl, parentId) => createTable({ title: tpl.name, table: buildTableFromTemplate(tpl), parentId });
