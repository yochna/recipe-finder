import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  writeBatch,
  serverTimestamp,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbJrxKLYSdqsKr8ASM-PUP75sBaj9xWpo",
  authDomain: "todo-f03c3.firebaseapp.com",
  projectId: "todo-f03c3",
  storageBucket: "todo-f03c3.firebasestorage.app",
  messagingSenderId: "284930870734",
  appId: "1:284930870734:web:34956bcb24df55782a2f9f",
  measurementId: "G-NHQWXK769K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const elements = {
  taskInput: document.getElementById("taskInput"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  taskList: document.getElementById("taskList"),
  dueDate: document.getElementById("dueDate"),
  sortTasksBtn: document.getElementById("sortTasksBtn"),
  clearCompletedBtn: document.getElementById("clearCompletedBtn"),
  taskCounter: document.getElementById("taskCounter"),
  progressBar: document.getElementById("progressBar"),
  toast: document.getElementById("toast"),
  googleLoginBtn: document.getElementById("googleLoginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  appContent: document.querySelector(".app-content"),
  connectionStatus: document.getElementById("connectionStatus"),
  prioritySelect: document.getElementById("prioritySelect")
};

let tasks = [];
let connectionUnsubscribe;
let tasksUnsubscribe;

// Initialize the app
function initApp() {
  setupEventListeners();
  setupServiceWorker();
  enableOfflinePersistence();
  
  onAuthStateChanged(auth, (user) => {
    // Clean up previous listeners
    if (connectionUnsubscribe) connectionUnsubscribe();
    if (tasksUnsubscribe) tasksUnsubscribe();
    
    if (user) {
      initAuthenticatedUI(user);
    } else {
      initUnauthenticatedUI();
    }
  });
}

// Setup event listeners
function setupEventListeners() {
  elements.addTaskBtn.addEventListener("click", addTask);
  elements.taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });
  
  elements.sortTasksBtn.addEventListener("click", sortTasksByPriority);
  elements.clearCompletedBtn.addEventListener("click", clearCompletedTasks);
  elements.googleLoginBtn.addEventListener("click", signInWithGoogle);
  elements.logoutBtn.addEventListener("click", signOutUser);
}

// Service Worker setup
function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
}

// Enable offline persistence
async function enableOfflinePersistence() {
  try {
    await enableIndexedDbPersistence(db);
    console.log("Offline persistence enabled");
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn("Offline persistence already enabled in another tab");
    } else if (err.code === 'unimplemented') {
      console.warn("Offline persistence not available in this browser");
    }
  }
}

// Initialize UI for authenticated user
function initAuthenticatedUI(user) {
  elements.googleLoginBtn.style.display = 'none';
  elements.logoutBtn.style.display = 'block';
  elements.appContent.style.display = 'flex';
  
  // Start monitoring connection and load tasks
  connectionUnsubscribe = monitorConnectionStatus();
  tasksUnsubscribe = loadTasks();
  
  showToast(`Welcome, ${user.displayName || 'User'}!`, "success");
}

// Initialize UI for unauthenticated user
function initUnauthenticatedUI() {
  elements.googleLoginBtn.style.display = 'block';
  elements.logoutBtn.style.display = 'none';
  elements.appContent.style.display = 'none';
  
  tasks = [];
  renderTaskList();
}

// Google Sign-In
async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    showToast("Login failed: " + err.message, "error");
    console.error("Google sign-in error:", err);
  }
}

// Sign Out
async function signOutUser() {
  try {
    await signOut(auth);
    showToast("Signed out successfully", "success");
  } catch (err) {
    showToast("Sign out failed: " + err.message, "error");
    console.error("Sign out error:", err);
  }
}

// Monitor connection status
function monitorConnectionStatus() {
  const connectionRef = doc(db, ".info/connected");
  
  return onSnapshot(connectionRef, (doc) => {
    const isConnected = doc.data()?.connected;
    elements.connectionStatus.textContent = isConnected ? "Online" : "Offline";
    elements.connectionStatus.className = `connection-status ${isConnected ? 'online' : 'offline'}`;
    
    if (isConnected) {
      showToast("Back online", "success");
    } else {
      showToast("Working offline - changes will sync when back online", "warning");
    }
  });
}

// Load tasks from Firestore
function loadTasks() {
  const q = query(
    collection(db, "tasks"),
    where("userId", "==", auth.currentUser.uid),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, 
    (snapshot) => {
      tasks = snapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : 
                        (data.timestamp instanceof Date ? data.timestamp : new Date());
        
        return {
          id: doc.id,
          text: data.text,
          due: data.due,
          priority: data.priority,
          completed: data.completed,
          timestamp: timestamp
        };
      });
      renderTaskList();
    }, 
    (err) => {
      console.error("Firestore error:", err);
      showToast("Error loading tasks", "error");
    }
  );
}

// Render task list
function renderTaskList() {
  elements.taskList.innerHTML = "";
  
  if (tasks.length === 0) {
    elements.taskList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-clipboard-list"></i>
        </div>
        <h3 class="empty-title">No tasks yet!</h3>
        <p class="empty-message">Add your first task to get started</p>
      </div>`;
    updateTaskCounter();
    return;
  }

  tasks.forEach((task, index) => {
    const taskItem = document.createElement("li");
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskItem.dataset.priority = task.priority;
    
    taskItem.innerHTML = `
      <div class="task-content">
        <div class="task-text">${task.text}</div>
        <div class="task-meta">
          <div class="task-meta-item task-due-date">
            <i class="far fa-calendar-alt"></i>
            <span>${formatDate(task.due)}</span>
          </div>
          <div class="task-meta-item">
            <span class="priority-tag priority-${task.priority}">
              ${capitalizeFirstLetter(task.priority)} Priority
            </span>
          </div>
          <div class="task-meta-item">
            <i class="far fa-clock"></i>
            <span>${formatTime(task.timestamp)}</span>
          </div>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-btn edit-btn" data-index="${index}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="task-btn delete-btn" data-index="${index}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    // Add event listeners to the buttons
    const editBtn = taskItem.querySelector(".edit-btn");
    const deleteBtn = taskItem.querySelector(".delete-btn");
    const taskContent = taskItem.querySelector(".task-content");
    
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      editTask(index);
    });
    
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteTask(index);
    });
    
    taskContent.addEventListener("click", () => {
      toggleTaskCompletion(index);
    });
    
    elements.taskList.appendChild(taskItem);
  });
  
  updateTaskCounter();
}

// Add new task
async function addTask() {
  const taskText = elements.taskInput.value.trim();
  
  if (!taskText) {
    showToast("Please enter a task description", "warning");
    elements.taskInput.focus();
    return;
  }
  
  // Check for duplicate tasks (case insensitive)
  if (tasks.some(task => task.text.toLowerCase() === taskText.toLowerCase())) {
    showToast("This task already exists!", "warning");
    elements.taskInput.focus();
    return;
  }
  
  const newTask = {
    text: taskText,
    due: elements.dueDate.value || "No deadline",
    priority: elements.prioritySelect.value,
    completed: false,
    timestamp: new Date()
  };
  
  // Optimistic UI update
  tasks.unshift(newTask);
  renderTaskList();
  
  try {
    const docRef = doc(collection(db, "tasks"));
    await setDoc(docRef, {
      ...newTask,
      userId: auth.currentUser.uid,
      timestamp: serverTimestamp()
    });
    
    // Update the local task with the ID from Firestore
    newTask.id = docRef.id;
    
    elements.taskInput.value = "";
    elements.dueDate.value = "";
    elements.taskInput.focus();
    
    showToast("Task added successfully", "success");
  } catch (err) {
    // Revert optimistic update if save fails
    tasks.shift();
    renderTaskList();
    
    showToast("Failed to add task", "error");
    console.error("Error adding task:", err);
  }
}

// Edit task
function editTask(index) {
  const taskItem = elements.taskList.children[index];
  const taskTextElement = taskItem.querySelector(".task-text");
  const currentText = taskTextElement.textContent;
  
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentText;
  input.className = "task-edit-input";
  
  taskTextElement.replaceWith(input);
  input.focus();
  
  function saveEdit() {
    const newText = input.value.trim();
    if (newText && newText !== currentText) {
      updateTask(index, { text: newText, timestamp: new Date() });
    }
    // Revert to text display even if no change
    input.replaceWith(taskTextElement);
  }
  
  input.addEventListener("blur", saveEdit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      input.replaceWith(taskTextElement);
    }
  });
}

// Update task in Firestore
async function updateTask(index, updates) {
  const taskId = tasks[index].id;
  if (!taskId) return;
  
  // Optimistic UI update
  const originalTask = {...tasks[index]};
  tasks[index] = {...tasks[index], ...updates};
  renderTaskList();
  
  try {
    await updateDoc(doc(db, "tasks", taskId), updates);
    showToast("Task updated", "success");
  } catch (err) {
    // Revert optimistic update if save fails
    tasks[index] = originalTask;
    renderTaskList();
    
    showToast("Failed to update task", "error");
    console.error("Error updating task:", err);
  }
}

// Delete task
async function deleteTask(index) {
  const taskId = tasks[index].id;
  if (!taskId) return;
  
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }
  
  // Optimistic UI update
  const deletedTask = tasks.splice(index, 1)[0];
  renderTaskList();
  
  try {
    await deleteDoc(doc(db, "tasks", taskId));
    showToast("Task deleted", "success");
  } catch (err) {
    // Revert optimistic update if delete fails
    tasks.splice(index, 0, deletedTask);
    renderTaskList();
    
    showToast("Failed to delete task", "error");
    console.error("Error deleting task:", err);
  }
}

// Toggle task completion status
function toggleTaskCompletion(index) {
  const newCompletedStatus = !tasks[index].completed;
  updateTask(index, { 
    completed: newCompletedStatus,
    timestamp: new Date()
  });
  
  if (newCompletedStatus) {
    showToast("Task completed!", "success");
  }
}

// Sort tasks by priority
function sortTasksByPriority() {
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  renderTaskList();
  showToast("Tasks sorted by priority", "success");
}

// Clear completed tasks
async function clearCompletedTasks() {
  const completedTasks = tasks.filter(task => task.completed);
  if (completedTasks.length === 0) {
    showToast("No completed tasks to clear", "warning");
    return;
  }
  
  if (!confirm(`Clear ${completedTasks.length} completed task${completedTasks.length > 1 ? 's' : ''}?`)) {
    return;
  }
  
  // Optimistic UI update
  const originalTasks = [...tasks];
  tasks = tasks.filter(task => !task.completed);
  renderTaskList();
  
  try {
    const batch = writeBatch(db);
    completedTasks.forEach(task => {
      if (task.id) {
        batch.delete(doc(db, "tasks", task.id));
      }
    });
    await batch.commit();
    
    showToast(`Cleared ${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''}`, "success");
  } catch (err) {
    // Revert optimistic update if clear fails
    tasks = originalTasks;
    renderTaskList();
    
    showToast("Failed to clear completed tasks", "error");
    console.error("Error clearing completed tasks:", err);
  }
}

// Update task counter and progress bar
function updateTaskCounter() {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  
  elements.taskCounter.textContent = 
    `${completedTasks} of ${totalTasks} tasks completed • ${totalTasks - completedTasks} remaining`;
  
  if (totalTasks > 0) {
    const progress = (completedTasks / totalTasks) * 100;
    elements.progressBar.style.width = `${progress}%`;
  } else {
    elements.progressBar.style.width = '0%';
  }
}

// Format date for display
function formatDate(dateString) {
  if (!dateString || dateString === "No deadline") return "No deadline";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  
  if (date.getTime() === today.getTime()) {
    return "Today";
  } else if (date.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
}

// Format time for display
function formatTime(date) {
  if (!date) return "Unknown time";
  
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// Show toast notification
function showToast(message, type = "success") {
  elements.toast.textContent = message;
  elements.toast.className = `toast-notification show ${type}`;
  
  setTimeout(() => {
    elements.toast.className = "toast-notification";
  }, 3000);
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Set minimum date to today
function setMinDate() {
  const today = new Date().toISOString().split("T")[0];
  elements.dueDate.setAttribute("min", today);
  elements.dueDate.value = today;
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  setMinDate();
  initApp();
});