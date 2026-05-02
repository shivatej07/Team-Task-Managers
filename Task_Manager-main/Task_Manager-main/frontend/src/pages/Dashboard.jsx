import React, { useState, useEffect } from 'react';
import { getTaskStats, getTasks } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          getTaskStats(),
          getTasks({ limit: 5 })
        ]);
        setStats(statsRes.data.stats);
        setRecentTasks(tasksRes.data.tasks.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="page-content fade-in">
      <header className="topbar">
        <h1 className="topbar-title">Dashboard</h1>
        <div className="topbar-actions">
          <span className="text-secondary">Welcome back, <strong>{user?.name}</strong></span>
        </div>
      </header>

      <div className="stats-grid" style={{ marginTop: '32px' }}>
        <div className="stat-card blue">
          <div className="stat-icon blue">📋</div>
          <div className="stat-value">{stats?.total || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange">⏳</div>
          <div className="stat-value">{stats?.inProgress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green">✅</div>
          <div className="stat-value">{stats?.done || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card pink">
          <div className="stat-icon pink">⚠️</div>
          <div className="stat-value">{stats?.overdue || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: '40px' }}>
        <h2 className="section-title">Recent Tasks</h2>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Project</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <tr key={task._id}>
                  <td className="task-title">{task.title}</td>
                  <td className="text-secondary">{task.project?.name}</td>
                  <td>
                    <span className={`badge badge-${task.priority}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${task.status}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="text-secondary">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
