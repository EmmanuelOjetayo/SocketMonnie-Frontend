import React from "react";
import { cn } from "../../utils/cn";

export const Card = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 transition-all duration-200 hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};