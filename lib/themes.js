import themeList from "./themes.json";

/**
 * Color themes shown on the Themes page. lib/themes.json is maintained by
 * `node scripts/add-theme.mjs` (tweakcn CSS in, styles/themes.css out).
 * swatch = [light background, primary, accent, dark background]
 */
export const themes = themeList.map(({ id, name, swatch }) => ({ id, name, swatch }));
