"use client";

import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { LoadingProvider } from "../contexts/LoadingContext";
import GlobalLoader from "./GlobalLoader";
import GlobalErrorHandler from "./GlobalErrorHandler";
import NetworkStatusMonitor from "./NetworkStatusMonitor";
import { Toaster } from "sonner";

import { ModalProvider } from "../contexts/ModalContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <LoadingProvider>
                <AuthProvider>
                    <ThemeProvider>
                        <ModalProvider>
                            <GlobalLoader />
                            <GlobalErrorHandler />
                            <NetworkStatusMonitor />
                            <Toaster position="top-center" richColors closeButton />
                            {children}
                        </ModalProvider>
                    </ThemeProvider>
                </AuthProvider>
            </LoadingProvider>
        </QueryProvider>
    );
}
