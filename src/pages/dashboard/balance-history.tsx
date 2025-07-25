import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiFilter } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';

type BalanceModification = {
  id: string;
  user_id: string;
  modified_by?: string;
  amount: number;
  is_deposit: boolean;
  reason: string;
  created_at: string;
  admin?: {
    username: string;
  };
};

const BalanceHistoryPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<BalanceModification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Fetch user's balance history
  useEffect(() => {
    const fetchBalanceHistory = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // First check if the balance_modifications table exists
        const { error: checkError } = await supabase
          .from('balance_modifications')
          .select('id')
          .limit(1);
        
        if (checkError) {
          console.error('Error checking balance_modifications table:', checkError);
          setTransactions([]);
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('balance_modifications')
          .select(`
            *,
            admin:modified_by(username)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching balance history:', error);
          setTransactions([]);
        } else {
          setTransactions(data || []);
        }
      } catch (error) {
        console.error('Error fetching balance history:', error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBalanceHistory();
  }, [user]);

  // Filter transactions based on date
  const filteredTransactions = transactions.filter(transaction => {
    if (dateFilter === 'all') return true;
    
    const transactionDate = new Date(transaction.created_at);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return transactionDate.getDate() === now.getDate() &&
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear();
    }
    
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return transactionDate >= weekAgo;
    }
    
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return transactionDate >= monthAgo;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  return (
    <>
      <Head>
        <title>Balance History | NFT Marketplace</title>
        <meta name="description" content="View your balance modification history" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/dashboard" className="mr-4 text-gray-600 hover:text-gray-900">
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Balance History</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Balance Modifications</h2>
            <div className="flex items-center">
              <FiFilter className="mr-2 text-gray-500" />
              <select
                className="border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
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

          {isLoading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              <p className="mt-2 text-gray-500">Loading your balance history...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.is_deposit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {transaction.is_deposit ? 'Deposit' : 'Withdrawal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{parseFloat(transaction.amount.toString()).toFixed(4)} ETH
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.admin?.username || 'Admin'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {transaction.reason}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No balance modifications found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BalanceHistoryPage;
