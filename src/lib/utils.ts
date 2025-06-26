/* eslint-disable no-console */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Encode form state into shareable Base64 string */
export const encode = (data: unknown) => btoa(encodeURIComponent(JSON.stringify(data)));

/** Decode Base64 form state from URL string */
export const decode = <T = unknown>(str: string): T | null => {
  try {
    return JSON.parse(decodeURIComponent(atob(str)));
  } catch {
    return null;
  }
};

export const logger = {
  log: (...args: unknown[]) => console.log(...args),
  error: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  info: (...args: unknown[]) => console.info(...args),
};