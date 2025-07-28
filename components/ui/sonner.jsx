"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return <Sonner theme={theme} duration={5000} visibleToasts={6} className="toaster group" {...props} />;
};

export { Toaster };
