import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiHome, FiUsers, FiList, FiSettings, FiLogOut, FiArrowLeft } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { isUserAdmin } from '../utils/adminUtils';

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      try {
        // Check admin status through proper database lookup
        const adminStatus = await isUserAdmin();
        if (adminStatus) {
          console.log('Admin access granted through database verification');
          setIsAdmin(true);
          setAdminName(user.email?.split('@')[0] || 'Admin');
          setIsLoading(false);
          return;
        }

        // If not admin, redirect to unauthorized page
        console.log('Admin access denied');
        router.push('/unauthorized');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Failed to verify admin status. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-700 dark:text-gray-300">Loading admin panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            You don't have permission to access the admin panel.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-2xl font-bold flex items-center">
              <span className="bg-white text-purple-600 rounded-full p-1 mr-2">
                <FiSettings size={20} />
              </span>
              Admin Panel
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Logged in as <span className="font-semibold">{adminName}</span></span>
            <button
              onClick={handleSignOut}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm py-1 px-3 rounded-md transition-colors flex items-center gap-1"
            >
              <FiLogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Sidebar and Content */}
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white dark:bg-gray-800 shadow-md md:min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/admin" 
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    router.pathname === '/admin' 
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FiHome className="mr-3" size={18} />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/users" 
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    router.pathname === '/admin/users' 
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FiUsers className="mr-3" size={18} />
                  <span>Manage Users</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/transactions" 
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    router.pathname === '/admin/transactions' 
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FiList className="mr-3" size={18} />
                  <span>Transaction History</span>
                </Link>
              </li>
              <li className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <Link 
                  href="/dashboard" 
                  className="flex items-center px-4 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <FiArrowLeft className="mr-3" size={18} />
                  <span>Back to Website</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
