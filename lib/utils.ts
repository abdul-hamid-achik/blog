import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseURL() {
  return process.env.NODE_ENV === "production"
    ? "https://abdulachik.dev"
    : "http://localhost:3000"
}
