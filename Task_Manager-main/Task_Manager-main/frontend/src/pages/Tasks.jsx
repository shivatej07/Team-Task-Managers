import React, { useState, useEffect } from 'react';
import { getTasks, updateTask } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      const res = await getTasks(filters);
      setTasks(res.data.tasks);
    } catch (err) {
      console.error('Error fetching tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Error updating task status', err);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="page-content fade-in">
      <header className="topbar">
        <h1 className="topbar-title">All Tasks</h1>
      </header>

      <div className="filters-bar" style={{ marginTop: '24px' }}>
        <select 
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select 
          className="filter-select"
          value={filters.priority}
          onChange={(e) => setFilters({...filters, priority: e.target.value})}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="tasks-list" style={{ marginTop: '24px' }}>
        {tasks.length > 0 ? (
          tasks.map(task => (
            <div key={task._id} className="task-row">
              <div className="task-info">
                <div className="task-title">{task.title}</div>
                <div className="task-project">Project: {task.project?.name}</div>
              </div>
              <div>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              </div>
              <div className="task-assignee">
                <div className="task-assignee-avatar">{task.assignedTo?.name.charAt(0) || '?'}</div>
                <span>{task.assignedTo?.name || 'Unassigned'}</span>
              </div>
              <div className={`task-date ${task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'overdue' : ''}`}>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
              </div>
              <div>
                <select 
                  className="filter-select" 
                  value={task.status}
                  onChange={(e) => handleStatusUpdate(task._id, e.target.value)}
                  disabled={user?.role !== 'admin' && task.assignedTo?._id !== user?._id}
                >
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3 className="empty-state-title">No tasks found</h3>
            <p className="empty-state-desc">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
