import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { notificationApi, Notification } from '../services/api';

const Updates = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await notificationApi.getNotifications();
      setNotifications(response.notifications);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err: any) {
      alert(err.message || 'Failed to mark all notifications as read');
    }
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.type === 'department_added' && notification.project) {
      // For department notifications, link to department projects page
      const projectId = (notification.project as any).id || (notification.project as any)._id;
      return `/app/departments/${projectId}/projects`;
    }
    if (notification.task) {
      // Find project ID from task - we'll need to get it from the task object
      // For now, we'll use a placeholder or try to navigate to the task's project
      return `/app/projects/${(notification.task as any).projectId || ''}`;
    }
    if (notification.project) {
      return `/app/projects/${(notification.project as any).id || (notification.project as any)._id}`;
    }
    return '/app/dashboard';
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Updates
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Your activity feed and notifications
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-indigo-500/50 transform hover:scale-105"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No notifications yet</h3>
            <p className="text-gray-500 dark:text-gray-400">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-[1.01] border ${
                  !notification.read ? 'border-l-4 border-indigo-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {!notification.read && (
                        <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
                      )}
                      <p className="text-gray-900 dark:text-white font-medium">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      {notification.task && (
                        <span>Task: {(notification.task as any).title || 'Task'}</span>
                      )}
                      {notification.project && (
                        <span>
                          {notification.type === 'department_added' 
                            ? `Department: ${(notification.project as any).name || 'Department'}`
                            : `Project: ${(notification.project as any).name || 'Project'}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Mark as read
                      </button>
                    )}
                    {(notification.task || notification.project) && (
                      <Link
                        to={getNotificationLink(notification)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Updates;

