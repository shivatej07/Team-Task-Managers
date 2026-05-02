import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, createTask, updateTask, deleteTask, getUsers, addMember, removeMember } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjectData();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const res = await getProject(id);
      setProject(res.data.project);
      setTasks(res.data.tasks);
    } catch (err) {
      console.error('Error fetching project', err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setAllUsers(res.data.users);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await createTask({ ...newTask, project: id });
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
      fetchProjectData();
    } catch (err) {
      console.error('Error creating task', err);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      fetchProjectData();
    } catch (err) {
      console.error('Error updating task status', err);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await addMember(id, userId);
      setShowMemberModal(false);
      fetchProjectData();
    } catch (err) {
      console.error('Error adding member', err);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(id, userId);
        fetchProjectData();
      } catch (err) {
        console.error('Error removing member', err);
      }
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="page-content fade-in">
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-icon" onClick={() => navigate('/projects')}>←</button>
          <h1 className="topbar-title">{project?.name}</h1>
        </div>
        <div className="topbar-actions">
          {user?.role === 'admin' && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>Manage Members</button>
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ Add Task</button>
            </>
          )}
        </div>
      </header>

      <div style={{ marginTop: '24px' }}>
        <p className="text-secondary">{project?.description}</p>
        
        <div className="members-list" style={{ marginTop: '16px' }}>
          {project?.members.map(member => (
            <div key={member._id} className="member-chip">
              <div className="member-chip-avatar">{member.name.charAt(0)}</div>
              <span>{member.name}</span>
              {user?.role === 'admin' && member._id !== project.owner._id && (
                <button className="member-chip-remove" onClick={() => handleRemoveMember(member._id)}>&times;</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="section-header" style={{ marginTop: '40px' }}>
        <h2 className="section-title">Project Tasks</h2>
      </div>

      <div className="tasks-list">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <div key={task._id} className="task-row">
              <div className="task-info">
                <div className="task-title">{task.title}</div>
                <div className="text-secondary" style={{ fontSize: '12px' }}>{task.description}</div>
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
              <div className="task-actions">
                {user?.role === 'admin' && (
                  <button className="btn-icon" onClick={async () => {
                    if(window.confirm('Delete task?')) {
                      await deleteTask(task._id);
                      fetchProjectData();
                    }
                  }}>🗑️</button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No tasks in this project yet.</p>
          </div>
        )}
      </div>

      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal slide-up">
            <div className="modal-header">
              <h2 className="modal-title">Add New Task</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input 
                    type="text" className="form-input" required 
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-textarea"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select 
                    className="form-select"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                  >
                    <option value="">Select Member</option>
                    {project?.members.map(member => (
                      <option key={member._id} value={member._id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select 
                      className="form-select"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input 
                      type="date" className="form-input"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="modal-overlay">
          <div className="modal slide-up">
            <div className="modal-header">
              <h2 className="modal-title">Manage Members</h2>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-secondary" style={{ marginBottom: '16px' }}>Add team members to this project.</p>
              <div className="table-container" style={{ maxHeight: '300px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.filter(u => !project.members.some(m => m._id === u._id)).map(u => (
                      <tr key={u._id}>
                        <td>{u.name} ({u.role})</td>
                        <td>
                          <button className="btn btn-sm btn-primary" onClick={() => handleAddMember(u._id)}>Add</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
