import { useMemo } from "react";
import { basic } from "../basic";
import { unwrapFolders, unwrapScheduleEvents, unwrapTasks } from "../utils/basicRecords";
import type { Task } from "../utils/types";
import type { ScheduleCardData } from "../utils/schedule";

export function useTaskRecords() {
  const { data, isLoading, error } = basic.useQuery("tasks");
  const tasks = useMemo(() => unwrapTasks(data), [data]);
  return { tasks, isLoading, error };
}

export function useScheduleRecords(taskId?: string | null) {
  const { data, isLoading, error } = basic.useQuery(
    "schedule",
    taskId ? { where: { taskId } } : undefined,
  );
  const events = useMemo(() => unwrapScheduleEvents(data), [data]);
  return { events, isLoading, error };
}

export function useFolderRecords() {
  const { data, isLoading, error } = basic.useQuery("filters");
  const folders = useMemo(() => unwrapFolders(data), [data]);
  return { folders, isLoading, error };
}

export function useTaskRecord(id: string | null | undefined, mountId?: string | null): Task | null {
  const { data } = basic.useQuery(
    "tasks",
    undefined,
    mountId ? { source: { mountId } } : undefined,
  );
  const tasks = useMemo(() => unwrapTasks(data), [data]);
  return useMemo(() => (id ? tasks.find((task) => task.id === id) ?? null : null), [id, tasks]);
}

export function useScheduleRecord(id: string | null | undefined): ScheduleCardData | null {
  const { events } = useScheduleRecords();
  return useMemo(() => (id ? events.find((event) => event.id === id) ?? null : null), [events, id]);
}

export function useSubtaskRecords(parentTaskId: string | null | undefined, mountId?: string | null): Task[] {
  const { data } = basic.useQuery(
    "tasks",
    {
      where: { parentTaskId: parentTaskId ?? "" },
    },
    mountId ? { source: { mountId } } : undefined,
  );

  return useMemo(
    () => (parentTaskId ? unwrapTasks(data) : []),
    [data, parentTaskId],
  );
}

