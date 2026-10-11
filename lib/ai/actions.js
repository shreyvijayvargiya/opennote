export const WRITER_MODES = [
	{
		id: "ask",
		label: "Ask",
		hint: "Questions about this note",
	},
	{
		id: "edit",
		label: "Edit",
		hint: "Revise the selected text or the note",
	},
	{
		id: "brainstorm",
		label: "Brainstorm",
		hint: "Ideas without changing the note",
	},
];

export const WRITER_ACTIONS = [
	{
		id: "improve",
		label: "Improve writing",
		emptyLabel: "Improve this writing",
		mode: "edit",
		intent: "rewrite-document",
		prompt:
			"Improve the writing of the current document. Keep the facts and the writer's voice. Explain the change briefly, then put the full revised piece in a proposal block.",
	},
	{
		id: "continue",
		label: "Continue",
		emptyLabel: "Continue writing",
		mode: "edit",
		intent: "insert",
		prompt:
			"Continue this piece from where it leaves off. Match the voice and do not repeat what is already written. Put only the new section in a proposal block.",
	},
	{
		id: "shorten",
		label: "Shorten",
		mode: "edit",
		intent: "edit",
		prompt:
			"Make this more concise. If text is selected, shorten only that passage. Put the revised text in a proposal block.",
	},
	{
		id: "expand",
		label: "Expand",
		mode: "edit",
		intent: "edit",
		prompt:
			"Expand this with more specific detail. If text is selected, expand only that passage. Do not invent facts. Put the revised text in a proposal block.",
	},
	{
		id: "grammar",
		label: "Fix grammar",
		mode: "edit",
		intent: "edit",
		prompt:
			"Fix grammar and spelling. Keep the voice. If text is selected, fix only that passage. Put the revised text in a proposal block.",
	},
	{
		id: "clearer",
		label: "Make clearer",
		emptyLabel: "Make this clearer",
		mode: "edit",
		intent: "edit",
		prompt:
			"Make this clearer. If text is selected, rewrite only that passage. Put the revised text in a proposal block.",
	},
	{
		id: "tone",
		label: "Change tone",
		mode: "edit",
		intent: "edit",
		prompt:
			"Change the tone so it sounds more confident and human. If text is selected, change only that passage. Do not make it sound corporate. Put the revised text in a proposal block.",
	},
	{
		id: "outline",
		label: "Create outline",
		emptyLabel: "Create an outline",
		mode: "brainstorm",
		intent: "insert",
		prompt:
			"Create a practical outline for this piece. Put the outline in a proposal block.",
	},
	{
		id: "summarize",
		label: "Summarize",
		mode: "ask",
		intent: "ask",
		prompt: "Summarize this note in a few short paragraphs.",
	},
	{
		id: "feedback",
		label: "Give feedback",
		emptyLabel: "Give me feedback",
		mode: "ask",
		intent: "ask",
		prompt:
			"Review this writing. Cover what works, what to improve, and the biggest issue. Do not rewrite the whole piece.",
	},
];

export const EMPTY_STATE_ACTIONS = ["improve", "continue", "outline", "feedback", "clearer"];

export function findWriterAction(id) {
	return WRITER_ACTIONS.find((action) => action.id === id) || null;
}
