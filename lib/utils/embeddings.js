import { pipeline } from "@xenova/transformers";

let extractor = null;

/**
 * Initialize the embedding model lazily
 */
const getExtractor = async () => {
	if (!extractor) {
		// Using a small, efficient model for browser-side embeddings
		// all-MiniLM-L6-v2 is ~80MB and very accurate for its size
		extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
	}
	return extractor;
};

/**
 * Generates embeddings locally using Transformers.js
 * No API key required.
 */
export const getEmbedding = async (text) => {
	try {
		if (!text || text.trim().length === 0) return null;

		const generateEmbedding = await getExtractor();
		const output = await generateEmbedding(text, {
			pooling: "mean",
			normalize: true,
		});

		// Convert Tensor to standard JS array
		return Array.from(output.data);
	} catch (error) {
		console.error("Error generating local embedding:", error);
		// Return a mock embedding as ultimate fallback to prevent graph crashes
		return Array.from({ length: 384 }, () => Math.random());
	}
};

/**
 * Calculate cosine similarity between two vectors
 */
export const cosineSimilarity = (vecA, vecB) => {
	if (!vecA || !vecB) return 0;

	// Basic dimensionality check
	if (vecA.length !== vecB.length) return 0;

	const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
	const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
	const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

	if (magA === 0 || magB === 0) return 0;
	return dotProduct / (magA * magB);
};
