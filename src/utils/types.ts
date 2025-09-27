export type Label = {
  value: string,
  color: string,
}

export type Subtask = {
  id: string;
  text: string;
  completed: boolean;
};

export type Task = {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  subtasks?: Subtask[];
};