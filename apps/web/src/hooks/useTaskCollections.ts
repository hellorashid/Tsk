import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect, useMemo } from "react";
import { Folder, Task } from "../utils/types";
import { ScheduleCardData } from "../utils/schedule";
import { getCompletedTasks, getFilteredTasks, getSuggestedTasks } from "../utils/taskCollections";

interface UseTaskCollectionsOptions {
  activeFolder: string | null;
  folders: Folder[];
  tasks: Task[];
  scheduleEvents: ScheduleCardData[];
  isCollectionsLoading: boolean;
  hasSuggestedInitializedRef: MutableRefObject<boolean>;
  setSuggestedTasksExpanded: Dispatch<SetStateAction<boolean>>;
}

export function useTaskCollections({
  activeFolder,
  folders,
  tasks,
  scheduleEvents,
  isCollectionsLoading,
  hasSuggestedInitializedRef,
  setSuggestedTasksExpanded,
}: UseTaskCollectionsOptions) {
  const filteredTasks = useMemo(
    () => getFilteredTasks({ tasks, activeFolder, scheduleEvents, folders }),
    [tasks, activeFolder, scheduleEvents, folders],
  );

  const suggestedTasks = useMemo(
    () => getSuggestedTasks({ tasks, activeFolder, scheduleEvents }),
    [tasks, activeFolder, scheduleEvents],
  );

  const completedTasks = useMemo(
    () => getCompletedTasks({ tasks, activeFolder, scheduleEvents, folders }),
    [tasks, activeFolder, scheduleEvents, folders],
  );

  useEffect(() => {
    if (isCollectionsLoading) {
      return;
    }

    if (!hasSuggestedInitializedRef.current && activeFolder === "today") {
      hasSuggestedInitializedRef.current = true;
      if (filteredTasks.length === 0) {
        setSuggestedTasksExpanded(true);
      }
    }
  }, [activeFolder, filteredTasks.length, hasSuggestedInitializedRef, isCollectionsLoading, setSuggestedTasksExpanded]);

  return {
    completedTasks,
    filteredTasks,
    suggestedTasks,
  };
}
