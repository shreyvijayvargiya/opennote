import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../styles/globals.css";
import { ThemeProvider, useTheme } from "../lib/context/ThemeContext";
import { Toaster } from "sonner";

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 5 * 60 * 1000, // 5 minutes
		},
	},
});

const MyApp = ({ Component, pageProps }) => {
	const { isDarkMode } = useTheme();

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<Toaster position="top-right" theme={isDarkMode ? "dark" : "light"} />
				<Component {...pageProps} />
			</ThemeProvider>
		</QueryClientProvider>
	);
};

export default MyApp;
