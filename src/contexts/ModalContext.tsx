"use client";
import React, { createContext, useContext, useState } from "react";

interface ModalContextType {
  isAddGuideModalOpen: boolean;
  isSearchModalOpen: boolean;
  isChatOpen: boolean;
  chatTab: "chat" | "direct-support" | "support-form";
  openAddModal: () => void;
  closeAddModal: () => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  setIsChatOpen: (open: boolean) => void;
  setChatTab: (tab: "chat" | "direct-support" | "support-form") => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isAddGuideModalOpen, setIsAddGuideModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<"chat" | "direct-support" | "support-form">("chat");

  const openAddModal = () => setIsAddGuideModalOpen(true);
  const closeAddModal = () => setIsAddGuideModalOpen(false);
  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);

  return (
    <ModalContext.Provider
      value={{
        isAddGuideModalOpen,
        isSearchModalOpen,
        isChatOpen,
        chatTab,
        openAddModal,
        closeAddModal,
        openSearchModal,
        closeSearchModal,
        setIsChatOpen,
        setChatTab,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
