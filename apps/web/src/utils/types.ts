export type Label = {
  value: string,
  color: string,
}

export type Task = {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  parentTaskId?: string;
  labels?: string; // comma-separated labels including folder:folderName
};

export type TaskUpdate = Partial<Pick<Task, "name" | "description" | "completed" | "parentTaskId" | "labels">>;

export type Folder = {
  id: string;
  name: string;
  labels: string; // comma-separated labels to match against
  color?: string; // optional color for the folder
};

export type FolderUpdate = Pick<Folder, "name" | "labels" | "color">;
