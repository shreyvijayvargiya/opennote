import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../styles/globals.css";
import "../styles/themes.css";
import { ThemeProvider, useTheme } from "../lib/context/ThemeContext";
import { Toaster } from "sonner";
import { AppProvider } from "../lib/context/AppContext";
import RootLayout from "../lib/components/RootLayout";

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
				<AppProvider>
					<RootLayout>
						<Component {...pageProps} />
					</RootLayout>
				</AppProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
};

export default MyApp;
