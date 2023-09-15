import { useEffect, useState } from "react";

export async function filterTasks() {
  let all = await getTasks();
  // let tasks = all.tasks;
  const query = [{ key: "done", value: true }];
  const code = `return tasks.filter((task) => {
    return query.every((filter) => {
      const { key, value } = filter;
      return task[key] === value;
    });
  });`;

  const tasks = eval(code);
}

export async function getTasks(query = []) {
  let tsk = localStorage.getItem("tsk");

  if (!tsk) {
    console.log("localstorage not found - creating ...");
    tsk = { tasks: [], labels: [] };
    const str = JSON.stringify(tsk);
    console.log("saving", str);
    localStorage.setItem("tsk", str);
  } else {
    tsk = JSON.parse(tsk);
  }

  return tsk;
}

export async function addTask(task) {
  const newTask = {};

  if (typeof task === "string") {
    newTask.title = task;
  }

  const randomId = generateRandomId(6);
  newTask.date_created = Date.now();
  newTask.id = randomId;
  newTask.done = false;
  newTask.labels = []

  let currentTasks = await getTasks();

  currentTasks.tasks.push(newTask);

  localStorage.setItem("tsk", JSON.stringify(currentTasks));

  return newTask;
}

async function updateTaskStorage(id, changes) {
  // Fetch current tasks from localStorage
  const currentTasks = await getTasks();

  // Find the task by ID
  const taskIndex = currentTasks.tasks.findIndex((task) => task.id === id);

  // If task is found, apply the changes
  if (taskIndex !== -1) {
    currentTasks.tasks[taskIndex] = {
      ...currentTasks.tasks[taskIndex],
      ...changes,
    };

    // Save the updated tasks list to localStorage
    localStorage.setItem("tsk", JSON.stringify(currentTasks));
    return currentTasks.tasks[taskIndex]; // Return the updated task
  } else {
    throw new Error("Task not found.");
  }
}

async function deleteTaskFromStorage(id) {
  // Fetch current tasks from localStorage
  const currentTasks = await getTasks();

  // Filter out the task with the given ID
  const updatedTasks = currentTasks.tasks.filter((task) => task.id !== id);

  currentTasks.tasks = updatedTasks;

  // Save the updated tasks list to localStorage
  localStorage.setItem("tsk", JSON.stringify(currentTasks));
}

function generateRandomId(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomId = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomId += characters.charAt(randomIndex);
  }

  return randomId;
}

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [labels, setLabels] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks.tasks);
      setLoading(false);
    }

    fetchTasks();
  }, []);

  const addNewTask = async (task) => {
    const newTask = await addTask(task);
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const updateTask = async (id, changes) => {
    const updatedTask = await updateTaskStorage(id, changes);
    setTasks((prevTasks) => {
      return prevTasks.map((task) => (task.id === id ? updatedTask : task));
    });
  };

  const deleteTask = async (id) => {
    await deleteTaskFromStorage(id);
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  return {
    tasks,
    addTask: addNewTask,
    updateTask,
    deleteTask,
    loading,
  };
}
