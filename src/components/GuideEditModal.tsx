"use client";
import AddGuideModal from "./AddGuideModal/AddGuideModal";
import { Guide } from "../lib/api";

interface GuideEditModalProps {
  guide: Guide;
  onClose: () => void;
  onSaved?: (updatedGuide: Guide) => void;
}

export default function GuideEditModal({ guide, onClose, onSaved }: GuideEditModalProps) {
  return (
    <AddGuideModal
      guide={guide}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
