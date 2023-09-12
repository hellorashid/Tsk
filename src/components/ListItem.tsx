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
              <div className="font-bold">{task.title}</div>
            </div>
          </div>
        </td>
      </div>

      <div>
        <td>
          <span className="badge badge-ghost badge-md">work</span>
        </td>

        <th className=" ">
          <button onClick={handleDelete} className="btn btn-ghost btn-xs pb-5">
            delete
          </button>
        </th>
      </div>
    </tr>
  );
};
