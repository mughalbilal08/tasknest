import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { projectApi, Project } from '../services/api';

const Team = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await projectApi.getProjects();
      setProjects(response.projects.filter((p) => p.accessible));
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading team...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Collect all unique members from accessible projects
  const allMembers = new Map();
  projects.forEach((project) => {
    project.members.forEach((member: any) => {
      const memberId = member.id || member._id;
      if (!allMembers.has(memberId)) {
        allMembers.set(memberId, {
          id: memberId,
          name: member.name,
          email: member.email,
          projects: [],
        });
      }
      allMembers.get(memberId).projects.push({
        id: project.id,
        name: project.name,
      });
    });
  });

  const membersArray = Array.from(allMembers.values());

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Team</h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {membersArray.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
            No team members found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {membersArray.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-medium mr-4">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Projects ({member.projects.length})
                  </h4>
                  <div className="space-y-1">
                    {member.projects.map((project: any) => (
                      <div
                        key={project.id}
                        className="text-sm text-gray-600 dark:text-gray-400"
                      >
                        • {project.name}
                      </div>
                    ))}
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

export default Team;

