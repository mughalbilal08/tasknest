const API_BASE_URL = '/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'approved' | 'rejected' | 'inactive';
}

interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

interface SignupResponse {
  message: string;
  token: string;
  user: User;
}

interface MeResponse {
  user: User;
}

interface Department {
  id: string;
  name: string;
  description: string;
  members: User[];
  accessible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DepartmentsResponse {
  departments: Department[];
}

interface DepartmentResponse {
  department: Department;
}

interface Project {
  id: string;
  name: string;
  description: string;
  department: {
    id: string;
    name: string;
  };
  members: User[];
  accessible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsResponse {
  projects: Project[];
}

interface ProjectResponse {
  project: Project;
}

interface ApiError {
  error: string;
  reason?: string;
}

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Set token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem('token');
};

// API request helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).error || 'An error occurred');
  }

  return data as T;
};

// Auth API calls
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signup: async (name: string, email: string, password: string): Promise<SignupResponse> => {
    return apiRequest<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  getMe: async (): Promise<MeResponse> => {
    return apiRequest<MeResponse>('/auth/me');
  },
};

// Department API calls
export const departmentApi = {
  getDepartments: async (): Promise<DepartmentsResponse> => {
    return apiRequest<DepartmentsResponse>('/departments');
  },

  getDepartmentById: async (id: string): Promise<DepartmentResponse> => {
    return apiRequest<DepartmentResponse>(`/departments/${id}`);
  },

  createDepartment: async (data: {
    name: string;
    description?: string;
    members?: string[];
  }): Promise<DepartmentResponse> => {
    return apiRequest<DepartmentResponse>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Project API calls
export const projectApi = {
  getProjects: async (departmentId?: string): Promise<ProjectsResponse> => {
    const queryString = departmentId ? `?departmentId=${departmentId}` : '';
    return apiRequest<ProjectsResponse>(`/projects${queryString}`);
  },

  getProjectById: async (id: string): Promise<ProjectResponse> => {
    return apiRequest<ProjectResponse>(`/projects/${id}`);
  },

  createProject: async (data: {
    name: string;
    description?: string;
    departmentId: string;
    members?: string[];
  }): Promise<ProjectResponse> => {
    return apiRequest<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteProject: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

interface Task {
  _id: string;
  id?: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project: { _id: string; name: string };
  assignedTo?: { _id: string; name: string; email: string };
  createdBy: { _id: string; name: string; email: string };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface TaskResponse {
  task: Task;
}

// Task API calls
export const taskApi = {
  getTasks: async (params?: {
    project?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
    page?: string;
    limit?: string;
  }): Promise<TasksResponse> => {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return apiRequest<TasksResponse>(`/tasks${queryString}`);
  },

  getTaskById: async (id: string): Promise<TaskResponse> => {
    return apiRequest<TaskResponse>(`/tasks/${id}`);
  },

  createTask: async (data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    project: string;
    assignedTo?: string;
    dueDate?: string;
  }): Promise<TaskResponse> => {
    return apiRequest<TaskResponse>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTask: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      assignedTo?: string;
      dueDate?: string;
    }
  ): Promise<TaskResponse> => {
    return apiRequest<TaskResponse>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTask: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

interface UsersResponse {
  users: User[];
}

interface UserResponse {
  user: User & { projects?: Array<{ id: string; name: string; description: string }> };
}

// Admin API calls
export const adminApi = {
  getUsers: async (params?: {
    status?: string;
    role?: string;
    search?: string;
  }): Promise<UsersResponse> => {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return apiRequest<UsersResponse>(`/admin/users${queryString}`);
  },

  getUserById: async (id: string): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/admin/users/${id}`);
  },

  updateUserStatus: async (id: string, status: string): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  updateUserRole: async (id: string, role: string): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },
};

interface Notification {
  id: string;
  user: string;
  type: 'task_assigned' | 'status_change' | 'comment_added' | 'department_added';
  message: string;
  read: boolean;
  task?: { id: string; title: string };
  project?: { id: string; name: string };
  relatedUser?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
}

interface NotificationReadResponse {
  message: string;
  notification: Notification;
}

// Notification API calls
export const notificationApi = {
  getNotifications: async (): Promise<NotificationsResponse> => {
    return apiRequest<NotificationsResponse>('/notifications');
  },

  markAsRead: async (id: string): Promise<NotificationReadResponse> => {
    return apiRequest<NotificationReadResponse>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/notifications/read-all', {
      method: 'PUT',
    });
  },
};

export type { User, Department, Project, Task, Notification };

