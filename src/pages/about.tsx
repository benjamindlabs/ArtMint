import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import TestComponent from '../components/TestComponent';

export default function About() {
  return (
    <>
      <Head>
        <title>About | ArtMint NFT Marketplace</title>
        <meta name="description" content="Learn about ArtMint NFT Marketplace" />
      </Head>

      <div className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
              About ArtMint
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              ArtMint is a revolutionary NFT marketplace built on shared liquidity smart contracts,
              providing the best possible experience for creators and collectors.
            </p>
          </div>

          {/* Mission Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold mb-6 dark:text-white">Our Mission</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                ArtMint was founded with a simple mission: to make digital art and collectibles accessible
                to everyone while ensuring creators are fairly compensated for their work.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We believe in the power of blockchain technology to revolutionize ownership and provenance 
                in the digital world, creating new opportunities for artists, collectors, and enthusiasts.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Our platform is built on the principles of transparency, security, and community, 
                ensuring a trusted environment for all participants in the NFT ecosystem.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <Image 
                src="https://picsum.photos/id/28/800/600"
                alt="Our Mission"
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-12 text-center dark:text-white">Why Choose ArtMint</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 dark:text-white">Secure Transactions</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Our platform leverages blockchain technology to ensure all transactions are secure, 
                  transparent, and immutable.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 dark:text-white">Low Gas Fees</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We&apos;ve optimized our smart contracts to minimize gas fees, making it more affordable
                  for creators and collectors to participate.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 dark:text-white">Vibrant Community</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Join a thriving community of artists, collectors, and enthusiasts who share a passion 
                  for digital art and innovation.
                </p>
              </div>
            </div>
          </div>

          {/* Developer Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-8 text-center dark:text-white">Meet the Developer</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 text-center mb-12 max-w-3xl mx-auto">
              ArtMint is a solo project built from the ground up by a passionate full-stack developer
              dedicated to creating innovative Web3 solutions and empowering the NFT ecosystem.
            </p>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="md:flex">
                  {/* Profile Image */}
                  <div className="md:w-1/3">
                    <div className="h-80 md:h-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                      <div className="w-64 h-64 md:w-full md:h-full bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 rounded-full md:rounded-none flex items-center justify-center shadow-xl">
                        <div className="text-white text-5xl md:text-7xl font-bold tracking-wider">
                          IB
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Profile Content */}
                  <div className="md:w-2/3 p-8 md:p-12">
                    <div className="mb-6">
                      <h3 className="text-2xl md:text-3xl font-bold mb-2 dark:text-white">Iboi Benjamin</h3>
                      <p className="text-purple-600 dark:text-purple-400 text-lg font-medium mb-4">
                        Founder & Software Engineer
                      </p>
                      <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"></div>
                    </div>

                    <div className="space-y-4 text-gray-600 dark:text-gray-400">
                      <p>
                        As the sole architect behind ArtMint, I&apos;ve built this comprehensive NFT marketplace
                        from concept to deployment, handling everything from smart contract development
                        to frontend design and user experience optimization.
                      </p>

                      <p>
                        With expertise spanning blockchain technology, full-stack web development, and
                        smart contract security, I&apos;ve created a platform that prioritizes both innovation
                        and user safety in the rapidly evolving Web3 space.
                      </p>

                      <p>
                        My passion for decentralized technologies and commitment to empowering digital
                        creators drives every aspect of ArtMint&apos;s development, ensuring a platform that
                        truly serves the NFT community.
                      </p>
                    </div>

                    {/* Skills/Technologies */}
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold mb-4 dark:text-white">Core Technologies</h4>
                      <div className="flex flex-wrap gap-2">
                        {['Solidity', 'Next.js', 'TypeScript', 'Ethereum', 'IPFS', 'Web3', 'Smart Contracts', 'React'].map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Join the Revolution?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Start your journey in the world of NFTs today. Create, collect, and connect with a global community of digital art enthusiasts.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/marketplace" className="px-8 py-3 bg-white text-purple-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                Explore Marketplace
              </Link>
              <Link href="/creators" className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-medium">
                Become a Creator
              </Link>
            </div>
          </div>
        </div>

        {/* Test Component for Fast Refresh */}
        <div className="container mx-auto px-4 pb-16">
          <TestComponent />
        </div>
      </div>
    </>
  );
}
