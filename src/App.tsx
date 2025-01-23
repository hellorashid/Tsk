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
import bgImage from '/bg2.jpg';


 function ExpandableInput() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitted:', inputValue)
    setInputValue('')
    setIsExpanded(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false)
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (formRef.current && !formRef.current.contains(e.relatedTarget as Node)) {
      setIsExpanded(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto mt-10">
      <form onSubmit={handleSubmit} ref={formRef} className="relative">
        <div 
          className={`
            relative overflow-hidden transition-all duration-300 ease-in-out
            border rounded-lg focus-within:ring-2 focus-within:ring-blue-500
            ${isExpanded ? 'h-[144px]' : 'h-12'}
          `}
        >
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Type something..."
            className={`
              w-full p-3 resize-none overflow-auto
              absolute top-0 left-0 right-0
              focus:outline-none bg-transparent
              ${isExpanded ? 'h-[108px]' : 'h-12'}
            `}
            style={{ transition: 'height 300ms ease-in-out' }}
          />
          <div 
            className={`
              absolute bottom-0 left-0 right-0
              bg-white dark:bg-gray-800 border-t
              transition-opacity duration-300 ease-in-out
              ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            <div className="flex justify-between items-center p-2">
              <div className="flex space-x-2">
                <button variant="ghost" size="icon" type="button">
                  {/* <Bold className="h-4 w-4" /> */}
                  <span className="sr-only">Bold</span>
                </button>
                <button variant="ghost" size="icon" type="button">
                  {/* <Italic className="h-4 w-4" /> */}
                  <span className="sr-only">Italic</span>
                </button>
                <button variant="ghost" size="icon" type="button">
                  {/* <Link className="h-4 w-4" /> */}
                  <span className="sr-only">Link</span>
                </button>
              </div>
              <button type="submit" size="sm">
                {/* <Send className="h-4 w-4 mr-2" /> */}
                Submit
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}




function Home() {
  const { db } = useBasic();

  const tasks = useQuery( () => db.collection("tasks").getAll())
  
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
    <section className="task-home p-2 w-screen h-screen lg:max-w-full relative" 
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      <div className="navbar bg-[#1F1B2F] rounded-md flex justify-between items-center">
        <div className="">
          <a className="btn btn-ghost normal-case text-xl"
            onClick={() => { window.modal_2.showModal(); }}
          ><img className="w-8 h-8 mr-2" src='tsk-logo.png'/>tsk.</a>
        </div>

        <div className="hidden md:block">  
          <form
            onSubmit={handleSubmit}
            className="join task-input flex justify-center rounded-full w-200 border border-base-200"
          >
            <input
              type="text"
              value={newInput}
              onChange={(e) => setNewInput(e.target.value)}
              placeholder="I want to..."
              className="join-item font-serif input w-full max-w-xs focus:outline-none"
              required
            />
            <button
              className="join-item submit btn font-bold text-slate-300 hover:text-slate-700"
              type="submit"
              onClick={handleSubmit}
            >Add</button>
          </form>
        </div>

        <div className="flex-">
          <UserAvatarButton />
        </div>
      </div>

      <div className="p-0 pb-24 md:pb-0">
        <div className="overflow-x-auto mt-10 flex justify-center">
          <div className="w-full max-w-4xl">
            {tasks?.length == 0 && <div>
              <p className="text-lg font-bold text-center text-slate-100">No tasks yet.</p>
              <p className="no-task-blurb text-sm font-serif text-center text-slate-100">which is <em>totally</em> fine. its okay to do nothing. you deserve a rest day.</p>
              <p className="no-task-blurb text-sm font-serif text-center text-slate-100">but also, you can add a task above.</p>
            </div>}

            <div className="flex flex-col ">
              {tasks?.map((task: Task) => (
                <div
                  key={task.id}
                  className="w-full p-1"
                  // onClick={() => {
                  //   window.modal_1.showModal();
                  //   setSelectedTask(task);
                  // }}
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

        <dialog id="modal_1" className="modal">
          <TaskModal
            key={selectedTask.id}
            task={selectedTask}
            new={false}
            updateFunction={updateTask}
          />
        </dialog>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-base-100 md:hidden">
        <form
          onSubmit={handleSubmit}
          className="join task-input flex justify-center rounded-full w-full border border-base-200"
        >
          <input
            type="text"
            value={newInput}
            onChange={(e) => setNewInput(e.target.value)}
            placeholder="I want to..."
            className="join-item font-serif input w-full focus:outline-none"
            required
          />
          <button
            className="join-item submit btn font-bold text-slate-300 hover:text-slate-700"
            type="submit"
            onClick={handleSubmit}
          >Add</button>
        </form>
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
