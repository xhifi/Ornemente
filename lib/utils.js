import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const generateThumbnailURL = (key) => {
  const keyParts = key.split(".");
  const thumb = keyParts[0] + "-thumb." + "jpg";
  return `/api/cdn/images/${thumb}`;
};
export const generate500x500URL = (key) => {
  const keyParts = key.split(".");
  const resized = keyParts[0] + "-500x500." + "jpg";
  return `/api/cdn/images/${resized}`;
};
