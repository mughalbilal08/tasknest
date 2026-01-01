import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { departmentApi, projectApi, Project } from '../services/api';
import ProjectCreateModal from '../components/ProjectCreateModal';

const DepartmentProjects = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [department, setDepartment] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (id) {
      fetchDepartment();
      fetchProjects();
    }
  }, [id]);

  const fetchDepartment = async () => {
    try {
      const response = await departmentApi.getDepartmentById(id!);
      setDepartment(response.department);
    } catch (error) {
      console.error('Failed to fetch department:', error);
      navigate('/app/departments');
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getProjects(id);
      setProjects(response.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    if (project.accessible) {
      navigate(`/app/projects/${project.id}`);
    } else {
      navigate(`/app/projects/${project.id}/restricted`);
    }
  };

  const handleProjectCreated = () => {
    fetchProjects();
    setIsModalOpen(false);
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${projectName}"? This will also delete all tasks and comments in this project. This action cannot be undone.`)) {
      return;
    }

    try {
      await projectApi.deleteProject(projectId);
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  if (loading || !department) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/app/departments')}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 flex items-center"
          >
            ← Back to Departments
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {department.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{department.description || 'No description'}</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
              >
                + Create Project
              </button>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Projects</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isAdmin
                ? 'Get started by creating your first project in this department'
                : 'No projects available in this department yet'}
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg"
              >
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all cursor-pointer hover:shadow-2xl transform hover:-translate-y-1 ${
                  project.accessible
                    ? 'border-green-500 hover:border-green-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.accessible
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {project.accessible ? '✅ Accessible' : '🔒 Restricted'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">👥</span>
                      <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id, project.name);
                          }}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      )}
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        Click to {project.accessible ? 'view tasks' : 'view details'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {id && department && (
          <ProjectCreateModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            departmentId={id}
            onProjectCreated={handleProjectCreated}
            allUsers={department.members}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default DepartmentProjects;

