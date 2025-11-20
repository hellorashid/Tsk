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

export type Folder = {
  id: string;
  name: string;
  labels: string; // comma-separated labels to match against
};