import { clsx, type ClassValue } from "clsx";
import crypto from 'crypto';
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseURL() {
  return process.env.NODE_ENV === "production"
    ? "https://www.abdulachik.dev"
    : "http://localhost:3000"
}


export function createKeyFromJson(json: object) {
  const str = JSON.stringify(json);
  const hash = crypto.createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
}

export function transformKeyToJson(key: string) {
  const hash = crypto.createHash('sha256');
  hash.update(key);
  const str = hash.digest('hex');
  return JSON.parse(str);
}

export const isProduction = process.env.NODE_ENV === 'production'
