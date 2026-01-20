import type { ArrayMergeStrategy, BodyMergeStrategy } from "../types/index.js";

/**
 * Merge two arrays based on strategy
 */
export function mergeArrays<T>(
  parent: T[],
  child: T[],
  strategy: ArrayMergeStrategy
): T[] {
  switch (strategy) {
    case "replace":
      return [...child];
    case "prepend":
      return [...child, ...parent];
    case "concatenate":
      return [...parent, ...child];
    case "dedupe":
      return [...new Set([...parent, ...child])];
    case "dedupe-last": {
      // Keep last occurrence of duplicates
      const combined = [...parent, ...child];
      return combined.filter(
        (item, index) => combined.lastIndexOf(item) === index
      );
    }
    default:
      return [...parent, ...child];
  }
}

/**
 * Merge body content based on strategy
 */
export function mergeBody(
  parent: string,
  child: string,
  strategy: BodyMergeStrategy
): string {
  if (!parent.trim()) return child;
  if (!child.trim()) return parent;

  switch (strategy) {
    case "replace":
      return child;
    case "prepend":
      return `${child}\n\n${parent}`;
    case "append":
    default:
      return `${parent}\n\n${child}`;
  }
}

/**
 * Deduplicate array preserving order (first occurrence wins)
 */
export function deduplicateArray<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
