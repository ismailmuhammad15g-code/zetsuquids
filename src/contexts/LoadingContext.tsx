"use client";
import { createContext, FC, ReactNode, useCallback, useContext, useState } from "react";

// Loading Context Value Type
interface LoadingContextValue {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
    startLoading: () => void;
    stopLoading: () => void;
}

// Loading Provider Props Type
interface LoadingProviderProps {
    children: ReactNode;
}

// Default context value
const defaultLoadingValue: LoadingContextValue = {
    isLoading: false,
    setLoading: () => { },
    startLoading: () => { },
    stopLoading: () => { },
};

const LoadingContext = createContext<LoadingContextValue>(
    defaultLoadingValue
);

export const LoadingProvider: FC<LoadingProviderProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Helper functions for cleaner API
    const startLoading = useCallback((): void => setIsLoading(true), []);
    const stopLoading = useCallback((): void => setIsLoading(false), []);

    // Also support direct set for more complex logic
    const setLoading = useCallback((loading: boolean): void => {
        setIsLoading(loading);
    }, []);

    const value: LoadingContextValue = {
        isLoading,
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
