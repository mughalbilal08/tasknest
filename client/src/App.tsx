import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Pending from './pages/Pending';
import Dashboard from './pages/Dashboard';
import Blocked from './pages/Blocked';
import Departments from './pages/Departments';
import DepartmentProjects from './pages/DepartmentProjects';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AccessRestricted from './pages/AccessRestricted';
import AdminUsers from './pages/AdminUsers';
import AllTasks from './pages/Tasks';
import MyTasks from './pages/MyTasks';
import Updates from './pages/Updates';
import Settings from './pages/Settings';
import Features from './pages/Features';
import Contact from './pages/Contact';
import Landing from './pages/Landing';

function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Landing />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/pending"
        element={
          <ProtectedRoute>
            <Pending />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/departments"
        element={
          <ProtectedRoute>
            <Departments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/departments/:id/projects"
        element={
          <ProtectedRoute>
            <DepartmentProjects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/departments/:id/restricted"
        element={
          <ProtectedRoute>
            <AccessRestricted />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/projects/:id/restricted"
        element={
          <ProtectedRoute>
            <AccessRestricted />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/tasks"
        element={
          <ProtectedRoute>
            <AllTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/my-tasks"
        element={
          <ProtectedRoute>
            <MyTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/updates"
        element={
          <ProtectedRoute>
            <Updates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/admin/users"
        element={
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blocked"
        element={
          <ProtectedRoute>
            <Blocked />
          </ProtectedRoute>
        }
      />
      <Route
        path="/features"
        element={<Features />}
      />
      <Route
        path="/contact"
        element={<Contact />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

