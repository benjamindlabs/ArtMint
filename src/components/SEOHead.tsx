import Head from 'next/head';
import { useRouter } from 'next/router';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  siteName?: string;
  locale?: string;
  alternateLocales?: string[];
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
  structuredData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = 'Discover, create, and trade unique NFTs on ArtMint - the premier NFT marketplace for digital art and collectibles.',
  keywords = ['NFT', 'marketplace', 'digital art', 'blockchain', 'crypto', 'collectibles', 'ethereum'],
  image = '/images/og-image.jpg',
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  siteName = 'ArtMint NFT Marketplace',
  locale = 'en_US',
  alternateLocales = [],
  noindex = false,
  nofollow = false,
  canonical,
  structuredData
}) => {
  const router = useRouter();
  const currentUrl = url || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artmint.com'}${router.asPath}`;
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const canonicalUrl = canonical || currentUrl;

  // Generate robots meta content
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="robots" content={robotsContent} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Author */}
      {author && <meta name="author" content={author} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Alternate locales */}
      {alternateLocales.map(altLocale => (
        <meta key={altLocale} property="og:locale:alternate" content={altLocale} />
      ))}
      
      {/* Article specific meta tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@ArtMintNFT" />
      <meta name="twitter:creator" content="@ArtMintNFT" />
      
      {/* Additional Meta Tags for NFT Marketplace */}
      <meta name="theme-color" content="#8B5CF6" />
      <meta name="msapplication-TileColor" content="#8B5CF6" />
      <meta name="application-name" content={siteName} />
      
      {/* Favicon and Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://ipfs.io" />
      <link rel="preconnect" href="https://gateway.pinata.cloud" />
      
      {/* DNS Prefetch for better performance */}
      <link rel="dns-prefetch" href="//picsum.photos" />
      <link rel="dns-prefetch" href="//cloudflare-ipfs.com" />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  );
};

export default SEOHead;

// Utility functions for generating structured data
export const generateWebsiteStructuredData = (siteName: string, url: string, description: string) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": siteName,
  "url": url,
  "description": description,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${url}/marketplace?search={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
});

export const generateNFTStructuredData = (nft: any) => ({
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": nft.name,
  "description": nft.description,
  "image": nft.image,
  "creator": {
    "@type": "Person",
    "name": nft.creator
  },
  "dateCreated": nft.createdAt,
  "url": `${process.env.NEXT_PUBLIC_SITE_URL}/nft/${nft.id}`,
  "offers": {
    "@type": "Offer",
    "price": nft.price,
    "priceCurrency": nft.currency,
    "availability": "https://schema.org/InStock"
  }
});

export const generateCollectionStructuredData = (collection: any) => ({
  "@context": "https://schema.org",
  "@type": "Collection",
  "name": collection.name,
  "description": collection.description,
  "image": collection.image,
  "creator": {
    "@type": "Person",
    "name": collection.creator
  },
  "numberOfItems": collection.itemCount,
  "url": `${process.env.NEXT_PUBLIC_SITE_URL}/collection/${collection.id}`
});

export const generateMarketplaceStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "ArtMint NFT Marketplace",
  "description": "Discover, create, and trade unique NFTs on ArtMint",
  "url": process.env.NEXT_PUBLIC_SITE_URL,
  "applicationCategory": "Marketplace",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "category": "Digital Art & Collectibles"
  },
  "featureList": [
    "NFT Creation",
    "NFT Trading",
    "Digital Wallet Integration",
    "Blockchain Verification",
    "Artist Royalties"
  ]
});

export const generateBreadcrumbStructuredData = (breadcrumbs: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": crumb.name,
    "item": crumb.url
  }))
});

// SEO utility functions
export const SEOUtils = {
  // Generate meta description from content
  generateDescription: (content: string, maxLength: number = 160): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3).trim() + '...';
  },

  // Generate keywords from content
  generateKeywords: (content: string, baseKeywords: string[] = []): string[] => {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const uniqueWords = Array.from(new Set(words));
    return [...baseKeywords, ...uniqueWords.slice(0, 10)];
  },

  // Validate and optimize title
  optimizeTitle: (title: string, siteName: string, maxLength: number = 60): string => {
    const fullTitle = `${title} | ${siteName}`;
    if (fullTitle.length <= maxLength) return title;
    
    const availableLength = maxLength - siteName.length - 3; // 3 for " | "
    return title.substring(0, availableLength).trim();
  }
};
