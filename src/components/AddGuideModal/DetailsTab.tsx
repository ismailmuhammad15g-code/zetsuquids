import React from "react";
import { PlusCircle, Hash, LayoutTemplate, Clock, Image as ImageIcon, Loader2, X } from "lucide-react";
import { FormData } from "./types";

interface DetailsTabProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  slugValue: string;
  setSlugValue: (s: string) => void;
  readTime: number;
  validationErrors: string[];
  autoResize: boolean;
  setAutoResize: (s: boolean) => void;
  coverUrlInput: string;
  setCoverUrlInput: (s: string) => void;
  handleCoverUrlPaste: (e?: React.FormEvent) => Promise<void>;
  isFetchingCoverUrl: boolean;
  coverUrlError: string;
  handleCoverImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({
  formData,
  setFormData,
  slugValue,
  setSlugValue,
  readTime,
  validationErrors,
  autoResize,
  setAutoResize,
  coverUrlInput,
  setCoverUrlInput,
  handleCoverUrlPaste,
  isFetchingCoverUrl,
  coverUrlError,
  handleCoverImageUpload,
}) => {
  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-8 overflow-y-auto h-full bg-white shadow-sm md:my-4 md:rounded-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300 custom-scrollbar">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-4 flex items-center gap-2">
        <PlusCircle className="text-indigo-600" size={24} />
        Guide Configuration
      </h2>

      {validationErrors && validationErrors.length > 0 && (
        <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-800 animate-in fade-in duration-200">
          ⚠️ Please resolve the validation issues listed on the Publish button before continuing.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Hash size={14} className="text-gray-400" />
              Slug (Auto-generated)
            </label>
            <input
              type="text"
              value={slugValue}
              onChange={(e) => setSlugValue(e.target.value)}
              placeholder="guide-slug"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-500 focus:ring-2 focus:ring-black outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <LayoutTemplate size={14} className="text-gray-400" />
              Category
            </label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all text-sm bg-white"
            >
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Business">Business</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              Difficulty
            </label>
            <div className="flex gap-2">
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <button
                  key={level}
                  type="button"
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border border-gray-200 hover:border-black transition-all bg-white"
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              Estimated Read Time
            </label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium">
              {readTime} min read
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Guide Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter a catchy title..."
            className="w-full text-3xl font-black tracking-tight placeholder:text-gray-200 border-none focus:ring-0 p-0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Keywords</label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            placeholder="react, tutorial, javascript, frontend..."
            className="w-full text-lg text-gray-500 placeholder:text-gray-200 border-none focus:ring-0 p-0"
          />
        </div>

        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900">Cover Image</p>
              <p className="text-xs text-gray-500">Professional guides deserve a 16:9 cover image.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-full border shadow-sm hover:border-black transition-all">
                <div
                  onClick={(e) => { e.preventDefault(); setAutoResize(!autoResize); }}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${autoResize ? "bg-black" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoResize ? "translate-x-[14px]" : "translate-x-0.5"}`} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Auto-Resize</span>
              </label>
              <label className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-black text-white text-sm font-bold cursor-pointer hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                <ImageIcon size={16} />
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={coverUrlInput}
              onChange={(e) => setCoverUrlInput(e.target.value)}
              placeholder="Paste image URL here..."
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none"
            />
            <button
              onClick={() => handleCoverUrlPaste()}
              disabled={isFetchingCoverUrl || !coverUrlInput}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 disabled:opacity-50"
            >
              {isFetchingCoverUrl ? <Loader2 size={16} className="animate-spin" /> : "Fetch"}
            </button>
          </div>
          {coverUrlError && <p className="text-xs text-red-500 font-medium">{coverUrlError}</p>}

          {formData.cover_image && (
            <div className="relative group rounded-2xl overflow-hidden border border-gray-200 aspect-[16/9] shadow-sm">
              <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
              <button
                onClick={() => setFormData({ ...formData, cover_image: "" })}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
