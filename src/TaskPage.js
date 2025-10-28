import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function TaskPage({ tasks, setTasks }) {
  const navigate = useNavigate();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskCategory, setTaskCategory] = useState("personal");
  const [newProgress, setNewProgress] = useState(0);

  const addTask = () => {
    if (taskTitle.trim() === "") {
      alert("Please enter a task title!");
      return;
    }

    const newTask = {
      id: Date.now(),
      title: taskTitle,
      dueDate: taskDate,
      category: taskCategory,
      completed: false,
      progress: newProgress,
    };

    setTasks([...tasks, newTask]);
    setTaskTitle("");
    setTaskDate("");
    setTaskCategory("personal");
  };
  const updateTaskProgress = (id, value) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              progress: value,
              completed: value === 100 ? true : t.completed,
            }
          : t
      )
    );
  };
  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          progress: nextCompleted ? 100 : 0, // uncheck → 0%
        };
      })
    );
  };
  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const getCategoryColor = (category) => {
    const colors = {
      personal: "#4CAF50",
      work: "#2196F3",
      health: "#FF9800",
      study: "#9C27B0",
    };
    return colors[category] || "#gray";
  };

  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  };

  const taskBoxStyle = {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    maxWidth: "800px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
  };

  return (
    <div style={containerStyle}>
      <div style={taskBoxStyle}>
        <button
          style={{
            backgroundColor: "#e0e0e0",
            color: "#333",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "20px",
            fontSize: "14px",
          }}
          onClick={() => navigate("/")}
        >
          ← Back to Welcome
        </button>

        <h1 style={{ fontSize: "32px", color: "#333", marginBottom: "10px" }}>
          My Tasks
        </h1>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            marginBottom: "30px",
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Task name..."
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            style={{
              padding: "12px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "2px solid #ddd",
            }}
          />

          <input
            type="date"
            value={taskDate}
            onChange={(e) => setTaskDate(e.target.value)}
            style={{
              padding: "12px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "2px solid #ddd",
            }}
          />

          <select
            value={taskCategory}
            onChange={(e) => setTaskCategory(e.target.value)}
            style={{
              padding: "12px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "2px solid #ddd",
              backgroundColor: "white",
            }}
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="health">Health</option>
            <option value="study">Study</option>
          </select>
          <label style={{ fontSize: 14, color: "#666" }}>
            Progress: {newProgress}%
          </label>
          <input
            type="range"
            min="0"
            max="99"
            value={newProgress}
            onChange={(e) => setNewProgress(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <button
            onClick={addTask}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              padding: "12px",
              fontSize: "16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Add Task
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {tasks.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#999",
                fontSize: "16px",
                padding: "40px",
              }}
            >
              No tasks yet! Add your first task above.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px",
                  backgroundColor: "#fafafa",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${getCategoryColor(task.category)}`,
                  gap: "15px",
                  opacity: task.completed ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flex: 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    aria-label={`Mark ${task.title} as ${
                      task.completed ? "incomplete" : "complete"
                    }`}
                  />
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "18px",
                        color: task.completed ? "#777" : "#333",
                        textDecoration: task.completed
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {task.title}
                    </h3>
                    <div
                      style={{ display: "flex", gap: "15px", fontSize: "14px" }}
                    >
                      <span
                        style={{
                          color: "#666",
                          textTransform: "capitalize",
                          fontWeight: "bold",
                        }}
                      >
                        {task.category}
                      </span>
                      {task.dueDate && (
                        <span style={{ color: "#999" }}>
                          Due: {task.dueDate}
                        </span>
                      )}
                      {task.completed && (
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#e8f5e9",
                          }}
                        >
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!task.completed && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {task.progress}%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={task.progress}
                      onChange={(e) =>
                        updateTaskProgress(task.id, Number(e.target.value))
                      }
                      style={{ flex: 1 }}
                    />
                  </div>
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskPage;
