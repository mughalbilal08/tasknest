import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { departmentApi, Department } from '../services/api';
import DepartmentCreateModal from '../components/DepartmentCreateModal';

const Departments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentApi.getDepartments();
      setDepartments(response.departments);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentClick = (department: Department) => {
    if (department.accessible) {
      navigate(`/app/departments/${department.id}/projects`);
    } else {
      navigate(`/app/departments/${department.id}/restricted`);
    }
  };

  const handleDepartmentCreated = () => {
    fetchDepartments();
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading departments...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const accessibleCount = departments.filter((d) => d.accessible).length;
  const totalCount = departments.length;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Departments</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and access departments across your organization
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
            >
              + Create Department
            </button>
          )}
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-xs font-medium mb-1">Total Departments</p>
                <p className="text-3xl font-bold">{totalCount}</p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium mb-1">Accessible</p>
                <p className="text-3xl font-bold">{accessibleCount}</p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl shadow-lg p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100 text-xs font-medium mb-1">Restricted</p>
                <p className="text-3xl font-bold">{totalCount - accessibleCount}</p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">🔒</span>
              </div>
            </div>
          </div>
        </div>

        {/* Departments Grid */}
        {departments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Departments</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isAdmin
                ? 'Get started by creating your first department'
                : 'No departments available yet'}
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg"
              >
                Create Department
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((department) => (
              <div
                key={department.id}
                onClick={() => handleDepartmentClick(department)}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all cursor-pointer hover:shadow-2xl transform hover:-translate-y-1 ${
                  department.accessible
                    ? 'border-green-500 hover:border-green-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {department.name}
                      </h3>
                      {department.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {department.description}
                        </p>
                      )}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        department.accessible
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {department.accessible ? '✅ Accessible' : '🔒 Restricted'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">👥</span>
                      <span>{department.members.length} member{department.members.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      Click to {department.accessible ? 'view projects' : 'view details'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Department Modal */}
        <DepartmentCreateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDepartmentCreated={handleDepartmentCreated}
        />
      </div>
    </AppLayout>
  );
};

export default Departments;

