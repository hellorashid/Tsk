// @ts-nocheck

import { Task } from "../utils/types";
import { useState, useEffect, useRef } from 'react';

export const TaskModal = ({
  task, updateFunction, inDrawer = false, deleteTask, new: isNew = false, accentColor = '#1F1B2F', onDelete
}: {
  task: Task;
  updateFunction: any;
  inDrawer?: boolean;
  deleteTask?: any;
  new?: boolean;
  accentColor?: string;
  onDelete?: () => void;
}) => {
  // Log task for debugging
  useEffect(() => {
    console.log("TaskModal received task:", task);
  }, [task]);

  const [taskCompleted, setTaskCompleted] = useState(task?.completed || false);
  const nameInputRef = useRef(null);
  
  // Focus the name input when creating a new task
  useEffect(() => {
    if (isNew && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isNew]);

  useEffect(() => {
    // Update the checkbox state whenever task changes
    setTaskCompleted(task?.completed || false);
  }, [task]);

  const handleDelete = (e) => {
    e.stopPropagation();
    console.log("delete button clicked");
    if (task?.id && deleteTask) {
      deleteTask(task.id);
      if (onDelete) {
        onDelete();
      }
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

  // Calculate background color without opacity
  const getBackgroundColor = () => {
    return accentColor; // No opacity
  };

  if (!task?.id) {
    return <div className="p-4 text-center">No task selected or task data is incomplete.</div>;
  }

  return (
    <>
      <div 
        className={`${inDrawer ? "text-white" : "modal-box bg-black"} p-4`}
        style={inDrawer ? { backgroundColor: getBackgroundColor() } : {}}
      >
        <div className="task-details flex flex-col justify-between rounded-md">
          <div className="task-id flex items-center w-full my-4 gap-3">
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
            
            <h1
              contentEditable
              id="name"
              ref={nameInputRef}
              onBlur={handleEdit}
              className={`flex-1 text-start text-xl text-bold py-1 px-2 text-white ${isNew ? 'empty-content' : ''}`}
              data-placeholder={isNew ? "Enter task name..." : ""}
            >
              {task?.name || ''}
            </h1>
            
            {isNew && (
              <div className="text-sm opacity-70">New Task</div>
            )}
          </div>
          
          <div className="border-t border-slate-700 border-solid w-full mb-4 rounded-md text-white"></div>
          
          <p
            id="description"
            className={`task-description mt-4 opacity-70 text-left py-1 px-2 text-white`}
            contentEditable
            onFocus={resetField}         
            onBlur={handleEdit}
          >
            {task?.description || "Some description..."}
          </p>
          
          {!isNew && deleteTask && (
            <div className="mt-auto pt-4 flex justify-end">
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-white focus:outline-none"
                aria-label="Delete task"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
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
