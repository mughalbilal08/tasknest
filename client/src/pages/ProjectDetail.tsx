import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TaskCreateModal from '../components/TaskCreateModal';
import TaskEditModal from '../components/TaskEditModal';
import { projectApi, taskApi, Task, User } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type ViewMode = 'kanban' | 'list';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      navigate('/app/projects');
      return;
    }

    fetchProjectAndTasks();
  }, [id, navigate]);

  const fetchProjectAndTasks = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      const [projectRes, tasksRes] = await Promise.all([
        projectApi.getProjectById(id),
        taskApi.getTasks({ project: id, limit: '100' }),
      ]);

      setProject(projectRes.project);
      setTasks(tasksRes.tasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
      if (err.message?.includes('403') || err.message?.includes('Access denied')) {
        navigate(`/app/projects/${id}/restricted`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    fetchProjectAndTasks();
  };

  const handleTaskUpdated = () => {
    fetchProjectAndTasks();
  };

  const handleTaskDeleted = () => {
    fetchProjectAndTasks();
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    
    if (!window.confirm(`Are you sure you want to delete "${project?.name}"? This will also delete all tasks and comments in this project. This action cannot be undone.`)) {
      return;
    }

    try {
      await projectApi.deleteProject(id);
      navigate('/app/departments');
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const statusColumns = [
    { id: 'todo', title: 'Todo', color: 'bg-gray-100 dark:bg-gray-700', icon: '⏳' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30', icon: '🔄' },
    { id: 'review', title: 'Review', color: 'bg-yellow-100 dark:bg-yellow-900/30', icon: '👀' },
    { id: 'done', title: 'Done', color: 'bg-green-100 dark:bg-green-900/30', icon: '✅' },
  ];

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  // Calculate statistics
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
    urgent: tasks.filter(t => t.priority === 'urgent').length,
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading project...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
            {error || 'Project not found'}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/app/projects')}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 flex items-center font-medium transition-colors"
          >
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-gray-600 dark:text-gray-400 text-lg">{project.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {isAdmin && (
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all shadow-lg"
                >
                  🗑️ Delete Project
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-indigo-500/50 transform hover:scale-105"
              >
                + Create Task
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-4 text-white">
            <div className="text-center">
              <p className="text-indigo-100 text-xs font-medium mb-1">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl shadow-lg p-4 text-white">
            <div className="text-center">
              <p className="text-gray-100 text-xs font-medium mb-1">Todo</p>
              <p className="text-2xl font-bold">{stats.todo}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-4 text-white">
            <div className="text-center">
              <p className="text-blue-100 text-xs font-medium mb-1">In Progress</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-lg p-4 text-white">
            <div className="text-center">
              <p className="text-yellow-100 text-xs font-medium mb-1">Review</p>
              <p className="text-2xl font-bold">{stats.review}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-4 text-white">
            <div className="text-center">
              <p className="text-green-100 text-xs font-medium mb-1">Done</p>
              <p className="text-2xl font-bold">{stats.done}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-4 text-white">
            <div className="text-center">
              <p className="text-red-100 text-xs font-medium mb-1">Urgent</p>
              <p className="text-2xl font-bold">{stats.urgent}</p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📋 Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📊 List
            </button>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statusColumns.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <div key={column.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{column.icon}</span>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        {column.title}
                      </h3>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-bold">
                      {columnTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[200px]">
                    {columnTasks.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                        No tasks
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <div
                          key={task._id}
                          className="group bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 shadow-md hover:shadow-xl transition-all cursor-pointer transform hover:scale-[1.02] border border-gray-200 dark:border-gray-600"
                          onClick={() => handleEditTask(task)}
                        >
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                            {task.assignedTo && (
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {task.assignedTo.name}
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View - Desktop Table */}
        {viewMode === 'list' && (
          <>
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-4xl mb-2">📝</div>
                        <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr
                        key={task._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => handleEditTask(task)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs mt-1">
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {task.assignedTo ? (
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {task.assignedTo.name}
                            </div>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {task.dueDate ? (
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400">No due date</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* List View - Mobile Cards */}
            <div className="md:hidden space-y-4">
              {tasks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No tasks found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Create your first task to get started</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-[1.02] border border-gray-200 dark:border-gray-700"
                    onClick={() => handleEditTask(task)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex-1">{task.title}</h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(
                          task.priority
                        )} ml-2`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status.replace('-', ' ')}
                      </span>
                      {task.assignedTo && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <svg className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {task.assignedTo.name}
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <svg className="h-4 w-4 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Task Create Modal */}
        {id && (
          <>
            <TaskCreateModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              projectId={id}
              onTaskCreated={handleTaskCreated}
              projectMembers={(project?.members as User[]) || []}
            />
            <TaskEditModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedTask(null);
              }}
              task={selectedTask}
              projectMembers={(project?.members as User[]) || []}
              onTaskUpdated={handleTaskUpdated}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ProjectDetail;
