import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely.
 * If you pass generic classes and specific overrides, the overrides win.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
