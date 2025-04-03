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

  const [labels, setLabels] = useState(task?.labels || []);
  const [newLabel, setNewLabel] = useState("");
  const [taskCompleted, setTaskCompleted] = useState(task?.completed || task?.done || false);

  useEffect(() => {
    if (task?.labels) {
      setLabels(task.labels);
    }
    // Update the checkbox state whenever task changes
    setTaskCompleted(task?.completed || task?.done || false);
  }, [task]);

  const addLabel = (event) => {
      //cannot create a new line
      if (event.key === 'Enter') {
        event.preventDefault();
      }

      console.log(task);
      console.log(labels);
      console.log({newLabel});
      //adds onto the global array 

      if (!newLabel.trim()) return;

      setLabels([...labels, {value: newLabel}]);
    
      //adds to the task label list 
      if (task?.id) {
        updateFunction(task.id, { labels: [...(task.labels || []), { value: newLabel }] });
      }
      
      setNewLabel("");
  }

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


  function getSimpleDateString(timestamp: EpochTimeStamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
                    completed: newState,
                    done: newState 
                  });
                }
              }}
              className="scale-140 checkbox checkbox-accent"
            />
            <div className="flex">
              <p className="font-bold ml-2 text-slate-500">
                {getSimpleDateString(task?.date_created)}
              </p>
            </div>
          </div>
          
          <div className="border-t border-slate-700 border-solid w-full mb-4 rounded-md"></div>
          
          <h1
            contentEditable
            id="title"
            onBlur={handleEdit}
            className={`text-start text-xl text-bold py-1 px-2 ${inDrawer ? "text-black" : ""}`}
          >
            {task?.title || task?.name || ''}
          </h1>

          <p
            id="description"
            className={`task-description mt-4 opacity-70 text-left py-1 px-2 ${inDrawer ? "text-black" : ""}`}
            contentEditable
            onFocus={resetField}         
            onBlur={handleEdit}
          >
            {task?.description || "Some description..."}
          </p>
        </div>
        
        {/* Labels section */}
        <div className="flex justify-between items-center mt-5">
          <div className="flex flex-wrap justify-center items-center gap-2">
            {labels?.map((label, index) => (
              <button 
                key={index} 
                className={`px-4 py-1 rounded-full text-sm ${inDrawer ? "bg-slate-300 text-black" : "bg-slate-800 text-white"}`}
              >
                <p>{label.value}</p>
              </button>
            ))}
            
            {/* Add label button */}
            <div className="dropdown dropdown-top">
              <label tabIndex={0} className="btn btn-sm m-1 bg-slate-800 rounded-full p-0 hover:border-2 hover:border-indigo-700">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-7 h-7 px-1.5 py-0"
                  onClick={() => { window.modal_3.showModal(); }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </label>
              <ul tabIndex={0} className="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52">
                <div className="flex justify-evenly items-center">

                  <input 
                    className="border-2 bg-inherit border-slate-500 text-slate-500 rounded-sm text-left w-3/4 h-8 mt-2 px-2 text-sm"
                    type="text"
                    placeholder="e.g. personal, work"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />

                  <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  onClick={addLabel}
                  className="w-7 h-7 px-1.5 py-0 bg-slate-700 rounded-md mt-2 hover:cursor-pointer hover:bg-indigo-700"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              </ul>
            </div>
          </div>
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
