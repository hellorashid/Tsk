// @ts-nocheck

import { Task, Subtask } from "../utils/types";
import { useState, useEffect, useRef } from 'react';
import Checkbox from './Checkbox';
import SubtasksSection from './SubtasksSection';

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
  const [taskName, setTaskName] = useState(task?.name || '');
  const [taskDescription, setTaskDescription] = useState(task?.description || '');
  const nameInputRef = useRef(null);

  // Focus the name input when creating a new task
  useEffect(() => {
    if (isNew && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isNew]);

  useEffect(() => {
    // Update states whenever task changes
    setTaskCompleted(task?.completed || false);
    setTaskName(task?.name || '');
    setTaskDescription(task?.description || '');
  }, [task]);

  // Auto-resize textareas on initial render and when content changes
  useEffect(() => {
    const titleTextarea = document.querySelector('textarea.task-title') as HTMLTextAreaElement;
    if (titleTextarea) {
      titleTextarea.style.height = 'auto';
      titleTextarea.style.height = `${titleTextarea.scrollHeight}px`;
    }

    const descTextarea = document.querySelector('textarea.task-description') as HTMLTextAreaElement;
    if (descTextarea) {
      descTextarea.style.height = 'auto';
      descTextarea.style.height = `${descTextarea.scrollHeight}px`;
    }
  }, [taskName, taskDescription]);

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

  const handleTitleChange = (e) => {
    setTaskName(e.target.value);
    // Auto-resize the textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleDescriptionChange = (e) => {
    setTaskDescription(e.target.value);
    // Auto-resize the textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleTitleBlur = () => {
    if (taskName.trim() !== task?.name && task?.id) {
      updateFunction(task.id, { name: taskName.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if ((taskDescription.trim() !== task?.description) && task?.id) {
      updateFunction(task.id, { description: taskDescription.trim() || '' });
    }
  };

  const handleKeyDown = (e, type) => {
    if (e.key === 'Enter' && type === 'title') {
      handleTitleBlur();
      e.preventDefault();
    }
  };

  // Calculate background color without opacity
  const getBackgroundColor = () => {
    return accentColor; // No opacity
  };

  // Subtask handlers
  const generateSubtaskId = () => {
    return `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddSubtask = (text) => {
    const newSubtask = {
      id: generateSubtaskId(),
      text,
      completed: false
    };
    
    const currentSubtasks = task?.subtasks || [];
    const updatedSubtasks = [...currentSubtasks, newSubtask];
    if (task?.id) {
      updateFunction(task.id, { subtasks: updatedSubtasks });
    }
  };

  const handleUpdateSubtask = (subtaskId, changes) => {
    const currentSubtasks = task?.subtasks || [];
    const updatedSubtasks = currentSubtasks.map(subtask =>
      subtask.id === subtaskId ? { ...subtask, ...changes } : subtask
    );
    if (task?.id) {
      updateFunction(task.id, { subtasks: updatedSubtasks });
    }
  };

  const handleDeleteSubtask = (subtaskId) => {
    const currentSubtasks = task?.subtasks || [];
    const updatedSubtasks = currentSubtasks.filter(subtask => subtask.id !== subtaskId);
    if (task?.id) {
      updateFunction(task.id, { subtasks: updatedSubtasks });
    }
  };

  if (!task?.id) {
    return <div className="p-4 text-center">No task selected or task data is incomplete.</div>;
  }

  return (
    <>
      <div
        className={`${inDrawer ? "text-white" : "bg-black rounded-lg shadow-xl max-w-2xl w-full mx-4"} p-4`}
        style={inDrawer ? { backgroundColor: getBackgroundColor() } : {}}
      >
        <div className="task-details flex flex-col justify-between rounded-md">
          <div className="task-id flex items-start w-full my-4 gap-3">
            <div className="mt-2">

              <Checkbox
                id={task?.id}
                size="md"
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
              />
            </div>

            <textarea
              ref={nameInputRef}
              value={taskName}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => handleKeyDown(e, 'title')}
              className="task-title flex-1 text-start text-xl text-bold py-1 px-2 text-white bg-transparent resize-none overflow-hidden min-h-[2rem] focus:outline-none"
              placeholder={isNew ? "Enter task name..." : ""}
              rows={1}
              style={{ height: 'auto' }}
            />

            {isNew && (
              <div className="text-sm opacity-70">New Task</div>
            )}
          </div>

          <div className="border-t border-slate-700 border-solid w-full mb-4 rounded-md text-white"></div>

          <textarea
            value={taskDescription || ""}
            onChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            onKeyDown={(e) => handleKeyDown(e, 'description')}
            className="task-description mt-4 opacity-70 text-left py-1 px-2 text-white bg-transparent resize-none min-h-[100px] focus:outline-none"
            placeholder="Some description..."
            style={{ height: 'auto' }}
          />

          {/* Subtasks Section */}
          {!isNew && (
            <SubtasksSection
              subtasks={task?.subtasks || []}
              onAddSubtask={handleAddSubtask}
              onUpdateSubtask={handleUpdateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              isDarkMode={true}
            />
          )}

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
        <form method="dialog" className="absolute inset-0 -z-10 bg-black/50">
          <button>close</button>
        </form>
      )}
    </>
  );
};
