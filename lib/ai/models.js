export const DEFAULT_MODEL = "openai/gpt-4o-mini";

export const AI_MODELS = [
	{ id: "openai/gpt-4o-mini", label: "OpenAI" },
	{ id: "anthropic/claude-3.5-haiku", label: "Anthropic" },
	{ id: "google/gemini-2.0-flash-001", label: "Google" },
];

export function allowedModelIds() {
	const envModel = process.env.OPENROUTER_MODEL;
	return [...new Set([envModel, ...AI_MODELS.map((model) => model.id)].filter(Boolean))];
}

export function resolveModel(requested) {
	const fallback = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
	if (requested && allowedModelIds().includes(requested)) return requested;
	return fallback;
}
