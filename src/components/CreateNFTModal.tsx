import { useState } from 'react';
import { FiX, FiImage, FiVideo, FiMusic, FiBox, FiZap, FiLayers } from 'react-icons/fi';
import Link from 'next/link';

interface CreateNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateNFTModal({ isOpen, onClose }: CreateNFTModalProps) {
  if (!isOpen) return null;

  const createOptions = [
    {
      id: 'single',
      title: 'Single NFT',
      description: 'Create a unique digital asset',
      icon: FiImage,
      href: '/create',
      color: 'bg-purple-500',
      popular: true
    },
    {
      id: 'collection',
      title: 'Collection',
      description: 'Group related NFTs together',
      icon: FiLayers,
      href: '/dashboard/create-collection',
      color: 'bg-blue-500'
    },
    {
      id: 'batch',
      title: 'Batch Upload',
      description: 'Upload multiple items at once',
      icon: FiBox,
      href: '/create/batch',
      color: 'bg-green-500'
    },
    {
      id: 'ai-generate',
      title: 'AI Generate',
      description: 'Create art with AI assistance',
      icon: FiZap,
      href: '/create/ai-generate',
      color: 'bg-orange-500',
      badge: 'Coming Soon'
    }
  ];

  const contentTypes = [
    { id: 'image', label: 'Image', icon: FiImage, formats: 'JPG, PNG, GIF, SVG' },
    { id: 'video', label: 'Video', icon: FiVideo, formats: 'MP4, WebM, MOV' },
    { id: 'audio', label: 'Audio', icon: FiMusic, formats: 'MP3, WAV, FLAC' },
    { id: '3d', label: '3D Model', icon: FiBox, formats: 'GLB, GLTF, OBJ' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New NFT
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose how you'd like to create your digital asset
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Creation Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {createOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <Link
                  key={option.id}
                  href={option.href}
                  className="relative p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 transition-colors group"
                  onClick={onClose}
                >
                  {option.popular && (
                    <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      Popular
                    </div>
                  )}
                  {option.badge && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      {option.badge}
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${option.color} text-white`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        {option.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Content Types */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Supported Content Types
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {contentTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <div
                    key={type.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center"
                  >
                    <IconComponent className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {type.label}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {type.formats}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
              💡 Quick Tips
            </h5>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Ensure your content is original and you own the rights</li>
              <li>• Higher resolution images (at least 1000x1000px) work best</li>
              <li>• Add detailed descriptions and attributes for better discoverability</li>
              <li>• Consider setting royalties to earn from future sales</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
