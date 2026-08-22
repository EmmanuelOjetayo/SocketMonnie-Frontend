import React from "react";
import { Info } from "lucide-react";

export const PolicyNoticeBanner = ({ title = "Important Notice", children }) => {
  return (
    <div className="w-full bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-md mb-6 shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-blue-800">{title}</h3>
          <div className="mt-1 text-sm text-blue-700 space-y-1">{children}</div>
        </div>
      </div>
    </div>
  );
};