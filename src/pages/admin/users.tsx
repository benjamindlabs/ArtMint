import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiUsers, FiChevronLeft, FiSearch, FiEdit, FiCheck, FiX, FiArrowUp, FiArrowDown, FiAlertTriangle, FiDatabase, FiCode, FiCopy } from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { isUserAdmin } from '../../utils/adminUtils';
import AdminLayout from '../../components/AdminLayout';
import { setupDatabase } from '../../utils/setupDatabase';

type UserData = {
  id: string;
  username: string;
  email: string;
  balance_eth: number;
  wallet_address: string | null;
  created_at: string;
  is_admin: boolean;
};

const AdminUsersPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editType, setEditType] = useState<'add' | 'subtract'>('add');
  const [sortField, setSortField] = useState<keyof UserData>('username');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [modifyingBalance, setModifyingBalance] = useState(false);
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
            // Check if required tables exist
            await checkRequiredTables();
            // Fetch users if admin
            fetchUsers();
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

  // Fetch all users
  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    
    try {
      // Check if profiles table exists
      if (missingTables.includes('profiles')) {
        setUsers([]);
        setFilteredUsers([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching users as admin...');
      
      // Simplified approach - just fetch all profiles
      // This works because we've set up a policy to allow everyone to view profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to fetch user profiles');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetched profiles:', profiles?.length || 0);
      
      // Format profiles into UserData objects
      const formattedUsers: UserData[] = [];
      
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile: any) => {
          formattedUsers.push({
            id: profile.id,
            username: profile.username || 'Unknown',
            email: profile.id === user?.id ? user.email || 'No email' : 'Email hidden',
            balance_eth: parseFloat(profile.balance_eth) || 0,
            wallet_address: profile.wallet_address,
            created_at: profile.created_at,
            is_admin: profile.is_admin || false,
          });
        });
      }
      
      // Make sure current user is included
      if (user && !formattedUsers.some(u => u.id === user.id)) {
        console.log('Adding current user to the list as they were not in the results');
        formattedUsers.push({
          id: user.id,
          username: user.email?.split('@')[0] || 'Current User',
          email: user.email || 'No email',
          balance_eth: 0,
          wallet_address: null,
          created_at: new Date().toISOString(),
          is_admin: true, // Current user must be admin to see this page
        });
      }
      
      // Apply sorting
      const sortedUsers = [...formattedUsers].sort((a, b) => {
        if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      
      console.log('Total users after processing:', sortedUsers.length);
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast.error('An error occurred while fetching users');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.wallet_address && user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleSort = (field: keyof UserData) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const startEditBalance = (userId: string) => {
    setEditingUserId(userId);
    setEditAmount('');
    setEditType('add');
  };

  const cancelEditBalance = () => {
    setEditingUserId(null);
    setEditAmount('');
  };

  // Save balance change
  const saveBalanceChange = async (userId: string, currentBalance: number) => {
    if (!editAmount || isNaN(parseFloat(editAmount)) || parseFloat(editAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setModifyingBalance(true);
    
    try {
      const amount = parseFloat(editAmount);
      const newBalance = editType === 'add' 
        ? currentBalance + amount
        : Math.max(0, currentBalance - amount); // Prevent negative balance
      
      // Check if required tables exist
      if (missingTables.includes('profiles') || missingTables.includes('balance_modifications')) {
        toast.error('Required database tables are missing. Please create the missing tables first.');
        setModifyingBalance(false);
        return;
      }
      
      console.log(`Modifying balance for user ${userId}: ${editType === 'add' ? '+' : '-'}${amount} ETH`);
      
      // Update user balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance_eth: newBalance })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating balance:', updateError);
        toast.error('Failed to update user balance');
        setModifyingBalance(false);
        return;
      }
      
      // Record the modification
      const { error: logError } = await supabase
        .from('balance_modifications')
        .insert({
          user_id: userId,
          admin_id: user?.id,
          amount: editType === 'add' ? amount : -amount,
          previous_balance: currentBalance,
          new_balance: newBalance,
          reason: `Manual ${editType === 'add' ? 'addition' : 'subtraction'} by admin`
        });
      
      if (logError) {
        console.error('Error logging balance modification:', logError);
        
        if (logError.code === '42P01') {
          toast.warning('Balance updated but balance_modifications table does not exist');
          setMissingTables(prev => prev.includes('balance_modifications') ? prev : [...prev, 'balance_modifications']);
        } else {
          toast.warning('Balance updated but failed to log the modification');
        }
      } else {
        console.log('Successfully logged balance modification');
      }
      
      // Update local state
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return { ...u, balance_eth: newBalance };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      setFilteredUsers(
        filteredUsers.map(u => {
          if (u.id === userId) {
            return { ...u, balance_eth: newBalance };
          }
          return u;
        })
      );
      
      toast.success(`Successfully ${editType === 'add' ? 'added' : 'subtracted'} ${amount} ETH ${editType === 'add' ? 'to' : 'from'} user balance`);
      
      // Reset edit state
      setEditingUserId(null);
      setEditAmount('');
    } catch (error) {
      console.error('Error in saveBalanceChange:', error);
      toast.error('An error occurred while updating the balance');
    } finally {
      setModifyingBalance(false);
    }
  };

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-700 dark:text-gray-300">Loading users...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Manage Users | Admin Dashboard</title>
        <meta name="description" content="Admin user management dashboard" />
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Manage Users</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all registered users on the platform.
        </p>
      </div>
      
      {missingTables.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <FiAlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" size={20} />
            <div className="ml-3 w-full">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Missing Database Tables
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                <p>The following required tables are missing from your database:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {missingTables.map(table => (
                    <li key={table} className="flex items-center justify-between">
                      <span>{table}</span>
                      <button 
                        onClick={() => handleShowSql(table)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center text-xs"
                      >
                        <FiCode className="mr-1" />
                        View SQL
                      </button>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                    To fix this issue, you need to create the missing tables in your Supabase database:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-sm">
                    <li>Go to your <a href="https://app.supabase.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">Supabase Dashboard</a></li>
                    <li>Select your project</li>
                    <li>Go to the SQL Editor</li>
                    <li>Create a new query and paste the SQL code for each missing table</li>
                    <li>Run the query to create the tables</li>
                    <li>Refresh this page after creating all tables</li>
                  </ol>
                </div>
                
                {showSql && (
                  <div className="mt-4 bg-gray-800 rounded-md p-4 text-white overflow-x-auto">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-white">SQL for {showSql} table</h4>
                      <button 
                        onClick={() => handleCopySql(sqlStatements[showSql])}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded flex items-center"
                      >
                        {copied ? <FiCheck className="mr-1" /> : <FiCopy className="mr-1" />}
                        {copied ? 'Copied!' : 'Copy SQL'}
                      </button>
                    </div>
                    <pre className="text-xs whitespace-pre-wrap">{sqlStatements[showSql]}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={missingTables.includes('profiles')}
            />
            <FiSearch className="absolute right-3 top-2.5 text-gray-400" />
          </div>
          
          <Link
            href="/admin"
            className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center"
          >
            <FiChevronLeft className="mr-1" />
            Back to Dashboard
          </Link>
        </div>
        
        {missingTables.includes('profiles') ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Cannot display users because the profiles table is missing.
              Please create the required tables first.
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            {searchTerm ? (
              <p className="text-gray-500 dark:text-gray-400">No users found matching "{searchTerm}"</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No users registered yet.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('username')}
                  >
                    <div className="flex items-center">
                      Username
                      {sortField === 'username' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('balance_eth')}
                  >
                    <div className="flex items-center">
                      Balance
                      {sortField === 'balance_eth' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Created
                      {sortField === 'created_at' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.username}
                        {user.is_admin && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingUserId === user.id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as 'add' | 'subtract')}
                            disabled={missingTables.includes('balance_modifications')}
                          >
                            <option value="add">Add</option>
                            <option value="subtract">Subtract</option>
                          </select>
                          <input
                            type="number"
                            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm w-20"
                            placeholder="Amount"
                            step="0.01"
                            min="0"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            disabled={missingTables.includes('balance_modifications')}
                          />
                          <button
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            onClick={() => saveBalanceChange(user.id, user.balance_eth)}
                            disabled={modifyingBalance || missingTables.includes('balance_modifications')}
                          >
                            {modifyingBalance ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                            ) : (
                              <FiCheck size={18} />
                            )}
                          </button>
                          <button
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            onClick={cancelEditBalance}
                            disabled={modifyingBalance}
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {user.balance_eth.toFixed(4)} ETH
                          </span>
                          <button
                            className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                            onClick={() => startEditBalance(user.id)}
                            disabled={missingTables.includes('balance_modifications')}
                            title={missingTables.includes('balance_modifications') ? "Cannot modify balance: balance_modifications table is missing" : ""}
                          >
                            <FiEdit size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {!missingTables.includes('balance_modifications') ? (
                        <Link
                          href={`/admin/user-history/${user.id}`}
                          className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mr-3"
                        >
                          View History
                        </Link>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 cursor-not-allowed" title="Cannot view history: balance_modifications table is missing">
                          View History
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
