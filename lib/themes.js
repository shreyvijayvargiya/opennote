import custom from "./themes.json";

/**
 * Color themes shown as chips. "default" is the built-in OpenNote look (:root in styles/globals.css).
 * The rest come from lib/themes.json, which `node scripts/add-theme.mjs` maintains from tweakcn CSS.
 * swatch = [light background, primary, accent, dark background]
 */
export const themes = [
	{ id: "default", name: "OpenNote", swatch: ["#fafafa", "#6366f1", "#f4f4f5", "#09090b"] },
	...custom.map(({ id, name, swatch }) => ({ id, name, swatch })),
];
