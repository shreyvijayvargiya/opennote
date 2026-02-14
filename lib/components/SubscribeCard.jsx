import React, { useState } from "react";
import { toast } from "sonner";
import { addSubscriber } from "../../lib/api/subscribers";

const SubscribeCard = ({
	id,
	title = "Get new posts in your inbox",
	subtitle = "Weekly tips, guides, and templates. No spam.",
	placeholder = "you@domain.com",
	buttonLabel = "Subscribe",
	className = "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm",
	layout = "row", // "row" | "stacked"
}) => {
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email) return;
		setIsSubmitting(true);
		try {
			await addSubscriber({ email, name: "" });
			toast.success("Subscribed!");
			setEmail("");
		} catch (error) {
			console.error("Subscribe error:", error);
			if (error.message === "Subscriber already exists") {
				toast.error("Subscriber already exists");
			} else {
				toast.error("Failed to subscribe. Please try again.");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div id={id} className={className}>
			<p className="text-sm font-semibold text-zinc-900">{title}</p>
			<p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
			<form
				onSubmit={handleSubmit}
				className={
					layout === "stacked" ? "mt-4 flex flex-col gap-2" : "mt-4 flex gap-2"
				}
			>
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder={placeholder}
					className={
						layout === "stacked"
							? "w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
							: "flex-1 px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
					}
					required
				/>
				<button
					type="submit"
					disabled={isSubmitting}
					className={
						layout === "stacked"
							? "w-full px-4 py-3 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-60"
							: "px-4 py-3 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-60"
					}
				>
					{isSubmitting ? "..." : buttonLabel}
				</button>
			</form>
		</div>
	);
};

export default SubscribeCard;
