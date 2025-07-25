import { useState } from 'react';
import Head from 'next/head';
import { supabase } from '../../utils/supabaseClient';
import { setupDatabase } from '../../utils/setupDatabase';
import { FiDatabase, FiCheck, FiX, FiAlertCircle, FiPlay } from 'react-icons/fi';

export default function DatabaseSetup() {
  const [setupResult, setSetupResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [manualSql, setManualSql] = useState('');

  const runDatabaseSetup = async () => {
    setIsRunning(true);
    try {
      const result = await setupDatabase();
      setSetupResult(result);
    } catch (error) {
      setSetupResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const executeManualSql = async () => {
    if (!manualSql.trim()) return;
    
    setIsRunning(true);
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: manualSql });
      
      if (error) {
        setSetupResult({
          success: false,
          error: error.message,
          manual: true
        });
      } else {
        setSetupResult({
          success: true,
          message: 'SQL executed successfully',
          data,
          manual: true
        });
      }
    } catch (error) {
      setSetupResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        manual: true
      });
    } finally {
      setIsRunning(false);
    }
  };

  const createUserProfileFunction = async () => {
    const sql = `
-- Create function to manually create user profile
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_username TEXT,
  user_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (user_id, user_username, user_created_at)
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    created_at = EXCLUDED.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    setManualSql(sql);
  };

  return (
    <>
      <Head>
        <title>Database Setup - ArtMint Admin</title>
        <meta name="description" content="Set up database tables and functions" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <FiDatabase className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Database Setup
              </h1>
            </div>

            {/* Automatic Setup */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Automatic Setup
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Check for missing database tables and get SQL statements to create them.
              </p>
              
              <button
                onClick={runDatabaseSetup}
                disabled={isRunning}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiPlay className="w-4 h-4" />
                <span>{isRunning ? 'Checking...' : 'Check Database Setup'}</span>
              </button>
            </div>

            {/* Manual SQL Execution */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Manual SQL Execution
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Execute SQL statements directly. Use this to create tables and functions.
              </p>
              
              <div className="mb-4">
                <button
                  onClick={createUserProfileFunction}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Load Profile Function SQL
                </button>
              </div>

              <textarea
                value={manualSql}
                onChange={(e) => setManualSql(e.target.value)}
                placeholder="Enter SQL statements here..."
                className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
              
              <button
                onClick={executeManualSql}
                disabled={isRunning || !manualSql.trim()}
                className="mt-2 flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiPlay className="w-4 h-4" />
                <span>{isRunning ? 'Executing...' : 'Execute SQL'}</span>
              </button>
            </div>

            {/* Results */}
            {setupResult && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {setupResult.manual ? 'SQL Execution' : 'Setup'} Results
                </h2>
                
                <div className={`border rounded-lg p-4 ${
                  setupResult.success 
                    ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
                    : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className="flex items-start space-x-3">
                    {setupResult.success ? (
                      <FiCheck className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <FiX className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {setupResult.success ? 'Success' : 'Error'}
                      </h3>
                      
                      {setupResult.error && (
                        <p className="text-red-600 dark:text-red-400 mt-1">
                          {setupResult.error}
                        </p>
                      )}
                      
                      {setupResult.message && (
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {setupResult.message}
                        </p>
                      )}

                      {setupResult.missingTables && setupResult.missingTables.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Missing Tables:
                          </h4>
                          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mt-1">
                            {setupResult.missingTables.map((table: string) => (
                              <li key={table}>{table}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {setupResult.createdTables && setupResult.createdTables.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Created Tables:
                          </h4>
                          <ul className="list-disc list-inside text-green-600 dark:text-green-400 mt-1">
                            {setupResult.createdTables.map((table: string) => (
                              <li key={table}>{table}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {setupResult.sqlStatements && Object.keys(setupResult.sqlStatements).length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            SQL Statements for Missing Tables:
                          </h4>
                          {Object.entries(setupResult.sqlStatements).map(([table, sql]) => (
                            <div key={table} className="mb-4">
                              <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                                {table}:
                              </h5>
                              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">
                                <code>{sql as string}</code>
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiAlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Setup Instructions
                  </h3>
                  <div className="text-blue-800 dark:text-blue-200 mt-1 text-sm">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Click "Check Database Setup" to see what tables are missing</li>
                      <li>Copy the SQL statements for missing tables</li>
                      <li>Run them in your Supabase SQL Editor, or paste them in the manual execution area</li>
                      <li>Alternatively, use the provided <code>database-setup.sql</code> file</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
