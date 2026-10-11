/** Turns a picked/pasted/dropped File into a chat attachment (image | pdf | csv). */

const MAX_PDF = 10 * 1024 * 1024;
const MAX_CSV = 2 * 1024 * 1024;
const MAX_IMAGE = 15 * 1024 * 1024;

const readAs = (file, method) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
		reader[method](file);
	});

// Downscale to keep requests small and IndexedDB light.
const resizeImage = async (file, maxSide, quality) => {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL("image/jpeg", quality);
};

export const processFile = async (file) => {
	const base = {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		name: file.name || "pasted-image.png",
		size: file.size,
	};
	const name = base.name.toLowerCase();

	if (file.type.startsWith("image/")) {
		if (file.size > MAX_IMAGE) throw new Error("Image too large (max 15MB)");
		return {
			...base,
			kind: "image",
			dataUrl: await resizeImage(file, 1280, 0.85),
			thumb: await resizeImage(file, 160, 0.7),
			preview: await resizeImage(file, 640, 0.75), // kept in chat history for the preview modal
		};
	}
	if (file.type === "application/pdf" || name.endsWith(".pdf")) {
		if (file.size > MAX_PDF) throw new Error("PDF too large (max 10MB)");
		return { ...base, kind: "pdf", dataUrl: await readAs(file, "readAsDataURL") };
	}
	if (file.type === "text/csv" || name.endsWith(".csv")) {
		if (file.size > MAX_CSV) throw new Error("CSV too large (max 2MB)");
		return { ...base, kind: "csv", text: await readAs(file, "readAsText") };
	}
	throw new Error("Supported files: images, PDF, CSV");
};
