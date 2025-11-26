"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:border-2 group-[.toaster]:shadow-lg",
          title: "text-[#1C2335] !font-semibold",
          description: "text-[#1C2335] !font-normal opacity-80",
          actionButton: "bg-[#FF6B00] text-white font-semibold",
          cancelButton: "bg-gray-200 text-[#1C2335] font-semibold",
          error: "!bg-white !border-red-500",
          success: "!bg-white !border-green-500",
          warning: "!bg-white !border-yellow-500",
          info: "!bg-white !border-blue-500",
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#1C2335",
          "--normal-border": "rgba(0, 0, 0, 0.1)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
