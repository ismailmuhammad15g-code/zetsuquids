"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useModal } from "../../../contexts/ModalContext";

function CreateProxyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAddModal } = useModal();

  useEffect(() => {
    const title = searchParams.get("title");
    const desc = searchParams.get("desc") || searchParams.get("description");

    if (title || desc) {
      // Prepare the draft in localStorage so AddGuideModal picks it up
      const draft = {
        formData: {
          title: title ? decodeURIComponent(title) : "",
          content: desc ? decodeURIComponent(desc) : "",
          keywords: "",
          html_content: "",
          css_content: "",
          cover_image: "",
        },
        slugValue: title ? decodeURIComponent(title).toLowerCase().replace(/ /g, "-") : "",
        savedAt: Date.now()
      };
      localStorage.setItem("add_guide_draft_v1", JSON.stringify(draft));
    }

    // Open the modal globally
    openAddModal();

    // Redirect to home so the user is on a valid background page
    router.replace("/");
  }, [openAddModal, router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-black rounded-full" />
        <p className="font-bold text-sm uppercase tracking-widest">Initializing Creator...</p>
      </div>
    </div>
  );
}

export default function CreateProxyPage() {
  return (
    <Suspense fallback={null}>
      <CreateProxyContent />
    </Suspense>
  );
}
