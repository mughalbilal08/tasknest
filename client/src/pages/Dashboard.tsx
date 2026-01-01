import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { taskApi, Task, projectApi, Project, adminApi, User } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  
  // Common state
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Admin-specific state
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adminStats, setAdminStats] = useState({
    totalTasks: 0,
    totalProjects: 0,
    totalUsers: 0,
    pendingUsers: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
  });
  
  // User-specific state
  const [userStats, setUserStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    overdue: 0,
    dueToday: 0,
  });

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user, location.pathname]);

  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        fetchData();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      if (isAdmin) {
        // Admin: Fetch all tasks, projects, and users
        const [tasksRes, projectsRes, usersRes] = await Promise.all([
          taskApi.getTasks({ limit: '100' }),
          projectApi.getProjects(),
          adminApi.getUsers(),
        ]);
        
        setTasks(tasksRes.tasks);
        setProjects(projectsRes.projects);
        setUsers(usersRes.users);
        
        // Calculate admin stats
        const todo = tasksRes.tasks.filter((t) => t.status === 'todo').length;
        const inProgress = tasksRes.tasks.filter((t) => t.status === 'in-progress').length;
        const review = tasksRes.tasks.filter((t) => t.status === 'review').length;
        const done = tasksRes.tasks.filter((t) => t.status === 'done').length;
        const pendingUsers = usersRes.users.filter((u) => u.status === 'pending').length;
        
        setAdminStats({
          totalTasks: tasksRes.tasks.length,
          totalProjects: projectsRes.projects.length,
          totalUsers: usersRes.users.length,
          pendingUsers,
          todo,
          inProgress,
          review,
          done,
        });
      } else {
        // User: Fetch only assigned tasks
        const response = await taskApi.getTasks({
          assignedTo: user.id,
          limit: '100',
        });
        setTasks(response.tasks);
        calculateUserStats(response.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = (taskList: Task[]) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const todo = taskList.filter((t) => t.status === 'todo').length;
    const inProgress = taskList.filter((t) => t.status === 'in-progress').length;
    const review = taskList.filter((t) => t.status === 'review').length;
    const done = taskList.filter((t) => t.status === 'done').length;

    let overdue = 0;
    let dueToday = 0;

    taskList.forEach((task) => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < now && task.status !== 'done') {
          overdue++;
        } else if (dueDate.getTime() === now.getTime()) {
          dueToday++;
        }
      }
    });

    setUserStats({
      total: taskList.length,
      todo,
      inProgress,
      review,
      done,
      overdue,
      dueToday,
    });
  };

  const getTaskId = (task: Task) => task.id || task._id;
  const getProjectId = (project: any) => project._id || project.id;

  const getTaskProgress = (task: Task) => {
    switch (task.status) {
      case 'todo': return 0;
      case 'in-progress': return 50;
      case 'review': return 75;
      case 'done': return 100;
      default: return 0;
    }
  };

  const handleTaskClick = (task: Task) => {
    navigate(`/app/projects/${getProjectId(task.project)}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Render Admin Dashboard
  if (isAdmin) {
    const recentTasks = tasks.filter(t => t.status !== 'done').slice(0, 5);
    const pendingUsersList = users.filter(u => u.status === 'pending').slice(0, 3);

    return (
      <AppLayout>
        <div className="max-w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">System overview and management</p>
          </div>

          {/* System Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-xs font-medium mb-1">Total Tasks</p>
                  <p className="text-3xl font-bold">{adminStats.totalTasks}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium mb-1">Projects</p>
                  <p className="text-3xl font-bold">{adminStats.totalProjects}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">📁</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium mb-1">Total Users</p>
                  <p className="text-3xl font-bold">{adminStats.totalUsers}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium mb-1">Pending Approvals</p>
                  <p className="text-3xl font-bold">{adminStats.pendingUsers}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Status Overview */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Task Status Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.todo}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Todo</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{adminStats.inProgress}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{adminStats.review}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Review</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{adminStats.done}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Done</p>
                  </div>
                </div>
              </div>

              {/* Recent Tasks */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Tasks</h2>
                  <Link
                    to="/app/tasks"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
                  >
                    View All →
                  </Link>
                </div>
                {recentTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No active tasks
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTasks.map((task) => (
                      <div
                        key={getTaskId(task)}
                        onClick={() => handleTaskClick(task)}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {typeof task.project === 'string' ? task.project : (task.project as any).name || 'Unknown'}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            task.status === 'todo'
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              : task.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            {task.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Pending User Approvals */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">Pending Approvals</h3>
                  <Link
                    to="/app/admin/users"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
                  >
                    Manage →
                  </Link>
                </div>
                {pendingUsersList.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    No pending users
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingUsersList.map((pendingUser) => (
                      <div key={pendingUser.id || pendingUser._id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{pendingUser.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{pendingUser.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Projects</span>
                    <span className="font-bold text-gray-900 dark:text-white">{projects.filter(p => p.accessible).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                    <span className="font-bold text-gray-900 dark:text-white">{users.filter(u => u.status === 'approved').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {adminStats.totalTasks > 0 ? Math.round((adminStats.done / adminStats.totalTasks) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Render User Dashboard (existing personal dashboard)
  const getTimelineTasks = () => {
    const tasksWithDates = tasks.filter(t => t.dueDate && t.status !== 'done');
    const now = new Date();
    
    return tasksWithDates
      .slice(0, 4)
      .map((task, index) => {
        const dueDate = new Date(task.dueDate!);
        const daysFromNow = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...task,
          dueDate,
          daysFromNow,
          progress: getTaskProgress(task),
        };
      })
      .sort((a, b) => a.daysFromNow - b.daysFromNow);
  };

  const timelineTasks = getTimelineTasks();
  
  const getTimelineDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = -3; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const timelineDates = getTimelineDates();
  const todayIndex = 3;

  const getTimelinePosition = (task: any) => {
    let startOffset = 0;
    if (task.daysFromNow <= 0) {
      startOffset = Math.max(-2, task.daysFromNow - 1);
    } else {
      startOffset = task.daysFromNow - 1;
    }
    
    const dayIndex = Math.max(0, Math.min(todayIndex + startOffset, timelineDates.length - 1));
    const startPercent = (dayIndex / timelineDates.length) * 100;
    const durationDays = 3;
    const widthPercent = Math.min(25, (durationDays / timelineDates.length) * 100);
    
    return { startPercent, widthPercent };
  };

  const kanbanColumns = [
    { id: 'todo', title: 'DRAFT', tasks: tasks.filter(t => t.status === 'todo').slice(0, 3) },
    { id: 'in-progress', title: 'IN PROGRESS', tasks: tasks.filter(t => t.status === 'in-progress').slice(0, 3) },
    { id: 'review', title: 'EDITING', tasks: tasks.filter(t => t.status === 'review').slice(0, 3) },
    { id: 'done', title: 'DONE', tasks: tasks.filter(t => t.status === 'done').slice(0, 3) },
  ];

  const getPriorityColorLight = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const efficiencyByStatus = {
    todo: userStats.total > 0 ? Math.round((userStats.todo / userStats.total) * 100) : 0,
    inProgress: userStats.total > 0 ? Math.round((userStats.inProgress / userStats.total) * 100) : 0,
    review: userStats.total > 0 ? Math.round((userStats.review / userStats.total) * 100) : 0,
    done: userStats.total > 0 ? Math.round((userStats.done / userStats.total) * 100) : 0,
  };

  return (
    <AppLayout>
      <div className="max-w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Task Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name}! Here's your overview.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-6">
            {/* Timeline/Gantt Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Task Timeline</h2>
              
              {timelineTasks.length > 0 ? (
                <div>
                  <div className="grid grid-cols-[180px_1fr] gap-6">
                    {/* Task Labels */}
                    <div className="space-y-5">
                      {timelineTasks.map((task, index) => {
                        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
                        const color = colors[index % colors.length];
                        return (
                          <div key={getTaskId(task)} className="flex items-center space-x-3 h-10">
                            <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {task.title}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Timeline */}
                    <div className="flex-1">
                      {/* Date headers */}
                      <div className="flex gap-0.5 mb-4">
                        {timelineDates.map((date, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 text-center text-xs font-semibold py-2 rounded ${
                              idx === todayIndex
                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {date.getDate()}
                          </div>
                        ))}
                      </div>

                      {/* Task bars */}
                      <div className="space-y-5 relative">
                        {timelineTasks.map((task, index) => {
                          const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
                          const color = colors[index % colors.length];
                          const { startPercent, widthPercent } = getTimelinePosition(task);
                          const progress = Math.min(100, Math.max(20, task.progress));

                          return (
                            <div key={getTaskId(task)} className="relative h-10">
                              <div
                                className={`absolute ${color} h-8 rounded-lg flex items-center justify-between px-3 text-white text-xs font-semibold shadow-md cursor-pointer hover:opacity-90 transition-opacity`}
                                style={{
                                  left: `${startPercent}%`,
                                  width: `${widthPercent}%`,
                                  minWidth: '150px',
                                }}
                                onClick={() => handleTaskClick(task)}
                              >
                                <span className="truncate flex-1">{task.title}</span>
                                <span className="ml-2 whitespace-nowrap">{Math.round(progress)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>No upcoming tasks with due dates</p>
                </div>
              )}
            </div>

            {/* Kanban Boards */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Task Boards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kanbanColumns.map((column) => (
                  <div key={column.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 min-h-[300px]">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide">
                      {column.title}
                    </h3>
                    <div className="space-y-3">
                      {column.tasks.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center text-gray-400 dark:text-gray-500 text-sm border border-gray-200 dark:border-gray-600">
                          No tasks
                        </div>
                      ) : (
                        column.tasks.map((task) => (
                          <div
                            key={getTaskId(task)}
                            onClick={() => handleTaskClick(task)}
                            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg cursor-pointer transition-all border border-gray-200 dark:border-gray-600"
                          >
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded border ${getPriorityColorLight(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>
                              {column.id === 'in-progress' && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  Progress {getTaskProgress(task)}%
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* User Profile */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{user?.name || 'User'}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize font-medium">
                {user?.role || 'Member'}
              </div>
            </div>

            {/* Efficiency Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-6">Efficiency</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'A', value: efficiencyByStatus.todo, color: 'text-gray-600 dark:text-gray-400', strokeColor: 'stroke-gray-600 dark:stroke-gray-400' },
                  { label: 'B', value: efficiencyByStatus.inProgress, color: 'text-blue-600 dark:text-blue-400', strokeColor: 'stroke-blue-600 dark:stroke-blue-400' },
                  { label: 'C', value: efficiencyByStatus.review, color: 'text-purple-600 dark:text-purple-400', strokeColor: 'stroke-purple-600 dark:stroke-purple-400' },
                  { label: 'D', value: efficiencyByStatus.done, color: 'text-green-600 dark:text-green-400', strokeColor: 'stroke-green-600 dark:stroke-green-400' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-2">
                      <svg className="transform -rotate-90 w-20 h-20">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 32}`}
                          strokeDashoffset={`${2 * Math.PI * 32 * (1 - item.value / 100)}`}
                          className={item.strokeColor}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-lg font-bold ${item.color}`}>{item.value}%</span>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Tasks Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-6">Task Status</h3>
              <div className="space-y-5">
                {[
                  { label: 'Todo', value: userStats.todo, color: 'bg-gray-500' },
                  { label: 'In Progress', value: userStats.inProgress, color: 'bg-blue-500' },
                  { label: 'Review', value: userStats.review, color: 'bg-purple-500' },
                  { label: 'Done', value: userStats.done, color: 'bg-green-500' },
                ].map((item) => {
                  const maxValue = Math.max(userStats.todo, userStats.inProgress, userStats.review, userStats.done, 1);
                  const height = (item.value / maxValue) * 120;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                      </div>
                      <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div
                          className={`${item.color} h-full rounded-lg transition-all`}
                          style={{ width: `${(item.value / maxValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
