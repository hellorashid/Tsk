// @ts-nocheck
import { useState, useEffect } from "react";
import * as db from "./utils/db";
import "./App.css";
import { AboutModal } from "./components/AboutModal";
import { TaskModal } from "./components/TaskModal";
import { ListItem } from "./components/ListItem";
import { Task } from "./utils/types";

import UserAvatarButton from "./components/UserAvatarButton";

import { useBasic, useQuery } from "@basictech/react";

function Home() {
  const { db } = useBasic();

  const tasks = useQuery( () => db.collection("tasks").getAll())
  

  // const { tasks, addTask, deleteTask, updateTask, loading } = () =>{}
  const [selectedTask, setSelectedTask] = useState({});
  const [newInput, setNewInput] = useState("");

  const debuggeroo = async () => {
    console.log(tasks);

    // console.log(authState.user, authState.isAuthenticated);

  };



  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("hi :) :)", newInput);
    if (newInput.trim() === "") {
      // Check if the input is empty or contains only whitespace
      alert('Please fill out this field');
      return;
    }
    
    db.collection("tasks").add({
      name: newInput,
      completed: false,
      description: "",
    });

    setNewInput("");
  };

  const updateTask = (taskId: string, changes: any) => {
    db.collection("tasks").update(taskId, changes);
  }

  const deleteTask = (taskId: string) => {
    db.collection("tasks").delete(taskId);
  }

  return (
    <section className="task-home p-2 bg-grey-900 w-screen h-screen lg:max-w-full">
      <div className="navbar bg-base-100 rounded-md">
        <div className="flex-1">
          <a className="btn btn-ghost normal-case text-xl"
            onClick={() => { window.modal_2.showModal(); }}
          ><img className="w-8 h-8 mr-2" src='tsk-logo.png'/>tsk.</a>
        </div>
        <div className="flex-none">
          <button onClick={debuggeroo} className="btn btn-square btn-ghost">
            🦄
          </button>
          <UserAvatarButton />
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

      <div className="p-0 ">
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
          <div className="w-full max-w-4xl">
            {tasks?.length == 0 && <div>
              <p className="text-lg font-bold text-center text-slate-100">No tasks yet.</p>
              <p className="no-task-blurb text-sm font-serif text-center text-slate-100">which is <em>totally</em> fine. its okay to do nothing. you deserve a rest day.</p>
              <p className="no-task-blurb text-sm font-serif text-center text-slate-100">but also, you can add a task above.</p>
            </div>}

            <div className="flex flex-col gap-4">
              {tasks?.map((task: Task) => (
                <div
                  key={task.id}
                  className="w-full p-1"
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
                </div>
              ))}
            </div>
          </div>
        </div>



        <dialog id="modal_2" className="modal">
          <AboutModal />
        </dialog>

        {/* <dialog id="modal_1" className="modal">
          <TaskModal
            key={selectedTask.id}
            task={selectedTask}
            new={false}
            updateFunction={updateTask}
          />
        </dialog> */}
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="App">
      <Home />
    </div>
  );
}

export default App;
