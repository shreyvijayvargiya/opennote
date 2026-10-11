/**
 * Splits text into plain and tagged parts so `@Note Title` can be highlighted.
 * tags: [{ id, title }]  ->  [{ text, id? }]  (id is set on tagged parts)
 */
export const splitTags = (text, tags) => {
	const tokens = tags
		.map((t) => ({ id: t.id, token: `@${t.title}` }))
		.sort((a, b) => b.token.length - a.token.length);
	const parts = [];
	let plain = "";
	for (let i = 0; i < text.length; ) {
		const hit = tokens.find((t) => text.startsWith(t.token, i));
		if (hit) {
			if (plain) parts.push({ text: plain }), (plain = "");
			parts.push({ text: hit.token, id: hit.id });
			i += hit.token.length;
		} else plain += text[i++];
	}
	if (plain) parts.push({ text: plain });
	return parts;
};

export const TAG_CLASS =
	"rounded bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300";
