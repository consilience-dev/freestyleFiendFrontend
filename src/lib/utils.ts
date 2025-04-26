import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function to conditionally join classNames (shadcn/ui standard)
export function cn(...inputs: (string | undefined | null | false | { [key: string]: boolean })[]): string {
  return twMerge(clsx(inputs));
}
