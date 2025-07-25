import { useState, useEffect, Suspense, lazy } from 'react';
import { SearchProvider } from '../contexts/SearchContext';
import { MarketplaceErrorBoundary } from '../components/ErrorBoundary';
import SEOHead, { generateMarketplaceStructuredData, generateWebsiteStructuredData } from '../components/SEOHead';
import { SkipLink } from '../components/AccessibilityProvider';

// Lazy load components for better performance
const SearchBar = lazy(() => import('../components/SearchBar'));
const SearchFilters = lazy(() => import('../components/SearchFilters'));
const SearchResults = lazy(() => import('../components/SearchResults'));

export default function Marketplace() {
  return (
    <MarketplaceErrorBoundary>
      <SearchProvider>
        <MarketplaceContent />
      </SearchProvider>
    </MarketplaceErrorBoundary>
  );
}

function MarketplaceContent() {
  const marketplaceStructuredData = generateMarketplaceStructuredData();
  const websiteStructuredData = generateWebsiteStructuredData(
    'ArtMint NFT Marketplace',
    process.env.NEXT_PUBLIC_SITE_URL || 'https://artmint.com',
    'Discover, create, and trade unique NFTs on ArtMint - the premier NFT marketplace for digital art and collectibles.'
  );

  return (
    <>
      <SEOHead
        title="NFT Marketplace - Discover Unique Digital Art"
        description="Explore thousands of unique NFTs from talented creators worldwide. Buy, sell, and trade digital art, collectibles, and more on ArtMint's secure marketplace."
        keywords={['NFT marketplace', 'digital art', 'crypto art', 'blockchain', 'collectibles', 'ethereum', 'buy NFT', 'sell NFT']}
        type="website"
        structuredData={[marketplaceStructuredData, websiteStructuredData]}
      />

      {/* Skip to main content link for accessibility */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white" role="banner">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6" id="page-title">
                Discover Amazing NFTs
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-purple-100">
                Explore, collect, and trade unique digital assets from talented creators worldwide
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <Suspense fallback={
                  <div className="w-full h-12 bg-white/20 rounded-lg animate-pulse"></div>
                }>
                  <SearchBar
                    placeholder="Search NFTs, collections, creators..."
                    className="w-full"
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="container mx-auto px-4 py-8" role="main">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-80 flex-shrink-0" role="complementary" aria-label="Search filters">
              <Suspense fallback={
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4" aria-label="Loading filters">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              }>
                <SearchFilters />
              </Suspense>
            </aside>

            {/* Search Results */}
            <section className="flex-1" role="region" aria-label="NFT search results">
              <Suspense fallback={
                <div className="space-y-6" aria-label="Loading search results">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }>
                <SearchResults />
              </Suspense>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}