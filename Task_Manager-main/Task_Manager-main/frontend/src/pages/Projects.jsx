import React, { useState, useEffect } from 'react';
import { getProjects, createProject } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data.projects);
    } catch (err) {
      console.error('Error fetching projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await createProject(newProject);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      console.error('Error creating project', err);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="page-content fade-in">
      <header className="topbar">
        <h1 className="topbar-title">Projects</h1>
        <div className="topbar-actions">
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + New Project
            </button>
          )}
        </div>
      </header>

      <div className="projects-grid" style={{ marginTop: '32px' }}>
        {projects.length > 0 ? (
          projects.map((project) => (
            <Link to={`/projects/${project._id}`} key={project._id} className="project-card">
              <div className="project-card-header">
                <div className="project-card-name">{project.name}</div>
                <span className={`badge badge-${project.status}`}>{project.status}</span>
              </div>
              <p className="project-card-desc">{project.description}</p>
              <div className="project-card-footer">
                <div className="project-card-members">
                  <span>👥 {project.members?.length || 0} Members</span>
                </div>
                <div className="project-progress">
                   <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${project.taskCounts?.total > 0 ? (project.taskCounts.done / project.taskCounts.total) * 100 : 0}%` }}
                      ></div>
                   </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">📂</div>
            <h3 className="empty-state-title">No projects yet</h3>
            <p className="empty-state-desc">Start by creating your first team project.</p>
            {user?.role === 'admin' && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal slide-up">
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-textarea" 
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
