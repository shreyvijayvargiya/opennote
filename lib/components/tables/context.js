import { createContext, useContext } from "react";

/**
 * What cells need from the app:
 *  tables       Map(id -> table record)  – for "Table link" cells
 *  tableList    array of table records
 *  selfId       id of the table being edited
 *  openTable    open a table in a tab
 *  createLinked create a child table and return its record
 *  updateColumn patch a column of the current table (chip options, code language …)
 *  isDark       current mode (chip colors)
 */
export const TableCtx = createContext({
	tables: new Map(),
	tableList: [],
	selfId: null,
	openTable: () => {},
	createLinked: async () => null,
	updateColumn: () => {},
	isDark: false,
});
export const useTableCtx = () => useContext(TableCtx);
