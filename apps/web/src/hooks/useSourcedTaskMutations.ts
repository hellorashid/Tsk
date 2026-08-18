import { useCallback } from "react";
import { basic } from "../basic";
import type { TaskSource, TaskUpdate } from "../utils/types";

export function useSourcedTaskMutations(source: TaskSource | null) {
  const mountId = source?.mountId;
  const canEdit = !source || source.role === "editor";
  const tasksTable = basic.useCollection("tasks", mountId ? { source: { mountId } } : undefined);

  const updateTask = useCallback((id: string, changes: TaskUpdate) => {
    if (!canEdit) {
      return;
    }

    void tasksTable.patch(id, changes);
  }, [canEdit, tasksTable]);

  const deleteTask = useCallback((id: string) => {
    if (!canEdit) {
      return;
    }

    void tasksTable.delete(id);
  }, [canEdit, tasksTable]);

  return {
    canEdit,
    deleteTask,
    isShared: Boolean(source),
    updateTask,
  };
}
