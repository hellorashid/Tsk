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
    // divs & some other elements can also have an OnClick(), see below
    <tr className="flex items-center justify-between">
      <div>
        <th>
          <label>
            <input
              type="checkbox"
              className="checkbox"
              checked={task.done}
              onChange={() => updateTask(task.id, { done: !task.done })}
              onClick={handleDone} />
          </label>
        </th>
        <td>
          <div className="flex items-center space-x-3 pb-1">
            <div>
              <div className="font-bold text-base">{task.title}</div>
            </div>
          </div>
        </td>
      </div>

      <div>
        <td>
        { task?.labels?.map((label) => (
            <span className="badge badge-ghost badge-md text-sm bg-slate-800 py-1">{label.value}</span>
            ))  
          }
          </td>


        <th className="">
          <button onClick={handleDelete} className="rounded-full btn btn-ghost btn-xs pb-7">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 opacity-30 hover:opacity-100">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </th>
      </div>
    </tr>
  );
};
