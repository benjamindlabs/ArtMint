import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiZap, FiImage, FiSettings, FiDownload } from 'react-icons/fi';

export default function AIGeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const styles = [
    { id: 'realistic', name: 'Realistic', description: 'Photorealistic images' },
    { id: 'artistic', name: 'Artistic', description: 'Painterly and artistic style' },
    { id: 'anime', name: 'Anime', description: 'Japanese animation style' },
    { id: 'abstract', name: 'Abstract', description: 'Abstract and conceptual' },
    { id: 'cyberpunk', name: 'Cyberpunk', description: 'Futuristic cyberpunk aesthetic' },
    { id: 'fantasy', name: 'Fantasy', description: 'Magical and fantastical themes' }
  ];

  const sizes = [
    { id: '512x512', name: '512×512', description: 'Square, small' },
    { id: '1024x1024', name: '1024×1024', description: 'Square, large' },
    { id: '1024x768', name: '1024×768', description: 'Landscape' },
    { id: '768x1024', name: '768×1024', description: 'Portrait' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    // Simulate AI generation (replace with actual API call)
    setTimeout(() => {
      // Mock generated images
      const mockImages = [
        'https://picsum.photos/512/512?random=1',
        'https://picsum.photos/512/512?random=2',
        'https://picsum.photos/512/512?random=3',
        'https://picsum.photos/512/512?random=4'
      ];
      setGeneratedImages(mockImages);
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <>
      <Head>
        <title>AI Generate | NFT Marketplace</title>
        <meta name="description" content="Generate NFT art with AI" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
            >
              <FiArrowLeft className="mr-2" />
              Back to Dashboard
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <FiZap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  AI Art Generator
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Create unique NFT art with artificial intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-6 mb-8 text-white">
            <div className="flex items-center space-x-3">
              <FiZap className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Coming Soon!</h2>
                <p className="mt-1 opacity-90">
                  AI-powered NFT generation is currently in development. This feature will integrate with leading AI art platforms.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Generation Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Generate Your Art
                </h2>

                {/* Prompt Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Describe your artwork
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A majestic dragon flying over a cyberpunk city at sunset, digital art, highly detailed..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Be specific and descriptive for better results
                  </p>
                </div>

                {/* Style Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Art Style
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {styles.map((styleOption) => (
                      <button
                        key={styleOption.id}
                        onClick={() => setStyle(styleOption.id)}
                        disabled
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          style === styleOption.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        } opacity-50 cursor-not-allowed`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {styleOption.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {styleOption.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Image Size
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {sizes.map((sizeOption) => (
                      <button
                        key={sizeOption.id}
                        onClick={() => setSize(sizeOption.id)}
                        disabled
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          size === sizeOption.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        } opacity-50 cursor-not-allowed`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {sizeOption.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {sizeOption.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg opacity-50 cursor-not-allowed"
                >
                  <FiZap className="inline mr-2" />
                  Generate Art (Coming Soon)
                </button>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Preview
                </h3>

                {isGenerating ? (
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Generating...</p>
                    </div>
                  </div>
                ) : generatedImages.length > 0 ? (
                  <div className="space-y-4">
                    {generatedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Generated ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 px-3 py-1 rounded-md text-sm font-medium">
                            <FiDownload className="inline mr-1" />
                            Use This
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Generated images will appear here
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Planned Features */}
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Planned Features
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Multiple AI model options</li>
                  <li>• Style transfer capabilities</li>
                  <li>• Batch generation</li>
                  <li>• Custom model training</li>
                  <li>• Advanced prompt engineering</li>
                  <li>• Direct NFT minting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
