import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { projectApi } from '../services/api';

const AccessRestricted = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        navigate('/app/projects');
        return;
      }

      try {
        const response = await projectApi.getProjectById(id);
        setProjectName(response.project.name);
      } catch (error) {
        // Project might not exist or access denied
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, navigate]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Access Restricted
          </h1>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400 mb-6">Loading...</p>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                You don't have access to this project.
              </p>
              {projectName && (
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                  Project: <span className="text-indigo-600 dark:text-indigo-400">{projectName}</span>
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Please contact an administrator to be added as a member of this project.
              </p>
              <button
                onClick={() => navigate('/app/projects')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Projects
              </button>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AccessRestricted;

