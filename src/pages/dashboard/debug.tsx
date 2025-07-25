import Head from 'next/head';
import DashboardDebugger from '../../components/DashboardDebugger';

export default function DashboardDebug() {
  return (
    <>
      <Head>
        <title>Dashboard Debug - ArtMint</title>
        <meta name="description" content="Debug dashboard authentication and database issues" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <DashboardDebugger />
      </div>
    </>
  );
}
