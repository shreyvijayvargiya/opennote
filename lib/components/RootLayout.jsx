import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useApp } from "../context/AppContext";

/**
 * Root layout: app-wide keyboard shortcuts live here (not inside the chat).
 *   ⌘/Ctrl + L  open the AI chat and focus its input
 *   ⌘/Ctrl + B  toggle the left sidebar
 *   ⌘/Ctrl + K  search tables, gallery and actions
 */
const hotkeyOptions = {
	enableOnFormTags: true,
	enableOnContentEditable: true,
	preventDefault: true,
};

const RootLayout = ({ children }) => {
	const { openChat, toggleSidebar, setCommandOpen } = useApp();

	useHotkeys("mod+l", () => openChat(), hotkeyOptions);
	useHotkeys("mod+b", () => toggleSidebar(), hotkeyOptions);
	useHotkeys("mod+k", () => setCommandOpen((v) => !v), hotkeyOptions);

	return <>{children}</>;
};

export default RootLayout;
