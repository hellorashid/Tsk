// @ts-nocheck

import { Task } from "../utils/types";
import { useState } from 'react';

export const TaskModal = ({
  task, updateFunction
}: {
  task: Task;
  updateFunction: any;
}) => {
  const [labels, setLabels] = useState(task.labels);
  const [newLabel, setNewLabel] = useState("");

  const addLabel = (event) => {
      //cannot create a new line
      if (event.key === 'Enter') {
        event.preventDefault();
      }

      console.log(task);
      console.log(labels);
      console.log({newLabel});
      //adds onto the global array 


      setLabels([...labels, {value: newLabel}]);
    
      //adds to the task label list 

      updateFunction(task.id, { labels: [...task.labels, { value: newLabel }] });
      
      setNewLabel("");

  }

  const handleDelete = (e) => {
    e.stopPropagation();
    console.log("delete button clicked")
    deleteTask(task.id);
  };


  const handleEdit = (event) => {
    console.log(event.target.id, event.target.textContent);
    updateFunction(task.id, { [event.target.id]: event.target.textContent });
  };

  const resetField = (event) => {
    if (event.target.textContent === 'Some description...') {
      event.target.textContent = '';
    }
  }


  function getSimpleDateString(timestamp: EpochTimeStamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return (
    <>
      <form method="dialog" className="modal-box bg-black">
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
              {/* <p className="mr-2 text-slate-400">#{task.id}</p> */}
              <p className="font-bold ml-2 text-slate-500">
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
            onFocus={resetField}         
            onBlur={handleEdit}
          >
            {task.description || "Some description..."}
          </p>
        </div>
            

        <div className="flex justify-between items-center mt-5 ">
              <div className="flex justify-center items-center gap-2">
                
                { labels?.map((label) => {
                    return ( <button className="bg-slate-800 px-4 py-1 rounded-full text-sm">
                    <p>
                      {label.value}
                    </p>
                  </button>
                  )
                })}
               
                  
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
                    {/* {labels.map((label) => {
                      return (
                      <li className="text-base mb-1.5"><a>{label}</a></li>
                      );
                    })} */}
                    {/* <hr className="border-slate-700"/> */}

                    <div className="flex justify-evenly items-center">
                      {/* <p 
                      contentEditable 
                      className="border-2 border-slate-500 text-slate-500 rounded-sm text-left w-3/4 h-8 mt-2 px-2 pt-1 text-sm" 
                      onFocus={(event) => {
                        if (event.target.textContent === "work") {
                          event.target.textContent = "";
                        }
                      }}
                      
                      onKeyDown={addLabel}
                      >
                        {task.label || "work"}
                      </p> */}

                      <input 
                        className="border-2 bg-inherit border-slate-500 text-slate-500 rounded-sm text-left w-3/4 h-8 mt-2 px-2 text-sm"
                        type="text"
                        placeholder="e.g. personal, work"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        // onKeyDown={addLabel}

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
                {/* <button onClick={handleDelete} className="rounded-full btn btn-ghost btn-xs pb-7">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 opacity-30 hover:opacity-100">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button> */}
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
