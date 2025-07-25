import '@/styles/tailwind.css';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import { useEffect } from 'react';
import { setupDatabase } from '@/utils/setupDatabase';

function AppContent({ Component, pageProps }: AppProps) {

  useEffect(() => {
    // Initialize database tables
    const initDatabase = async () => {
      try {
        const result = await setupDatabase();
        if (result.createdTables && result.createdTables.length > 0) {
          console.log('Created tables:', result.createdTables);
        }
        if (result.errors && Object.keys(result.errors).length > 0) {
          console.error('Database setup errors:', result.errors);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initDatabase();
  }, []);

  return (
    <>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <AuthProvider>
          <AppContent {...props} />
        </AuthProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}
