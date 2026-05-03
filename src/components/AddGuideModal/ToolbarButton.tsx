import React from "react";
import { ToolbarButtonProps } from "./types";

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, onClick, tooltip, className }) => {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900 group relative ${className}`}
    >
      {icon}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[1002]">
        {tooltip}
      </span>
    </button>
  );
};
