// @ts-nocheck
import { useState } from "react";
import * as db from "./utils/db";
import "./App.css";

type Task = {
  id: string;
  title: string;
  description: string;
  date_created: EpochTimeStamp;
  done: boolean;
};

const ListItem = ({
  task,
  deleteTask,
  updateTask,
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
            onClick={handleDone}
          />
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

function Home() {
  console.log("Home");
  const { tasks, addTask, deleteTask, updateTask, loading } = db.useTasks();
  const [selectedTask, setSelectedTask] = useState({});
  const [newInput, setNewInput] = useState("");

  const debuggeroo = async () => {
    console.log(tasks);
    const f = await db.filterTasks();
    console.log(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("hi :) :)", newInput);
    addTask(newInput);
    if (newInput.trim() === "") {
      // Check if the input is empty or contains only whitespace
      alert('Please fill out this field');
      return;
    }
    setNewInput("");
  };

  return (
    <section className="task-home p-2 bg-grey-900 w-screen h-screen lg:max-w-full">
      <div className="navbar bg-base-100 rounded-md">
        <div className="flex-1">
          <a className="btn btn-ghost normal-case text-xl">tsk.</a>
        </div>
        <div className="flex-none">
          <button onClick={debuggeroo} className="btn btn-square btn-ghost">
            🦄
          </button>
        </div>
      </div>

      {/* <div>
        <input
          type="text"
          value={newInput}
          onChange={(e) => setNewInput(e.target.value)}
          placeholder="Query string..."
          className="join-item input input-bordered w-full max-w-xs"
        />{" "}
      </div> */}

      <div className="p-4">
        <form
          onSubmit={handleSubmit}
          className="mt-10 join task-input flex justify-center"
        >
          <input
            type="text"
            value={newInput}
            onChange={(e) => setNewInput(e.target.value)}
            placeholder="I want to..."
            className="join-item input input-bordered w-full max-w-xs"
            required
          />
          <input
            className="join-item submit btn bg-violet-600 font-bold text-slate-300 hover:bg-violet-400 hover:text-slate-700"
            type="submit"
            onClick={handleSubmit}
          />
        </form>

        <div className="overflow-x-auto mt-10 flex justify-center">
          <table className="table w-2/3">
            <tbody>
              {tasks.map((task: Task) => {
                if (task.title.trim() === "") {
                  return null;
                }
                
                return (
                  <button
                    key={task.id}
                    className="w-full mb-4 p-1"
                    onClick={() => {
                      window.modal_1.showModal();
                      setSelectedTask(task);
                    }}
                  >
                    <ListItem 
                      key={task.id}
                      task={task}
                      deleteTask={deleteTask}
                      updateTask={updateTask}
                    />
                  </button>
                );
              })}
            </tbody>
          </table>
        </div>

        <h1 className="pt-20"> </h1>

        <dialog id="modal_1" className="modal">
          <TaskModal
            key={selectedTask.id}
            task={selectedTask}
            new={false}
            updateFunction={updateTask}
          />
        </dialog>
      </div>
    </section>
  );
}

const TaskModal = ({
  task,
  updateFunction,
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
              type="checkbox"
            />
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
            className="text-start text-xl text-bold"
          >
            {task.title}
          </h1>

          <p
            id="description"
            className="mt-4 opacity-50 text-left"
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

function App() {
  return (
    <div className="App">
      <Home />
    </div>
  );
}

export default App;
