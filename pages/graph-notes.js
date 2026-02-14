import React, { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	Search,
	Loader2,
	Network,
	Info,
	Maximize2,
	Minimize2,
	Sun,
	Moon,
	Zap,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { noteService } from "../lib/db/noteService";
import { db as localDb } from "../lib/db/localDb";
import { getEmbedding, cosineSimilarity } from "../lib/utils/embeddings";
import { toast, Toaster } from "sonner";
import { useTheme } from "../lib/context/ThemeContext";

// Animated Star Field Component
const CosmosBackground = ({ isDarkMode }) => {
	const [stars, setStars] = useState([]);

	useEffect(() => {
		// Generate stars only on the client side to avoid hydration mismatch
		const generatedStars = Array.from({ length: 150 }).map((_, i) => ({
			id: i,
			size: Math.random() * 2 + 1,
			x: Math.random() * 100,
			y: Math.random() * 100,
			duration: Math.random() * 3 + 2,
			delay: Math.random() * 5,
		}));
		setStars(generatedStars);
	}, []);

	return (
		<div
			className={`absolute inset-0 overflow-hidden ${isDarkMode ? "bg-[#020205]" : "bg-white"} z-0 transition-colors duration-300`}
		>
			{/* Nebula Gradients - Only show in dark mode for cosmos effect */}
			{isDarkMode && (
				<>
					<div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/20 blur-[120px] rounded-full animate-pulse" />
					<div
						className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse"
						style={{ animationDelay: "2s" }}
					/>
				</>
			)}

			{isDarkMode &&
				stars.map((star) => (
					<motion.div
						key={star.id}
						className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
						style={{
							width: star.size,
							height: star.size,
							left: `${star.x}%`,
							top: `${star.y}%`,
						}}
						animate={{
							opacity: [0.2, 1, 0.2],
							scale: [1, 1.5, 1],
						}}
						transition={{
							duration: star.duration,
							repeat: Infinity,
							delay: star.delay,
							ease: "easeInOut",
						}}
					/>
				))}
		</div>
	);
};

// Dynamically import the 3D graph to avoid SSR issues
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
	ssr: false,
});

const GraphNotesPage = () => {
	const { isDarkMode, toggleTheme } = useTheme();
	const [user] = useState({ uid: "local-user" });
	const [searchQuery, setSearchQuery] = useState("");
	const [embeddings, setEmbeddings] = useState({});
	const [isCalculating, setIsCalculating] = useState(false);
	const router = useRouter();
	const graphRef = useRef();

	// Fetch Notes Locally
	const notes =
		useLiveQuery(() => noteService.getAllNotes(user?.uid), [user?.uid]) || [];

	const isNotesLoading = notes.length === 0 && user;

	// Calculate Embeddings
	useEffect(() => {
		const calculateEmbeddings = async () => {
			if (notes.length === 0) return;

			setIsCalculating(true);
			const newEmbeddings = { ...embeddings };
			let updated = false;

			for (const note of notes) {
				if (!newEmbeddings[note.id]) {
					const content = `${note.title} ${note.content?.replace(/<[^>]*>/g, "")}`;
					const embedding = await getEmbedding(content);
					if (embedding) {
						newEmbeddings[note.id] = embedding;
						updated = true;
					}
				}
			}

			if (updated) {
				setEmbeddings(newEmbeddings);
			}
			setIsCalculating(false);
		};

		calculateEmbeddings();
	}, [notes]);

	// Prepare Graph Data
	const graphData = useMemo(() => {
		const nodes = notes
			.filter(
				(note) =>
					note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					note.content?.toLowerCase().includes(searchQuery.toLowerCase()),
			)
			.map((note) => ({
				id: note.id,
				name: note.title || "Untitled",
				val: 1,
				color:
					searchQuery &&
					note.title.toLowerCase().includes(searchQuery.toLowerCase())
						? "#f43f5e"
						: isDarkMode
							? "#6366f1"
							: "#4f46e5", // Indigo for nodes
			}));

		const links = [];
		const linkSet = new Set();

		// Add explicit links from notes
		notes.forEach((note) => {
			if (note.links && Array.from(note.links).length > 0) {
				note.links.forEach((targetId) => {
					const targetIdNum = parseInt(targetId, 10);
					// Only add if target note exists in filtered nodes
					if (nodes.find((n) => n.id === targetIdNum)) {
						const linkId = `${note.id}-${targetIdNum}`;
						const reverseLinkId = `${targetIdNum}-${note.id}`;
						
						if (!linkSet.has(linkId) && !linkSet.has(reverseLinkId)) {
							links.push({
								source: note.id,
								target: targetIdNum,
								value: 1.0,
								isExplicit: true,
							});
							linkSet.add(linkId);
						}
					}
				});
			}
		});

		// Add semantic similarity links
		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				const idA = nodes[i].id;
				const idB = nodes[j].id;
				const linkId = `${idA}-${idB}`;
				const reverseLinkId = `${idB}-${idA}`;

				if (linkSet.has(linkId) || linkSet.has(reverseLinkId)) continue;

				if (embeddings[idA] && embeddings[idB]) {
					const similarity = cosineSimilarity(embeddings[idA], embeddings[idB]);
					if (similarity > 0.75) {
						// Higher threshold for semantic links if explicit links exist
						links.push({
							source: idA,
							target: idB,
							value: similarity,
							isExplicit: false,
						});
						linkSet.add(linkId);
					}
				}
			}
		}

		return { nodes, links };
	}, [notes, embeddings, searchQuery, isDarkMode]);

	if (isNotesLoading) {
		return (
			<div
				className={`h-screen w-screen flex flex-col items-center justify-center ${isDarkMode ? "bg-[#020205]" : "bg-white"} text-indigo-500`}
			>
				<Loader2 className="w-8 h-8 animate-spin mb-4" />
				<p
					className={`${isDarkMode ? "text-zinc-500" : "text-zinc-400"} animate-pulse uppercase tracking-widest text-xs font-bold`}
				>
					Initializing Neural Network...
				</p>
			</div>
		);
	}

	return (
		<div
			className={`h-screen w-screen ${isDarkMode ? "bg-[#020205] text-white" : "bg-white text-zinc-900"} overflow-hidden relative font-sans transition-colors duration-300`}
		>
			<Toaster theme={isDarkMode ? "dark" : "light"} position="bottom-center" />

			{/* Animated Cosmos Background */}
			<CosmosBackground isDarkMode={isDarkMode} />

			{/* Header UI */}
			<div className="absolute top-0 left-0 right-0 p-6 z-10 flex items-center justify-between pointer-events-none">
				<div className="flex items-center gap-4 pointer-events-auto">
					<button
						onClick={() => router.push("/")}
						className={`p-3 rounded-2xl ${isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200"} backdrop-blur-xl transition-all group border`}
					>
						<ArrowLeft
							className={`w-5 h-5 ${isDarkMode ? "text-zinc-400 group-hover:text-white" : "text-zinc-600 group-hover:text-zinc-900"}`}
						/>
					</button>
					<div>
						<h1
							className={`text-xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-zinc-900"} flex items-center gap-2`}
						>
							<Network className="w-5 h-5 text-indigo-500" />
							Neural Notes
						</h1>
						<p
							className={`text-[10px] ${isDarkMode ? "text-indigo-400" : "text-indigo-600"} uppercase tracking-widest font-black opacity-80`}
						>
							{isDarkMode ? "Cosmos Explorer" : "Mind Map"}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3 pointer-events-auto">
					<button
						onClick={toggleTheme}
						className={`p-3 rounded-2xl ${isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200"} backdrop-blur-xl transition-all border`}
						title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
					>
						{isDarkMode ? (
							<Sun className="w-5 h-5 text-zinc-400" />
						) : (
							<Moon className="w-5 h-5 text-zinc-600" />
						)}
					</button>
					<div className="relative group">
						<Search
							className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}
						/>
						<input
							type="text"
							placeholder={
								isDarkMode ? "Search the cosmos..." : "Search ideas..."
							}
							className={`w-64 pl-11 pr-4 py-3 ${isDarkMode ? "bg-white/5 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20 text-white" : "bg-zinc-100 border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/10 text-zinc-900"} backdrop-blur-xl rounded-2xl text-sm outline-none transition-all border focus:ring-2`}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					{isCalculating && (
						<div
							className={`flex items-center gap-2 px-4 py-2 ${isDarkMode ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-100 text-indigo-600"} border rounded-xl text-[10px] font-bold uppercase tracking-wider`}
						>
							<Zap className="w-3 h-3 animate-pulse" />
							Syncing
						</div>
					)}
				</div>
			</div>

			{/* Graph Legend */}
			<div
				className={`absolute bottom-6 left-6 z-10 p-5 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white/80 border-zinc-200"} backdrop-blur-2xl rounded-3xl max-w-xs pointer-events-auto border shadow-2xl`}
			>
				<div className="flex items-center gap-2 mb-3">
					<div
						className={`p-1.5 rounded-xl ${isDarkMode ? "bg-indigo-500/20" : "bg-indigo-50"}`}
					>
						<Info
							className={`w-4 h-4 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
						/>
					</div>
					<span
						className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-zinc-900"}`}
					>
						{isDarkMode ? "Universe Map" : "Neural Map"}
					</span>
				</div>
				<p
					className={`text-[11px] leading-relaxed ${isDarkMode ? "text-zinc-400" : "text-zinc-600"} font-medium`}
				>
					Each node is a thought in your digital brain. Connections reveal how
					your ideas interact.
				</p>
				<div className="mt-4 flex flex-wrap gap-3">
					<div className="flex items-center gap-2">
						<div
							className={`w-2 h-2 rounded-full bg-indigo-500 ${isDarkMode ? "shadow-[0_0_8px_#6366f1]" : ""}`}
						/>
						<span
							className={`text-[10px] font-bold ${isDarkMode ? "text-zinc-500" : "text-zinc-400"} uppercase`}
						>
							Idea
						</span>
					</div>
					<div className="flex items-center gap-2">
						<div
							className={`w-2 h-2 rounded-full bg-rose-500 ${isDarkMode ? "shadow-[0_0_8px_#f43f5e]" : ""}`}
						/>
						<span
							className={`text-[10px] font-bold ${isDarkMode ? "text-zinc-500" : "text-zinc-400"} uppercase`}
						>
							Active Match
						</span>
					</div>
					<div className="flex items-center gap-2">
						<div
							className={`w-4 h-0.5 bg-indigo-500 ${isDarkMode ? "shadow-[0_0_8px_#6366f1]" : ""}`}
						/>
						<span
							className={`text-[10px] font-bold ${isDarkMode ? "text-zinc-500" : "text-zinc-400"} uppercase`}
						>
							Direct Link
						</span>
					</div>
					<div className="flex items-center gap-2">
						<div
							className={`w-4 h-0.5 bg-indigo-500/30 border-t border-dashed`}
						/>
						<span
							className={`text-[10px] font-bold ${isDarkMode ? "text-zinc-500" : "text-zinc-400"} uppercase`}
						>
							Semantic Match
						</span>
					</div>
				</div>
			</div>

			{/* The Graph */}
			<div className="w-full h-full cursor-grab active:cursor-grabbing z-[1]">
				<ForceGraph3D
					ref={graphRef}
					graphData={graphData}
					backgroundColor="rgba(0,0,0,0)"
					nodeColor={(node) => node.color}
					nodeLabel={(node) => `
            <div class="${isDarkMode ? "bg-zinc-900/90 text-white border-white/10" : "bg-white/90 text-zinc-900 border-zinc-200"} border p-4 rounded-2xl text-xs shadow-2xl backdrop-blur-xl min-w-[140px]">
              <div class="font-black mb-1 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"} uppercase tracking-tighter">${node.name}</div>
              <div class="text-zinc-500 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Enter Thought
              </div>
            </div>
          `}
					nodeRelSize={7}
					linkColor={(link) =>
						link.isExplicit
							? isDarkMode
								? "rgba(129, 140, 248, 0.6)"
								: "rgba(79, 70, 229, 0.4)"
							: isDarkMode
								? "rgba(99, 102, 241, 0.15)"
								: "rgba(99, 102, 241, 0.08)"
					}
					linkWidth={(link) => (link.isExplicit ? 2.5 : 1)}
					linkDirectionalParticles={(link) => (link.isExplicit ? 6 : 2)}
					linkDirectionalParticleSpeed={(link) =>
						link.isExplicit ? 0.01 : 0.004
					}
					linkDirectionalParticleWidth={(link) => (link.isExplicit ? 3 : 1.5)}
					linkDirectionalParticleColor={(link) =>
						link.isExplicit
							? isDarkMode
								? "#a5b4fc"
								: "#4f46e5"
							: isDarkMode
								? "#818cf8"
								: "#6366f1"
					}
					onNodeClick={(node) => {
						router.push(`/?noteId=${node.id}`);
					}}
					nodeThreeObjectExtend={true}
					forceEngine="d3"
					showNavInfo={false}
				/>
			</div>

			{/* HUD Controls */}
			<div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2 pointer-events-auto">
				<button
					onClick={() => graphRef.current.zoomToFit(400)}
					className={`p-4 rounded-2xl ${isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200"} backdrop-blur-xl transition-all shadow-2xl group border`}
					title="Recenter Map"
				>
					<Maximize2
						className={`w-5 h-5 ${isDarkMode ? "text-zinc-400" : "text-zinc-600"} group-hover:${isDarkMode ? "text-white" : "text-zinc-900"}`}
					/>
				</button>
			</div>
		</div>
	);
};

export default GraphNotesPage;
