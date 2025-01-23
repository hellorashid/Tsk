// @ts-nocheck

import { Task } from "../utils/types";

export const ListItem = ({
  task, deleteTask, updateTask,
}: {
  task: Task;
  deleteTask: any;
  updateTask: any;
  handleClick: any;
}) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  const handleDone = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="group flex items-center justify-between p-3 gap-1 cursor-pointer bg-base-100 rounded-lg transition-all duration-200 ease-in-out bg-opacity-70 hover:bg-opacity-100 hover:scale-[1.01]">
      <div className="flex items-center gap-2">
        <div className="pr-3">
          <input
            type="checkbox"
            className="checkbox"
            checked={task.completed}
            onChange={() => updateTask(task.id, { completed: !task.completed })}
            onClick={handleDone}
          />
        </div>
        <div className="flex items-center space-x-3">
          <div className="font-bold text-base">{task.name}</div>
        </div>
        <div className="flex gap-1">
          {task?.labels?.map((label) => (
            <span className="badge badge-ghost badge-md text-sm bg-slate-800 py-1">
              {label.value}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={handleDelete}
        className="rounded-full btn btn-ghost btn-xs pb-7 opacity-0 group-hover:opacity-70 transition-opacity duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </button>
    </div>
  );
};
