import type { BasicRecord } from "@basictech/core";
import type { ScheduleCardData } from "./schedule";
import type { Folder, Task } from "./types";

export function unwrapRecord<T extends object>(
  record: BasicRecord<T> | null | undefined,
): (T & { id: string }) | null {
  if (!record?.value) {
    return null;
  }

  return { id: record.id, ...record.value };
}

export function unwrapRecords<T extends object>(
  records: Array<BasicRecord<T>>,
): Array<T & { id: string }> {
  return records.flatMap((record) => {
    const item = unwrapRecord(record);
    return item ? [item] : [];
  });
}

type RecordLike<T extends object> = {
  id: string;
  value: T | null;
};

export function unwrapTask(record: RecordLike<object> | null | undefined): Task | null {
  return unwrapRecord(record as BasicRecord<object> | null | undefined) as Task | null;
}

export function unwrapTasks(records: Array<RecordLike<object>>): Task[] {
  return unwrapRecords(records as Array<BasicRecord<object>>) as Task[];
}

export function unwrapFolder(record: RecordLike<object> | null | undefined): Folder | null {
  return unwrapRecord(record as BasicRecord<object> | null | undefined) as Folder | null;
}

export function unwrapFolders(records: Array<RecordLike<object>>): Folder[] {
  return unwrapRecords(records as Array<BasicRecord<object>>) as Folder[];
}

export function unwrapScheduleEvent(
  record: RecordLike<object> | null | undefined,
): ScheduleCardData | null {
  return unwrapRecord(record as BasicRecord<object> | null | undefined) as ScheduleCardData | null;
}

export function unwrapScheduleEvents(
  records: Array<RecordLike<object>>,
): ScheduleCardData[] {
  return unwrapRecords(records as Array<BasicRecord<object>>) as ScheduleCardData[];
}
