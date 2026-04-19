import { createContext, useContext, useEffect, useState, FC, ReactNode } from "react";

// Theme Context Value Type
interface ThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Theme Provider Props Type
interface ThemeProviderProps {
  children: ReactNode;
}

// Default context value
const defaultThemeValue: ThemeContextValue = {
  isDarkMode: false,
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(defaultThemeValue);

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("appDarkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Prioritize saved preference, then system preference
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true");
    } else {
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Apply theme changes to DOM and localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      document.body.classList.add("dark"); // Ensure body also has it for some legacy styles
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    localStorage.setItem("appDarkMode", isDarkMode.toString());
  }, [isDarkMode]);

  const toggleTheme = (): void => {
    setIsDarkMode((prev) => !prev);
  };

  const value: ThemeContextValue = {
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
