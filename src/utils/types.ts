export type Label = {
  value: string,
  color: string,
}

export type Task = {
  id: string;
  title: string;
  description: string;
  date_created: EpochTimeStamp;
  done: boolean;
  labels: Label[];
};