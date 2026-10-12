#!/usr/bin/env node
/**
 * Add (or replace) a tweakcn / shadcn theme.
 *
 *   node scripts/add-theme.mjs --id claude --name "Claude" theme.css
 *   pbpaste | node scripts/add-theme.mjs --id my-theme --name "My Theme"
 *   node scripts/add-theme.mjs --url https://tweakcn.com/r/themes/<theme-id>.json
 *   node scripts/add-theme.mjs --rebuild            # regenerate styles/themes.css from lib/themes.json
 *
 * Input is what tweakcn's "Code" tab gives you: `:root { --background: ... } .dark { ... }`
 * (hex, hsl or oklch colors all work), or the shadcn registry JSON of the theme.
 * lib/themes.json is the source of truth; styles/themes.css is generated from it.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSON_FILE = path.join(root, "lib/themes.json");
const CSS_FILE = path.join(root, "styles/themes.css");

const TOKENS = [
	"background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
	"primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
	"accent", "accent-foreground", "destructive", "destructive-foreground", "border", "input", "ring",
];

/* ---------- parse ---------- */
const normalize = (v) => {
	v = String(v).trim().replace(/;$/, "");
	// legacy shadcn format: "240 10% 3.9%" -> hsl(240 10% 3.9%)
	return /^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(v) ? `hsl(${v})` : v;
};
const pick = (obj) => {
	const out = {};
	for (const k of [...TOKENS, "radius"]) if (obj[k] != null) out[k] = normalize(obj[k]);
	return out;
};
const block = (css, selector) => {
	const m = css.match(new RegExp(`${selector.replace(".", "\\.")}\\s*{([^}]+)}`));
	if (!m) return {};
	const out = {};
	for (const d of m[1].match(/--[\w-]+\s*:\s*[^;]+/g) || []) {
		const [k, ...rest] = d.split(":");
		out[k.trim().slice(2)] = rest.join(":").trim();
	}
	return out;
};
const fromCss = (css) => ({ light: pick(block(css, ":root")), dark: pick(block(css, ".dark")) });
const fromRegistry = (j) => ({
	name: j.name,
	light: pick({ ...j.cssVars?.theme, ...j.cssVars?.light }),
	dark: pick({ ...j.cssVars?.theme, ...j.cssVars?.dark }),
});

/* ---------- colors ---------- */
// Everything is emitted as plain "R G B" channels (used as rgb(var(--x) / <alpha>)), computed here,
// so the app needs no color-mix()/oklch support in the browser.
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const num = (x) => (String(x).trim().endsWith("%") ? parseFloat(x) / 100 : parseFloat(x));
const oklabToRgb = ([L, a, b]) => {
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
	return lin.map((c) => Math.round(clamp01(fromLinear(clamp01(c))) * 255));
};
const rgbToOklab = (rgb) => {
	const [r, g, b] = rgb.map((c) => toLinear(c / 255));
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
export const parseColor = (str) => {
	const v = String(str).trim().toLowerCase();
	let m;
	if ((m = v.match(/^#([0-9a-f]{3,8})$/))) {
		let h = m[1];
		if (h.length < 6) h = h.split("").map((c) => c + c).join("");
		return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
	}
	const fn = v.match(/^(rgba?|hsla?|oklch|oklab)\(([^)]+)\)$/);
	if (!fn) throw new Error(`Unsupported color: ${str}`);
	const p = fn[2].split("/")[0].replace(/,/g, " ").trim().split(/\s+/);
	if (fn[1].startsWith("rgb")) return p.slice(0, 3).map((x) => Math.round(x.endsWith("%") ? (parseFloat(x) * 255) / 100 : parseFloat(x)));
	if (fn[1].startsWith("hsl")) {
		const h = (parseFloat(p[0]) % 360) / 360, sat = num(p[1]), l = num(p[2]);
		const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, k = 2 * l - q;
		const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? k + (q - k) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? k + (q - k) * (2 / 3 - t) * 6 : k; };
		return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((c) => Math.round(c * 255));
	}
	const L = num(p[0]);
	if (fn[1] === "oklab") return oklabToRgb([L, parseFloat(p[1]), parseFloat(p[2])]);
	const C = parseFloat(p[1]), H = (parseFloat(p[2]) * Math.PI) / 180;
	return oklabToRgb([L, C * Math.cos(H), C * Math.sin(H)]);
};
const mix = (a, b, t) => {
	const A = rgbToOklab(a), B = rgbToOklab(b);
	return oklabToRgb(A.map((x, i) => x + (B[i] - x) * t));
};
const ch = (rgb) => rgb.join(" ");

/* ---------- generate ---------- */
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const tokens = (o) => Object.entries(o).filter(([k]) => k !== "radius").map(([k, v]) => `\t--${k}: ${ch(parseColor(v))};`).join("\n");

// Tailwind's own zinc / indigo, used by the default theme so it looks exactly like before.
const TW_ZINC = ["#fafafa", "#f4f4f5", "#e4e4e7", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a", "#18181b", "#09090b"];
const TW_INDIGO = ["#eef2ff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81", "#1e1b4b"];
const palette = (name, hexes) => steps.map((n, i) => `\t--${name}-${n}: ${ch(parseColor(hexes[i]))};`).join("\n");

export const defaultCss = (list) => {
	const t = list.find((x) => x.id === "default");
	return `/* theme:default (OpenNote) */\n:root,\n[data-theme="default"] {\n\t--radius: ${t.light.radius ?? "0.75rem"};\n\t--white: 255 255 255;\n${palette("zinc", TW_ZINC)}\n${palette("indigo", TW_INDIGO)}\n${tokens(t.light)}\n}\n.dark,\n[data-theme="default"].dark {\n${tokens(t.dark)}\n}\n`;
};

export const themeCss = (t) => {
	const L = t.light, D = t.dark;
	// Anchors are the same in light AND dark so Tailwind's zinc / white / indigo classes can be
	// derived from the theme: zinc-50 is the light background, zinc-950 the dark one,
	// indigo-500 the primary color. All 600+ hard-coded classes in the app follow the theme.
	const lbg = parseColor(L.background), dbg = parseColor(D.background), prim = parseColor(L.primary);
	const zinc = steps.map((n) => `\t--zinc-${n}: ${ch(mix(lbg, dbg, n / 1000))};`).join("\n");
	const ind = { 50: [0.08, 1], 100: [0.16, 1], 200: [0.3, 1], 300: [0.52, 1], 400: [0.76, 1], 500: null, 600: [0.86, 0], 700: [0.7, 0], 800: [0.54, 0], 900: [0.4, 0], 950: [0.26, 0] };
	const indigo = steps.map((n) => {
		const spec = ind[n];
		const c = spec ? mix([spec[1] * 255, spec[1] * 255, spec[1] * 255], prim, spec[0]) : prim;
		return `\t--indigo-${n}: ${ch(c)};`;
	}).join("\n");
	return `/* theme:${t.id} */\n[data-theme="${t.id}"] {\n\t--radius: ${L.radius ?? "0.5rem"};\n\t--white: ${ch(parseColor(L.card ?? L.background))};\n${zinc}\n${indigo}\n${tokens(L)}\n}\n[data-theme="${t.id}"].dark {\n${tokens(D)}\n}\n`;
};
const rebuild = (themes) => {
	const header = "/* GENERATED by scripts/add-theme.mjs from lib/themes.json. Do not edit by hand. */\n\n";
	fs.writeFileSync(CSS_FILE, header + defaultCss(themes) + "\n" + themes.filter((t) => t.id !== "default").map(themeCss).join("\n"));
};
const swatch = (t) => [t.light.background, t.light.primary, t.light.accent ?? t.light.secondary, t.dark.background];

/* ---------- cli ---------- */
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };
const list = fs.existsSync(JSON_FILE) ? JSON.parse(fs.readFileSync(JSON_FILE, "utf8")) : [];

if (args.includes("--rebuild")) {
	rebuild(list); console.log(`rebuilt ${CSS_FILE} (${list.length} themes)`);
} else {
	let parsed;
	if (flag("url")) {
		parsed = fromRegistry(await (await fetch(flag("url"))).json());
	} else {
		const file = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
		const text = file ? fs.readFileSync(file, "utf8") : fs.readFileSync(0, "utf8");
		parsed = text.trim().startsWith("{") ? fromRegistry(JSON.parse(text)) : fromCss(text);
	}
	const name = flag("name") ?? parsed.name ?? flag("id");
	const id = (flag("id") ?? name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
	if (!parsed.light.background || !parsed.dark.background || !parsed.light.primary) {
		console.error("Could not find --background / --primary in both :root and .dark. Paste the full CSS from tweakcn's Code tab.");
		process.exit(1);
	}
	const t = { id, name, swatch: swatch(parsed), light: parsed.light, dark: parsed.dark };
	const next = [...list.filter((x) => x.id !== id), t];
	fs.writeFileSync(JSON_FILE, JSON.stringify(next, null, "\t") + "\n");
	rebuild(next);
	console.log(`added theme "${name}" (${id}). Total: ${next.length}`);
}
