import { LIMITS } from "./schema";

export const readAsDataUrl = (file) =>
	new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(r.result);
		r.onerror = reject;
		r.readAsDataURL(file);
	});

/** Shrinks a picture so cells stay light in IndexedDB (max side 640px). */
export const imageToCell = async (file, max = 640) => {
	if (!file.type.startsWith("image/")) throw new Error("Pick an image file");
	const src = await readAsDataUrl(file);
	if (file.type === "image/svg+xml" || file.type === "image/gif") {
		if (file.size > LIMITS.FILE_BYTES) throw new Error("Image is over 2 MB");
		return { name: file.name, dataUrl: src };
	}
	const img = await new Promise((res, rej) => {
		const i = new Image();
		i.onload = () => res(i);
		i.onerror = rej;
		i.src = src;
	});
	const scale = Math.min(1, max / Math.max(img.width, img.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(img.width * scale);
	canvas.height = Math.round(img.height * scale);
	canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
	return { name: file.name, dataUrl: canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.85) };
};

export const fileToCell = async (file) => {
	if (file.size > LIMITS.FILE_BYTES) throw new Error(`${file.name} is over 2 MB`);
	return { name: file.name, size: file.size, type: file.type, dataUrl: await readAsDataUrl(file) };
};

export const formatBytes = (n = 0) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);

export const downloadDataUrl = (f) => {
	const a = document.createElement("a");
	a.href = f.dataUrl;
	a.download = f.name;
	a.click();
};
