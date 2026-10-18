import React, { createContext, useContext, useEffect, useState } from 'react';

const THEME_KEY = "rowtabs-theme"; // the chosen color theme (styles/themes.css), kept in localStorage
const applyTheme = (id) => {
  const root = document.documentElement;
  if (!id || id === "default") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", id);
};

const ThemeContext = createContext({ isDarkMode: false, toggleTheme: () => {}, themeId: "default", setThemeId: () => {} });

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeId, setThemeIdState] = useState("default");

  useEffect(() => {
    // The pre-paint script in _document.js already applied the theme; mirror it into state.
    setThemeIdState(localStorage.getItem(THEME_KEY) || "default");
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setThemeId = (id) => {
    setThemeIdState(id);
    applyTheme(id);
    localStorage.setItem(THEME_KEY, id);
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a default value instead of throwing to prevent crashes during SSR or missing provider
    return { isDarkMode: false, toggleTheme: () => {}, themeId: "default", setThemeId: () => {} };
  }
  return context;
};
