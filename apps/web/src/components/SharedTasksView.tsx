import { useMemo } from "react";
import { basic } from "../basic";
import { useOpenedMounts } from "../hooks/useOpenedMounts";
import { unwrapTasks } from "../utils/basicRecords";
import { shortDid } from "../utils/shares";
import type { Task, TaskSource, TaskUpdate } from "../utils/types";
import ListItem from "./ListItem";

interface SharedTasksViewProps {
  viewMode: "compact" | "cozy" | "chonky";
  isMobile: boolean;
  isDarkMode: boolean;
  selectedTaskId?: string | null;
  selectedMountId?: string | null;
  onTaskSelect: (task: Task, source: TaskSource) => void;
}

export default function SharedTasksView({
  viewMode,
  isMobile,
  isDarkMode,
  selectedTaskId,
  selectedMountId,
  onTaskSelect,
}: SharedTasksViewProps) {
  const { isReady, isSignedIn, isLoading, error, mounts, manageUrl } = useOpenedMounts();
  const { signIn } = basic.useAuth();

  if (!isReady || isLoading) {
    return (
      <div className="task-loading-state" aria-live="polite" aria-busy="true">
        <div className="task-loading-spinner" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="text-center">
        <p className={`text-lg font-bold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
          Sign in to see shared tasks
        </p>
        <p className={`no-task-blurb text-sm font-serif mt-2 ${isDarkMode ? "text-slate-100" : "text-gray-700"}`}>
          Friends can share individual tasks with you through Basic.
        </p>
        <button
          type="button"
          onClick={() => { void signIn(); }}
          className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
        >
          Login with Basic
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <p className={`text-center text-sm ${isDarkMode ? "text-slate-100" : "text-gray-700"}`}>
        Could not load shared tasks.
      </p>
    );
  }

  if (mounts.length === 0) {
    return (
      <div className="text-center">
        <p className={`text-lg font-bold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
          Nothing shared with you yet
        </p>
        <p className={`no-task-blurb text-sm font-serif mt-2 ${isDarkMode ? "text-slate-100" : "text-gray-700"}`}>
          Accept invites in Basic ID, then they’ll show up here.
        </p>
        <button
          type="button"
          onClick={() => { window.location.assign(manageUrl); }}
          className="mt-4 text-sm underline opacity-80 hover:opacity-100"
        >
          Manage shares
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${viewMode === "compact" ? "space-y-4" : "space-y-6"}`}>
      {mounts.map((mount) => (
        <SharedMountTaskList
          key={mount.id}
          mountId={mount.id}
          role={mount.role}
          originOwnerDid={mount.originOwnerDid}
          viewMode={viewMode}
          isMobile={isMobile}
          isDarkMode={isDarkMode}
          selectedTaskId={selectedMountId === mount.id ? selectedTaskId : null}
          onTaskSelect={onTaskSelect}
        />
      ))}
    </div>
  );
}

function SharedMountTaskList({
  mountId,
  role,
  originOwnerDid,
  viewMode,
  isMobile,
  isDarkMode,
  selectedTaskId,
  onTaskSelect,
}: {
  mountId: string;
  role: "viewer" | "editor";
  originOwnerDid: string;
  viewMode: "compact" | "cozy" | "chonky";
  isMobile: boolean;
  isDarkMode: boolean;
  selectedTaskId?: string | null;
  onTaskSelect: (task: Task, source: TaskSource) => void;
}) {
  const { data, isLoading, error } = basic.useQuery("tasks", undefined, { source: { mountId } });
  const tasksTable = basic.useCollection("tasks", { source: { mountId } });
  const tasks = useMemo(
    () => unwrapTasks(data).filter((task) => !task.parentTaskId),
    [data],
  );

  const updateTask = (id: string, changes: TaskUpdate) => {
    if (role !== "editor") {
      return;
    }

    void tasksTable.patch(id, changes);
  };

  const deleteTask = (id: string) => {
    if (role !== "editor") {
      return;
    }

    void tasksTable.delete(id);
  };

  const handleTaskSelect = (task: Task) => {
    onTaskSelect(task, { mountId, role });
  };

  if (isLoading) {
    return <p className="text-sm opacity-60">Loading shared tasks…</p>;
  }

  if (error || tasks.length === 0) {
    return null;
  }

  return (
    <div>
      <p className={`text-xs uppercase tracking-wider mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
        From {shortDid(originOwnerDid)} · {role}
      </p>
      <div className={`flex flex-col ${viewMode === "compact" ? "space-y-0" : viewMode === "cozy" ? "space-y-1" : "space-y-2"}`}>
        {tasks.map((task) => (
          <ListItem
            key={`${mountId}:${task.id}`}
            task={task}
            updateTask={updateTask}
            deleteTask={deleteTask}
            handleTaskSelect={handleTaskSelect}
            isSelected={selectedTaskId === task.id}
            viewMode={viewMode}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
}
