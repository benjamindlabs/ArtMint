import Head from 'next/head';
import AuthTester from '../../components/AuthTester';

export default function AuthTest() {
  return (
    <>
      <Head>
        <title>Authentication Test Suite - ArtMint</title>
        <meta name="description" content="Test and debug authentication functionality" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <AuthTester />
      </div>
    </>
  );
}
