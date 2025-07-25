import { useState } from 'react';
import { FiPlus, FiChevronDown } from 'react-icons/fi';
import CreateNFTModal from './CreateNFTModal';
import Link from 'next/link';

interface EnhancedCreateButtonProps {
  variant?: 'button' | 'dropdown';
  className?: string;
}

export default function EnhancedCreateButton({ 
  variant = 'button', 
  className = '' 
}: EnhancedCreateButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const quickActions = [
    {
      label: 'Single NFT',
      href: '/create',
      description: 'Create a unique digital asset'
    },
    {
      label: 'Collection',
      href: '/dashboard/create-collection',
      description: 'Group related NFTs together'
    },
    {
      label: 'Batch Upload',
      href: '/create/batch',
      description: 'Upload multiple items at once'
    }
  ];

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${className}`}
        >
          <FiPlus className="mr-2 -ml-1 h-5 w-5" />
          Create
          <FiChevronDown className="ml-2 -mr-1 h-4 w-4" />
        </button>

        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
              <div className="py-1">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Create New NFT
                  </h3>
                </div>
                
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {action.description}
                    </div>
                  </Link>
                ))}
                
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowModal(true);
                    }}
                    className="block w-full text-left px-4 py-3 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    View all options →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <CreateNFTModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
        />
      </div>
    );
  }

  // Default button variant
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${className}`}
      >
        <FiPlus className="mr-2 -ml-1 h-5 w-5" />
        Create
      </button>

      <CreateNFTModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}
