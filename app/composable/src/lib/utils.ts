import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const saveToLocalStorage = (key: string, value: any) => {
  if (typeof window === "undefined") {
    return;
  }
  console.log("saving to local storage", key);
  localStorage.setItem(key, JSON.stringify(value));
};

export const readFromLocalStorage = (key: string, defaultValue: any) => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  console.log("read from local storage", key);
  try {
    const data = JSON.parse(localStorage.getItem(key) || "");
    return data;
  } catch (e) {
    console.warn("error parsing local storage", e);
    return defaultValue;
  }
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
