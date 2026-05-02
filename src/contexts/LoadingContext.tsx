"use client";
import { createContext, FC, ReactNode, useCallback, useContext, useState } from "react";

// Loading Context Value Type
interface LoadingContextValue {
    isLoading: boolean;
    loadingMessage: string;
    setLoading: (loading: boolean, message?: string) => void;
    startLoading: (message?: string) => void;
    stopLoading: () => void;
}

// Loading Provider Props Type
interface LoadingProviderProps {
    children: ReactNode;
}

// Default context value
const defaultLoadingValue: LoadingContextValue = {
    isLoading: false,
    loadingMessage: "",
    setLoading: () => { },
    startLoading: () => { },
    stopLoading: () => { },
};

const LoadingContext = createContext<LoadingContextValue>(
    defaultLoadingValue
);

export const LoadingProvider: FC<LoadingProviderProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>("");

    // Helper functions for cleaner API
    const startLoading = useCallback((message: string = ""): void => {
        setLoadingMessage(message);
        setIsLoading(true);
    }, []);

    const stopLoading = useCallback((): void => {
        setIsLoading(false);
        // Clear message after a short delay to allow exit animations to finish
        setTimeout(() => setLoadingMessage(""), 500);
    }, []);

    const setLoading = useCallback((loading: boolean, message: string = ""): void => {
        if (message) setLoadingMessage(message);
        setIsLoading(loading);
    }, []);

    const value: LoadingContextValue = {
        isLoading,
        loadingMessage,
        setLoading,
        startLoading,
        stopLoading,
    };

    return (
        <LoadingContext.Provider value={value}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = (): LoadingContextValue => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error("useLoading must be used within a LoadingProvider");
    }
    return context;
};
