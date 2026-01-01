import { useAuth } from '../contexts/AuthContext';

const Blocked = () => {
  const { user, logout } = useAuth();

  const statusMessage =
    user?.status === 'rejected'
      ? 'Your account has been rejected.'
      : 'Your account is inactive.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">{statusMessage}</p>
          {user && (
            <p className="mt-4 text-sm text-gray-500">
              Account: <span className="font-medium">{user.email}</span>
            </p>
          )}
          <p className="mt-4 text-sm text-gray-500">
            Please contact an administrator if you believe this is an error.
          </p>
        </div>
        <div>
          <button
            onClick={logout}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Blocked;

