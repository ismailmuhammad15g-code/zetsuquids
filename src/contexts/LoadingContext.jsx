import React, { createContext, useContext, useState, useCallback } from 'react'

const LoadingContext = createContext({
    isLoading: false,
    setLoading: () => { },
    startLoading: () => { },
    stopLoading: () => { }
})

export function LoadingProvider({ children }) {
    const [isLoading, setIsLoading] = useState(false)

    // Helper functions for cleaner API
    const startLoading = useCallback(() => setIsLoading(true), [])
    const stopLoading = useCallback(() => setIsLoading(false), [])

    // Also support direct set for more complex logic
    const setLoading = useCallback((loading) => setIsLoading(loading), [])

    return (
        <LoadingContext.Provider value={{ isLoading, setLoading, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    )
}

export const useLoading = () => useContext(LoadingContext)
