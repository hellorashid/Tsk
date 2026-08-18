import type { TaskSource } from "./types";

export function isSharedTaskSource(source: TaskSource | null | undefined): source is TaskSource {
  return Boolean(source?.mountId);
}

export function canEditTaskSource(source: TaskSource | null | undefined) {
  return !isSharedTaskSource(source) || source.role === "editor";
}
