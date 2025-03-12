import React, { useState, useEffect } from 'react';
import { put } from '@vercel/blob';

function ToDoList() {
  // State for folders
  const [folders, setFolders] = useState(() => {
    const savedFolders = localStorage.getItem('folders');
    return savedFolders ? JSON.parse(savedFolders) : [
      { id: 1, name: "2025", tasks: [] },
      { id: 2, name: "2024", tasks: [] }
    ];
  });
  
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isRenamingFolder, setIsRenamingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderView, setShowFolderView] = useState(true);
  
  // Task-related states
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDetails, setEditDetails] = useState({
    text: "",
    time: "",
    notes: "",
    status: "white",
    media: [] // New field for storing media URLs
  });
  
  // Media upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Save folders to local storage
  useEffect(() => {
    localStorage.setItem('folders', JSON.stringify(folders));
  }, [folders]);

  // Select a folder and load its tasks
  function selectFolder(folder) {
    setSelectedFolder(folder);
    setTasks(folder.tasks || []);
    setShowFolderView(false);
  }

  // Go back to folder view
  function goBackToFolders() {
    // Save current tasks to the selected folder before going back
    if (selectedFolder) {
      const updatedFolders = folders.map(f => 
        f.id === selectedFolder.id ? { ...f, tasks: tasks } : f
      );
      setFolders(updatedFolders);
    }
    setShowFolderView(true);
    setSelectedFolder(null);
  }

  // Add a new folder
  function addFolder() {
    const newId = folders.length > 0 ? Math.max(...folders.map(f => f.id)) + 1 : 1;
    const newFolder = {
      id: newId,
      name: `New Folder ${newId}`,
      tasks: []
    };
    setFolders([...folders, newFolder]);
  }

  // Delete a folder
  function deleteFolder(id) {
    if (window.confirm("Are you sure you want to delete this folder and all its tasks?")) {
      setFolders(folders.filter(folder => folder.id !== id));
    }
  }

  // Start renaming a folder
  function startRenaming(folder) {
    setIsRenamingFolder(folder.id);
    setNewFolderName(folder.name);
  }

  // Save folder name
  function saveRenamedFolder() {
    if (newFolderName.trim()) {
      const updatedFolders = folders.map(folder => 
        folder.id === isRenamingFolder ? { ...folder, name: newFolderName } : folder
      );
      setFolders(updatedFolders);
      setIsRenamingFolder(null);
    }
  }

  // Save tasks when they change
  useEffect(() => {
    if (selectedFolder) {
      const updateFolders = folders.map(folder => 
        folder.id === selectedFolder.id ? { ...folder, tasks: tasks } : folder
      );
      setFolders(updateFolders);
    }
  }, [tasks]);

  // Task-related functions
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
        media: [] // Initialize empty media array for new tasks
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

  function startEditing(index) {
    setEditingIndex(index);
    setEditDetails({
      text: tasks[index].text || "",
      time: tasks[index].time || "",
      notes: tasks[index].notes || "",
      status: tasks[index].status || "white",
      media: tasks[index].media || []
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
      media: editDetails.media
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

  // New function to handle file uploads using Vercel Blob
  async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newMedia = [...editDetails.media];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Calculate a unique filename to avoid collisions
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        
        // Upload to Vercel Blob
        const response = await put(filename, file, {
          access: 'public',
          handleUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.sent / progress.total) * 100));
          }
        });

        // Add the URL to the media array
        newMedia.push({
          url: response.url,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name
        });

      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
      }
    }

    setEditDetails({
      ...editDetails,
      media: newMedia
    });
    
    setIsUploading(false);
    setUploadProgress(0);
  }

  // Function to remove media from a task
  function removeMedia(mediaIndex) {
    const updatedMedia = editDetails.media.filter((_, i) => i !== mediaIndex);
    setEditDetails({
      ...editDetails,
      media: updatedMedia
    });
  }

  // Render media items
  const renderMedia = (mediaItems) => {
    return mediaItems.map((item, index) => (
      <div key={index} className="media-item">
        {item.type === 'image' ? (
          <img src={item.url} alt={item.name} className="media-preview" />
        ) : (
          <video controls className="media-preview">
            <source src={item.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        <div className="media-name">{item.name}</div>
      </div>
    ));
  };

  const renderTask = (task, index) => (
    <li key={index}>
      <div
        className="status-box"
        style={{ backgroundColor: task.status }}
        onClick={() => toggleStatus(index)}
      ></div>
      <span className={`text ${task.status === 'green' ? 'strikethrough' : ''}`}>
        {task.text}
        {task.time && <div className="task-time">{new Date(task.time).toLocaleString()}</div>}
        {task.notes && <div className="task-notes">{task.notes}</div>}
        {task.media && task.media.length > 0 && (
          <div className="task-media">
            {renderMedia(task.media)}
          </div>
        )}
      </span>
      {editingIndex === index ? (
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
          
          {/* Media uploader */}
          <div className="media-upload-section">
            <label className="upload-label">
              Add Images/Videos
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
            
            {isUploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">{uploadProgress}%</div>
              </div>
            )}
            
            {/* Display and manage uploaded media */}
            {editDetails.media && editDetails.media.length > 0 && (
              <div className="media-preview-container">
                <h3>Uploaded Media</h3>
                <div className="media-grid">
                  {editDetails.media.map((item, i) => (
                    <div key={i} className="media-preview-item">
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} className="media-thumbnail" />
                      ) : (
                        <video className="media-thumbnail">
                          <source src={item.url} type="video/mp4" />
                        </video>
                      )}
                      <button 
                        className="remove-media-button" 
                        onClick={() => removeMedia(i)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button className="save-button" onClick={() => saveDetails(index)}>
            Save
          </button>
        </div>
      ) : (
        <>
          <button className="edit-button" onClick={() => startEditing(index)}>
            Edit
          </button>
          <button className="delete-button" onClick={() => deleteTask(index)}>
            Delete
          </button>
          <button className="move-button" onClick={() => moveTaskUp(index)}>
            Move Up
          </button>
          <button className="move-button" onClick={() => moveTaskDown(index)}>
            Move Down
          </button>
        </>
      )}
    </li>
  );

  // Render folder view
  if (showFolderView) {
    return (
      <div className="to-do-list">
        <h1>ADVENTURES</h1>
        <div className="folder-controls">
          <button className="add-button" onClick={addFolder}>Add Folder</button>
        </div>
        <div className="folders-container">
          {folders.map(folder => (
            <div key={folder.id} className="folder-item">
              {isRenamingFolder === folder.id ? (
                <div className="rename-folder">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveRenamedFolder()}
                  />
                  <button className="save-button" onClick={saveRenamedFolder}>Save</button>
                  <button className="cancel-button" onClick={() => setIsRenamingFolder(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <div className="folder-icon" onClick={() => selectFolder(folder)}>
                    📁
                  </div>
                  <div className="folder-name" onClick={() => selectFolder(folder)}>
                    {folder.name}
                  </div>
                  <div className="folder-actions">
                    <button className="rename-button" onClick={() => startRenaming(folder)}>Rename</button>
                    <button className="delete-button" onClick={() => deleteFolder(folder.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render task view
  return (
    <div className="to-do-list">
      <h1>ADVENTURES</h1>
      <div className="folder-navigation">
        <button className="back-button" onClick={goBackToFolders}>
          ← Back to Folders
        </button>
        <h2 className="current-folder">{selectedFolder?.name || ""}</h2>
      </div>

      <div>
        <input
          type="text"
          placeholder="Add new"
          value={newTask}
          onChange={handleInputChange} 
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <button className="add-button" onClick={addTask}>Add</button>
        <button className="delete-all-button" onClick={deleteAllTasks}>Delete All</button>
        <button className="done-all-button" onClick={markAllDone}>Done All</button>
      </div>

      <div className="tasks-container">
        {tasks.length > 0 && (
          <div className="regular-section">
            <ol>
            {tasks.map((task, index) => renderTask(task, index))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default ToDoList;