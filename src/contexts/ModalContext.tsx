"use client";
import React, { createContext, useContext, useState } from "react";

interface ModalContextType {
  isAddGuideModalOpen: boolean;
  isSearchModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isAddGuideModalOpen, setIsAddGuideModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const openAddModal = () => setIsAddGuideModalOpen(true);
  const closeAddModal = () => setIsAddGuideModalOpen(false);
  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);

  return (
    <ModalContext.Provider
      value={{
        isAddGuideModalOpen,
        isSearchModalOpen,
        openAddModal,
        closeAddModal,
        openSearchModal,
        closeSearchModal,
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
