import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import logo from "./logo.png";

function ToDoList() {
  // Load tasks from local storage on initial render
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [newTask, setNewTask] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDetails, setEditDetails] = useState({
    text: "",
    time: "",
    notes: "",
    status: "white",
    isPriority: false,
    taskType: "personal"
  });
  const [showCalendar, setShowCalendar] = useState(false);

  // Save tasks to local storage whenever tasks change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  function handleInputChange(event) {
    setNewTask(event.target.value);
  }

  function addTask() {
    if (newTask.trim() !== "") {
      setTasks(t => [...t, {
        text: newTask,
        time: "",
        notes: "",
        status: "white",
        isPriority: false,
        taskType: "personal"
      }]);
      setNewTask("");
    }
  }

  function deleteTask(index) {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  }

  function deleteAllTasks() {
    setTasks([]);
  }

  function markAllDone() {
    setTasks(tasks.map(task => ({ ...task, status: "green" })));
  }

  function moveTaskUp(index) {
    if (index > 0) {
      const updatedTasks = [...tasks];
      [updatedTasks[index], updatedTasks[index - 1]] =
        [updatedTasks[index - 1], updatedTasks[index]];
      setTasks(updatedTasks);
    }
  }

  function moveTaskDown(index) {
    if (index < tasks.length - 1) {
      const updatedTasks = [...tasks];
      [updatedTasks[index], updatedTasks[index + 1]] =
        [updatedTasks[index + 1], updatedTasks[index]];
      setTasks(updatedTasks);
    }
  }

  function togglePriority(index) {
    const updatedTasks = [...tasks];
    updatedTasks[index] = {
      ...updatedTasks[index],
      isPriority: !updatedTasks[index].isPriority
    };
    setTasks(updatedTasks);
  }

  function startEditing(index) {
    setEditingIndex(index);
    setEditDetails({
      text: tasks[index].text || "",
      time: tasks[index].time || "",
      notes: tasks[index].notes || "",
      status: tasks[index].status || "white",
      isPriority: tasks[index].isPriority || false,
      taskType: tasks[index].taskType || "personal"
    });
  }

  function saveDetails(index) {
    const updatedTasks = [...tasks];
    updatedTasks[index] = {
      ...updatedTasks[index],
      text: editDetails.text,
      time: editDetails.time,
      notes: editDetails.notes,
      status: editDetails.status,
      isPriority: editDetails.isPriority,
      taskType: editDetails.taskType
    };
    setTasks(updatedTasks);
    setEditingIndex(null);
  }

  function toggleStatus(index) {
    const updatedTasks = [...tasks];
    const currentStatus = updatedTasks[index].status;
    const statusCycle = {
      'white': 'green',
      'green': 'red',
      'red': 'white'
    };
    updatedTasks[index].status = statusCycle[currentStatus];
    setTasks(updatedTasks);
  }

  const priorityTasks = tasks.filter(task => task.isPriority);
  const regularTasks = tasks.filter(task => !task.isPriority);

  const renderTask = (task, index) => (
    <li key={index}>
      <div
        className="status-box"
        style={{ backgroundColor: task.status }}
        onClick={() => toggleStatus(tasks.indexOf(task))}
      ></div>
      <button
        className={`priority-pin ${task.isPriority ? 'pinned' : ''}`}
        onClick={() => togglePriority(tasks.indexOf(task))}
        title={task.isPriority ? "Unpin from priority" : "Pin as priority"}
      >
        📌
      </button>
      <span className={`text ${task.status === 'green' ? 'strikethrough' : ''}`}>
        {task.text}
        {task.time && <div className="task-time">{new Date(task.time).toLocaleString()}</div>}
        {task.notes && <div className="task-notes">{task.notes}</div>}
        <div className="task-type">
          {task.taskType === "personal" ? "Personal Task" : "Academic Task"}
        </div>
      </span>
      {editingIndex === tasks.indexOf(task) ? (
        <div className="edit-panel">
          <input
            type="text"
            placeholder="Task Title"
            value={editDetails.text}
            onChange={(e) => setEditDetails({ ...editDetails, text: e.target.value })}
          />
          <input
            type="datetime-local"
            value={editDetails.time}
            onChange={(e) => setEditDetails({ ...editDetails, time: e.target.value })}
          />
          <textarea
            placeholder="Notes"
            value={editDetails.notes}
            onChange={(e) => setEditDetails({ ...editDetails, notes: e.target.value })}
          />
          <label className="priority-checkbox">
            <input
              type="checkbox"
              checked={editDetails.isPriority}
              onChange={(e) => setEditDetails({ ...editDetails, isPriority: e.target.checked })}
            />
            Priority Task
          </label>
          <div className="task-type-select">
            <label>
              <input
                type="radio"
                name="taskType"
                value="personal"
                checked={editDetails.taskType === "personal"}
                onChange={(e) => setEditDetails({ ...editDetails, taskType: e.target.value })}
              />
              Personal Task
            </label>
            <label>
              <input
                type="radio"
                name="taskType"
                value="academic"
                checked={editDetails.taskType === "academic"}
                onChange={(e) => setEditDetails({ ...editDetails, taskType: e.target.value })}
              />
              Academic Task
            </label>
          </div>
          <button className="save-button" onClick={() => saveDetails(tasks.indexOf(task))}>
            Save
          </button>
        </div>
      ) : (
        <>
          <button className="edit-button" onClick={() => startEditing(tasks.indexOf(task))}>
            Edit
          </button>
          <button className="delete-button" onClick={() => deleteTask(tasks.indexOf(task))}>
            Delete
          </button>
          <button className="move-button" onClick={() => moveTaskUp(tasks.indexOf(task))}>
            Move Up
          </button>
          <button className="move-button" onClick={() => moveTaskDown(tasks.indexOf(task))}>
            Move Down
          </button>
        </>
      )}
    </li>
  );

  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.time) {
      const date = new Date(task.time).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
    }
    return acc;
  }, {});

  return (
    <div className="to-do-list">
      
        <h1>TASKS</h1>
      

      <div>
        <input
          type="text"
          placeholder="Add new task"
          value={newTask}
          onChange={handleInputChange} 
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <button className="add-button" onClick={addTask}>Add</button>
        <button className="delete-all-button" onClick={deleteAllTasks}>Delete All</button>
        <button className="done-all-button" onClick={markAllDone}>Done All</button>
        <button className="calendar-toggle-button" onClick={() => setShowCalendar(!showCalendar)}>
          {showCalendar ? "Hide Calendar" : "Show Calendar"}
        </button>
      </div>

      {showCalendar ? (
        <div className="calendar-view">
          <Calendar
            tileContent={({ date, view }) => {
              if (view === 'month') {
                const dateString = date.toDateString();
                const tasksForDate = tasksByDate[dateString] || [];
                return (
                  <div>
                    {tasksForDate.map((task, index) => (
                      <div
                        key={index}
                        className={`calendar-task ${task.taskType === "personal" ? "personal-task" : "academic-task"} ${task.status === 'green' ? 'strikethrough' : ''}`}
                      >
                        {task.text}
                      </div>
                    ))}
                  </div>
                );
              }
            }}
          />
        </div>
      ) : (
        <div className="tasks-container">
          {priorityTasks.length > 0 && (
            <div className="priority-section">
              <h2>Priority</h2>
              <ol>
                {priorityTasks.map((task, index) => renderTask(task, `priority-${index}`))}
              </ol>
            </div>
          )}
          
          {regularTasks.length > 0 && (
            <div className="regular-section">
              {priorityTasks.length > 0 && <h2>Other Tasks</h2>}
              <ol>
                {regularTasks.map((task, index) => renderTask(task, `regular-${index}`))}
              </ol>
            </div>
          )}
        </div>
      )}
      <footer>
    <img src={logo} alt="Company Logo" className="logo" />
  </footer>
    </div>
  );
}

export default ToDoList;