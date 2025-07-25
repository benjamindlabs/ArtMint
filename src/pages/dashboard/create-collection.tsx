import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiUpload, FiInfo } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';

const CreateCollectionPage = () => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('art');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Will redirect to signin
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setBannerFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setLogoFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!name.trim()) {
      setError('Please enter a name for your collection');
      return;
    }
    
    if (!description.trim()) {
      setError('Please enter a description for your collection');
      return;
    }
    
    if (!bannerFile) {
      setError('Please upload a banner image for your collection');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Upload banner image to Supabase storage
      const bannerExt = bannerFile.name.split('.').pop();
      const bannerName = `${user.id}-${Math.random().toString(36).substring(2)}.${bannerExt}`;
      const bannerPath = `collections/${bannerName}`;
      
      const { error: bannerUploadError } = await supabase.storage
        .from('collections')
        .upload(bannerPath, bannerFile);
        
      if (bannerUploadError) {
        throw bannerUploadError;
      }
      
      // Get public URL for banner
      const { data: bannerData } = supabase.storage
        .from('collections')
        .getPublicUrl(bannerPath);
        
      const bannerUrl = bannerData.publicUrl;
      
      // Upload logo image if provided
      let logoUrl = null;
      if (logoFile) {
        const logoExt = logoFile.name.split('.').pop();
        const logoName = `${user.id}-logo-${Math.random().toString(36).substring(2)}.${logoExt}`;
        const logoPath = `collections/${logoName}`;
        
        const { error: logoUploadError } = await supabase.storage
          .from('collections')
          .upload(logoPath, logoFile);
          
        if (logoUploadError) {
          throw logoUploadError;
        }
        
        // Get public URL for logo
        const { data: logoData } = supabase.storage
          .from('collections')
          .getPublicUrl(logoPath);
          
        logoUrl = logoData.publicUrl;
      }
      
      // Insert collection into database
      const { error: insertError } = await supabase
        .from('collections')
        .insert({
          name,
          description,
          banner_url: bannerUrl,
          logo_url: logoUrl,
          category,
          creator_id: user.id,
          status: 'active'
        });
      
      if (insertError) {
        throw insertError;
      }
      
      // Update user to be a creator if they aren't already
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_creator: true })
        .eq('id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      setSuccess('Your collection has been created successfully!');
      
      // Reset form
      setName('');
      setDescription('');
      setCategory('art');
      setBannerFile(null);
      setBannerPreview(null);
      setLogoFile(null);
      setLogoPreview(null);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating collection:', error);
      setError('Failed to create collection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Collection | ArtMint NFT Marketplace</title>
        <meta name="description" content="Create a new NFT collection on ArtMint" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <FiArrowLeft className="mr-2" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Collection</h1>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-400">
                {success}
              </div>
            )}
            
            <div className="mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex">
                <FiInfo className="text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 dark:text-blue-400 text-sm">
                  Collections help you organize your NFT items. Create a collection first, then add items to it.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="banner-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Banner Image <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                    {bannerPreview ? (
                      <div className="w-full">
                        <div className="relative w-full aspect-[3/1] mb-3">
                          <img 
                            src={bannerPreview} 
                            alt="Banner Preview" 
                            className="mx-auto object-cover rounded-md w-full h-full"
                          />
                        </div>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setBannerFile(null);
                              setBannerPreview(null);
                            }}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label
                            htmlFor="banner-upload"
                            className="relative cursor-pointer rounded-md font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 focus-within:outline-none"
                          >
                            <span>Upload a banner</span>
                            <input
                              id="banner-upload"
                              name="banner-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleBannerChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Recommended: 1400×400px. PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Collection Logo (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                    {logoPreview ? (
                      <div className="w-full">
                        <div className="relative w-32 h-32 mx-auto mb-3">
                          <img 
                            src={logoPreview} 
                            alt="Logo Preview" 
                            className="mx-auto object-cover rounded-full w-full h-full"
                          />
                        </div>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setLogoFile(null);
                              setLogoPreview(null);
                            }}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label
                            htmlFor="logo-upload"
                            className="relative cursor-pointer rounded-md font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 focus-within:outline-none"
                          >
                            <span>Upload a logo</span>
                            <input
                              id="logo-upload"
                              name="logo-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleLogoChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Recommended: 350×350px. PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Collection Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g. 'Cosmic Horizons'"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Describe your collection..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="art">Art</option>
                    <option value="collectibles">Collectibles</option>
                    <option value="photography">Photography</option>
                    <option value="music">Music</option>
                    <option value="sports">Sports</option>
                    <option value="virtual-worlds">Virtual Worlds</option>
                    <option value="trading-cards">Trading Cards</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateCollectionPage;
