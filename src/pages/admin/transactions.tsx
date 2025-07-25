import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'react-toastify';

type BalanceModification = {
  id: string;
  user_id: string;
  modified_by?: string;
  amount: number;
  is_deposit: boolean;
  reason: string;
  created_at: string;
  user_username?: string;
  admin_username?: string;
};

export default function AdminTransactions() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<BalanceModification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // Check if the user is shipfoward@gmail.com (admin)
      if (session.user.email === 'shipfoward@gmail.com') {
        console.log('Admin transactions page access granted to shipfoward@gmail.com');
        setIsAdmin(true);
        fetchTransactions();
        setIsLoading(false);
        return;
      }

      // Fallback to profile check
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (error) {
          // If the error is about missing column, check if it's our target admin
          if (error.message.includes('is_admin') && session.user.email === 'shipfoward@gmail.com') {
            setIsAdmin(true);
            fetchTransactions();
            return;
          }
          throw error;
        }
        
        if (!profile || !profile.is_admin) {
          toast.error('You do not have admin privileges');
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
        fetchTransactions();
      } catch (error) {
        console.error('Error checking admin status:', error);
        
        // If there's an error but the user is our target admin, still grant access
        if (session.user.email === 'shipfoward@gmail.com') {
          console.log('Admin transactions page access granted despite profile error');
          setIsAdmin(true);
          fetchTransactions();
          return;
        }
        
        toast.error('An error occurred while checking your permissions');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('An error occurred while checking your permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      // First check if the balance_modifications table exists
      const { error: checkError } = await supabase
        .from('balance_modifications')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking balance_modifications table:', checkError);
        setTransactions([]);
        return;
      }
      
      // Fetch balance modifications with user and admin usernames
      const { data, error } = await supabase
        .from('balance_modifications')
        .select(`
          *,
          user:user_id(username),
          admin:modified_by(username)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching balance modifications:', error);
        setTransactions([]);
        return;
      }
      
      // Transform data to include usernames directly
      const formattedData = data?.map(item => ({
        ...item,
        user_username: item.user?.username || 'Unknown User',
        admin_username: item.admin?.username || 'Admin'
      })) || [];
      
      setTransactions(formattedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
      setTransactions([]);
    }
  };

  // Filter transactions based on search term and date filter
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      (transaction.user_username?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (transaction.reason?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    if (dateFilter === 'all') return matchesSearch;
    
    const transactionDate = new Date(transaction.created_at);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return matchesSearch && 
        transactionDate.getDate() === now.getDate() &&
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear();
    }
    
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return matchesSearch && transactionDate >= weekAgo;
    }
    
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return matchesSearch && transactionDate >= monthAgo;
    }
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
        
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="w-full md:w-1/3">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                placeholder="Search by user or reason"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full md:w-auto">
            <label htmlFor="date-filter" className="sr-only">Filter by date</label>
            <select
              id="date-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.user_username || 'Unknown User'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.admin_username || 'Admin'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{parseFloat(transaction.amount.toString()).toFixed(4)} ETH
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.is_deposit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {transaction.is_deposit ? 'Deposit' : 'Withdrawal'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {transaction.reason}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
