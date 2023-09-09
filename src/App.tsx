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
    <tr>
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
        <div className="flex items-center space-x-3">
          <div>
            <div className="font-bold">{task.title}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="badge badge-ghost badge-md">work</span>
      </td>
      <th className=" ">
        <button onClick={handleDelete} className="btn btn-ghost btn-xs pb-6">
          delete
        </button>
      </th>
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
    setNewInput("");
  };

  return (
    <section className="task-home w-screen p-2 bg-grey-900 h-screen">
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

      <div>
        <input
          type="text"
          value={newInput}
          onChange={(e) => setNewInput(e.target.value)}
          placeholder="Query string..."
          className="join-item input input-bordered w-full max-w-xs"
        />{" "}
      </div>

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
          />
          <input
            className="join-item submit btn bg-violet-600 font-bold "
            type="submit"
            onClick={handleSubmit}
          />
        </form>

        <div className="overflow-x-auto mt-4">
          {/* wasssszzzuupp yoooo i tried something now theres so many red lines oop */}
          {/* thats ok its just missing a key */}
          {/* ohhh mkay bet it made the buttons look weird tho but
            maybe we remove the btn class? we can still add the Onclick on the div
            gotcha
            bro i clicked on ur picture and now everything follows ur cursor LMAO
            so cool, u can click again to unfollow
            ouhh
            i just okay i forgot what i was gonna say oop 
            oop
            oop
            LMAO 
            whiat h sahove lakdjla pls
            what should i work on?
            uhmmm, edit-ability ? i can make sure that the dialog pop up is smooth sailing and
            retain as much of the design initially as possible 
            i got a meeting in like 9 mins so ill be back 
            okbet gl with meeting
            ok bet
            why u so cool pls
            ayo
          */}
          <table className="table">
            <tbody>
              {tasks.map((task: Task) => {
                return (
                  <button
                    key={task.id}
                    className="w-full mb-4 p-1"
                    onClick={() => {
                      window.modal_1.showModal();
                      setSelectedTask(task);
                    }}
                  >
                    <ListItem // ok pro coder lmao pls i wanna make it look better now
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
