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
};