import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiUsers, FiDollarSign, FiClock, FiTrendingUp, FiSettings, FiList, FiDatabase, FiAlertTriangle, FiCheckCircle, FiCopy, FiCode } from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../../utils/supabaseClient';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { isUserAdmin } from '../../utils/adminUtils';
import { setupDatabase } from '../../utils/setupDatabase';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    recentModifications: 0
  });
  const [missingTables, setMissingTables] = useState<string[]>([]);
  const [sqlStatements, setSqlStatements] = useState<Record<string, string>>({});
  const [showSql, setShowSql] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const adminStatus = await isUserAdmin();
          setIsAdmin(adminStatus);
          
          if (!adminStatus) {
            toast.error('You do not have admin privileges');
            router.push('/dashboard');
          } else {
            await checkRequiredTables();
            await fetchDashboardStats();
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          toast.error('An error occurred while checking admin status');
          router.push('/dashboard');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    if (!loading) {
      if (user) {
        checkAdminStatus();
      } else {
        router.push('/auth/signin');
      }
    }
  }, [user, loading, router]);

  // Check if required tables exist
  const checkRequiredTables = async () => {
    try {
      const result = await setupDatabase();
      setMissingTables(result.missingTables);
      setSqlStatements(result.sqlStatements);

      if (result.missingTables.length > 0) {
        toast.warning(`Some required database tables are missing: ${result.missingTables.join(', ')}`, {
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Error checking required tables:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      
      // Get total users from profiles table
      let totalUsers = 0;
      try {
        if (!missingTables.includes('profiles')) {
          // Simplified approach - just fetch all profiles
          // This works because we've set up a policy to allow everyone to view profiles
          console.log('Fetching total user count...');
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id');

          if (profilesError) {
            console.error('Error fetching profiles for count:', profilesError);
          } else if (profilesData) {
            totalUsers = profilesData.length;
            console.log(`Found ${totalUsers} users`);
          }
        }
        
        // If profiles table doesn't exist or count is 0, try to get count from auth
        if (totalUsers === 0) {
          console.log('Falling back to auth user count...');
          // This is a fallback that doesn't require admin privileges
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (!authError && authData) {
            // If we can get the current user, assume at least 1 user exists
            totalUsers = 1;
            console.log('Using fallback user count: 1');
          }
        }
      } catch (error) {
        console.error('Error in user count:', error);
      }

      // Get total balance
      let totalBalance = 0;
      try {
        if (!missingTables.includes('profiles')) {
          console.log('Fetching total balance...');
          const { data: balanceData, error: balanceError } = await supabase
            .from('profiles')
            .select('balance_eth');

          if (balanceError) {
            console.error('Error fetching balance data:', balanceError);
          } else if (balanceData) {
            totalBalance = balanceData.reduce((sum: number, profile: any) => {
              return sum + (parseFloat(profile.balance_eth) || 0);
            }, 0);
            console.log(`Total balance: ${totalBalance} ETH`);
          }
        }
      } catch (error) {
        console.error('Error in balance calculation:', error);
      }

      // Get recent modifications count
      let recentModifications = 0;
      try {
        if (!missingTables.includes('balance_modifications')) {
          console.log('Fetching recent modifications...');
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          // For the designated admin email, we should be able to view all modifications
          const { data: modData, error: modError } = await supabase
            .from('balance_modifications')
            .select('id')
            .gte('created_at', sevenDaysAgo.toISOString());

          if (modError) {
            console.error('Error fetching modifications:', modError);
          } else if (modData) {
            recentModifications = modData.length;
            console.log(`Recent modifications: ${recentModifications}`);
          }
        }
      } catch (error) {
        console.error('Error in modifications count:', error);
      }

      setStats({
        totalUsers,
        totalBalance,
        recentModifications
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to fetch dashboard statistics');
    }
  };

  const handleShowSql = (table: string) => {
    setShowSql(table);
    setCopied(false);
  };

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      toast.success('SQL copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      toast.error('Failed to copy SQL');
    });
  };

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-700 dark:text-gray-300">Loading dashboard...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="NFT Marketplace Admin Dashboard" />
      </Head>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back, Admin
          </div>
        </div>
        
        {missingTables.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3 w-full">
                <h3 className="text-sm font-medium text-yellow-800">Missing Database Tables</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>The following required tables are missing from your database:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {missingTables.map(table => (
                      <li key={table} className="flex items-center justify-between">
                        <span>{table}</span>
                        <button 
                          onClick={() => handleShowSql(table)}
                          className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                        >
                          <FiCode className="mr-1" />
                          View SQL
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    <p className="text-sm text-yellow-800 mb-2">
                      To fix this issue, you need to create the missing tables in your Supabase database:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-sm">
                      <li>Go to your <a href="https://app.supabase.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                      <li>Select your project</li>
                      <li>Go to the SQL Editor</li>
                      <li>Create a new query and paste the SQL code for each missing table</li>
                      <li>Run the query to create the tables</li>
                      <li>Refresh this page after creating all tables</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            
            {showSql && (
              <div className="mt-4 bg-gray-800 rounded-md p-4 text-white overflow-x-auto">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-white">SQL for {showSql} table</h4>
                  <button 
                    onClick={() => handleCopySql(sqlStatements[showSql])}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded flex items-center"
                  >
                    {copied ? <FiCheckCircle className="mr-1" /> : <FiCopy className="mr-1" />}
                    {copied ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>
                <pre className="text-xs whitespace-pre-wrap">{sqlStatements[showSql]}</pre>
              </div>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-sm font-medium uppercase">Total Users</h2>
              <FiUsers className="text-white opacity-75" size={24} />
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
            </div>
            <div className="mt-2 text-purple-100 text-sm">
              Registered platform users
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-sm font-medium uppercase">Total Balance</h2>
              <FiDollarSign className="text-white opacity-75" size={24} />
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{stats.totalBalance.toFixed(4)} ETH</div>
            </div>
            <div className="mt-2 text-blue-100 text-sm">
              Combined user balances
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-sm font-medium uppercase">Recent Changes (7d)</h2>
              <FiClock className="text-white opacity-75" size={24} />
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{stats.recentModifications}</div>
            </div>
            <div className="mt-2 text-green-100 text-sm">
              Balance modifications in last 7 days
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                href="/admin/users"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-md transition-colors flex items-center gap-2"
              >
                <FiUsers size={18} />
                <span>Manage Users</span>
              </Link>
              <Link 
                href="/admin/transactions"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors flex items-center gap-2"
              >
                <FiList size={18} />
                <span>View Balance Modifications</span>
              </Link>
              <Link 
                href="/admin/settings"
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-md transition-colors flex items-center gap-2"
              >
                <FiSettings size={18} />
                <span>Platform Settings</span>
              </Link>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Admin Guide</h2>
            <div className="text-gray-600 dark:text-gray-300 space-y-2">
              <p>As an admin, you can:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>View all user accounts</li>
                <li>Modify user balances</li>
                <li>Track balance modifications</li>
                <li>View transaction history</li>
              </ul>
              <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-md">
                <p className="text-sm text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <FiTrendingUp size={16} />
                  <span>All balance modifications are logged for security and auditing purposes.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
