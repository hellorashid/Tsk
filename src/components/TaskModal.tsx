// @ts-nocheck

import { Task } from "../utils/types";

export const TaskModal = ({
  task, updateFunction,
}: {
  task: Task;
  updateFunction: any;
}) => {
  const handleEdit = (event) => {
    console.log(event.target.id, event.target.textContent);
    updateFunction(task.id, { [event.target.id]: event.target.textContent });
  };

  function getSimpleDateString(timestamp: EpochTimeStamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return (
    <>
      <form method="dialog" className="modal-box">
        <div className="task-details flex flex-col justify-between rounded-md ">
          <div className="task-id flex justify-between items-center w-full my-4">
            <input
              defaultChecked={task.done}
              onChange={() => {
                updateFunction(task.id, { done: !task.done });
              }}
              className="scale-140 checkbox checkbox-accent"
              type="checkbox" />
            <div className="flex">
              <p className="mr-2 text-slate-500">#{task.id}</p>
              <p className="font-bold ml-2 text-slate-600">
                {getSimpleDateString(task.date_created)}
              </p>
            </div>
          </div>
          <div className="border-t border-slate-700 border-solid w-full mb-4 rounded-md"></div>
          <h1
            contentEditable
            id="title"
            onBlur={handleEdit}
            className="text-start text-xl text-bold py-1 px-2"
          >
            {task.title}
          </h1>

          <p
            id="description"
            className="task-description mt-4 opacity-50 text-left py-1 px-2"
            contentEditable
            onBlur={handleEdit}
          >
            {task.description || "Some description..."}
          </p>
        </div>

        {/* <div className="modal-action footer text-right">
              <button className="my-2 mt-7 py-0.5 px-3 w-fit font-bold">
                Create
              </button>
            </div> */}
      </form>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </>
  );
};
