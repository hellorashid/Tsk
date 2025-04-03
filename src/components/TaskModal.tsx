// @ts-nocheck

import { Task } from "../utils/types";
import { useState, useEffect } from 'react';

export const TaskModal = ({
  task, updateFunction, inDrawer = false, deleteTask, new: isNew = false
}: {
  task: Task;
  updateFunction: any;
  inDrawer?: boolean;
  deleteTask?: any;
  new?: boolean;
}) => {
  // Log task for debugging
  useEffect(() => {
    console.log("TaskModal received task:", task);
  }, [task]);

  const [taskCompleted, setTaskCompleted] = useState(task?.completed || false);

  useEffect(() => {
    // Update the checkbox state whenever task changes
    setTaskCompleted(task?.completed || false);
  }, [task]);

  const handleDelete = (e) => {
    e.stopPropagation();
    console.log("delete button clicked");
    if (task?.id && deleteTask) {
      deleteTask(task.id);
    }
  };

  const handleEdit = (event) => {
    console.log("Editing field:", event.target.id, "New value:", event.target.textContent);
    if (task?.id) {
      updateFunction(task.id, { [event.target.id]: event.target.textContent });
    }
  };

  const resetField = (event) => {
    if (event.target.textContent === 'Some description...') {
      event.target.textContent = '';
    }
  }

  if (!task?.id) {
    return <div className="p-4 text-center">No task selected or task data is incomplete.</div>;
  }

  return (
    <>
      <div className={`${inDrawer ? "bg-base-100" : "modal-box bg-black"} p-4`}>
        <div className="task-details flex flex-col justify-between rounded-md">
          <div className="task-id flex justify-between items-center w-full my-4">
            <input
              type="checkbox"
              checked={taskCompleted}
              onChange={() => {
                const newState = !taskCompleted;
                setTaskCompleted(newState);
                if (task?.id) {
                  updateFunction(task.id, { 
                    completed: newState
                  });
                }
              }}
              className="scale-140 checkbox checkbox-accent"
            />
          </div>
          
          <div className="border-t border-slate-700 border-solid w-full mb-4 rounded-md text-white"></div>
          
          <h1
            contentEditable
            id="name"
            onBlur={handleEdit}
            className={`text-start text-xl text-bold py-1 px-2 text-white`}
          >
            {task?.name || ''}
          </h1>

          <p
            id="description"
            className={`task-description mt-4 opacity-70 text-left py-1 px-2 text-white`}
            contentEditable
            onFocus={resetField}         
            onBlur={handleEdit}
          >
            {task?.description || "Some description..."}
          </p>
        </div>
      </div>
      {!inDrawer && (
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      )}
    </>
  );
};
