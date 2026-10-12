import tailwindcssAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

// "var(--x)" with Tailwind's opacity modifiers (bg-zinc-100/50) via color-mix
const v = (name) => `color-mix(in oklab, var(${name}) calc(<alpha-value> * 100%), transparent)`;
const scale = (name) =>
	Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, v(`--${name}-${n}`)]));

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: "class",
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./modules/**/*.{js,ts,jsx,tsx,mdx}",
		"./lib/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			// Every color is a CSS variable, so a theme (see styles/themes.css) re-skins the whole app.
			// `zinc`, `white` and `indigo` are remapped too: the app uses those classes everywhere.
			colors: {
				border: v("--border"),
				input: v("--input"),
				ring: v("--ring"),
				background: v("--background"),
				foreground: v("--foreground"),
				primary: { DEFAULT: v("--primary"), foreground: v("--primary-foreground") },
				secondary: { DEFAULT: v("--secondary"), foreground: v("--secondary-foreground") },
				destructive: { DEFAULT: v("--destructive"), foreground: v("--destructive-foreground") },
				muted: { DEFAULT: v("--muted"), foreground: v("--muted-foreground") },
				accent: { DEFAULT: v("--accent"), foreground: v("--accent-foreground") },
				popover: { DEFAULT: v("--popover"), foreground: v("--popover-foreground") },
				card: { DEFAULT: v("--card"), foreground: v("--card-foreground") },
				white: v("--white"),
				zinc: scale("zinc"),
				indigo: scale("indigo"),
			},
			borderColor: { DEFAULT: v("--border") },
			borderRadius: {
				sm: "calc(var(--radius) - 4px)",
				md: "calc(var(--radius) - 2px)",
				lg: "var(--radius)",
				xl: "var(--radius)",
				"2xl": "calc(var(--radius) + 4px)",
				"3xl": "calc(var(--radius) + 12px)",
			},
		},
	},
	plugins: [tailwindcssAnimate, typography],
};
