import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';
import { FiUsers, FiDollarSign, FiArrowLeft } from 'react-icons/fi';

type User = {
  id: string;
  username: string;
  wallet_address: string | null;
  balance_eth: number;
  created_at: string;
};

export default function AdminPanel() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // Get current user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      // For now, we'll allow the user with email shipfoward@gmail.com to be admin
      // Since we can't modify the schema
      if (session.user.email !== 'shipfoward@gmail.com') {
        toast.error('You do not have admin privileges');
        router.push('/dashboard');
        return;
      }

      setCurrentUser(profile);
      fetchUsers();
    } catch (error) {
      console.error('Error checking auth status:', error);
      toast.error('An error occurred while checking your permissions');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, wallet_address, balance_eth, created_at')
        .order('username', { ascending: true });

      if (error) throw error;
      
      setUsers(data || []);

      // Calculate stats
      const totalUsers = data?.length || 0;
      const totalBalance = data?.reduce((sum, user) => sum + (parseFloat(user.balance_eth?.toString() || '0') || 0), 0) || 0;
      
      setStats({
        totalUsers,
        totalBalance
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleModifyBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue === 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for this modification');
      return;
    }

    try {
      setIsProcessing(true);
      
      const previousBalance = selectedUser.balance_eth;
      const newBalance = previousBalance + amountValue;

      // Update user balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          balance_eth: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Since we can't create a balance_modifications table, we'll just show a success message
      toast.success(`Successfully ${amountValue > 0 ? 'added' : 'subtracted'} ${Math.abs(amountValue)} ETH ${amountValue > 0 ? 'to' : 'from'} ${selectedUser.username}'s balance`);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, balance_eth: newBalance } 
          : user
      ));
      
      // Reset form
      setSelectedUser(null);
      setAmount('');
      setReason('');

      // Update stats
      setStats({
        ...stats,
        totalBalance: stats.totalBalance + amountValue
      });
    } catch (error) {
      console.error('Error modifying balance:', error);
      toast.error('Failed to modify user balance');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.wallet_address && user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Panel | NFT Marketplace</title>
        <meta name="description" content="Admin panel for NFT marketplace" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Admin Header */}
        <header className="bg-blue-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">Logged in as {currentUser?.username}</span>
              <Link href="/dashboard" className="bg-blue-700 hover:bg-blue-800 text-white text-sm py-1 px-3 rounded-md transition duration-200">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <FiUsers size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                  <FiDollarSign size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase">Total Balance (ETH)</p>
                  <p className="text-2xl font-bold">{stats.totalBalance.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">User Management</h2>
              <input
                type="text"
                placeholder="Search users..."
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wallet Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance (ETH)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {user.wallet_address ? 
                              `${user.wallet_address.substring(0, 6)}...${user.wallet_address.substring(user.wallet_address.length - 4)}` : 
                              'Not set'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{parseFloat(user.balance_eth?.toString() || '0').toFixed(4)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Modify Balance
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Modification Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Modify Balance for {selectedUser.username}</h2>
            <p className="mb-4">Current Balance: {parseFloat(selectedUser.balance_eth?.toString() || '0').toFixed(4)} ETH</p>
            
            <form onSubmit={handleModifyBalance}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Amount (ETH)
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">+/-</span>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="0.00"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use positive values to add, negative to subtract
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Reason
                </label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={3}
                  placeholder="Provide a reason for this balance modification"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={() => {
                    setSelectedUser(null);
                    setAmount('');
                    setReason('');
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
