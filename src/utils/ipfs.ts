/**
 * IPFS integration for NFT metadata and file storage
 */

// IPFS configuration
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

// Fallback to public IPFS gateway for development
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

// NFT Metadata interface
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
    max_value?: number;
  }>;
  background_color?: string;
  youtube_url?: string;
}

// IPFS service class
export class IPFSService {
  private static instance: IPFSService;
  private apiKey: string | undefined;
  private secretKey: string | undefined;
  private jwt: string | undefined;

  constructor() {
    this.apiKey = PINATA_API_KEY;
    this.secretKey = PINATA_SECRET_KEY;
    this.jwt = PINATA_JWT;
  }

  static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService();
    }
    return IPFSService.instance;
  }

  // Check if Pinata credentials are available
  private hasPinataCredentials(): boolean {
    return !!(this.jwt || (this.apiKey && this.secretKey));
  }

  // Upload file to IPFS via Pinata
  async uploadFile(file: File): Promise<{ success: boolean; hash?: string; url?: string; error?: string }> {
    try {
      if (!this.hasPinataCredentials()) {
        return {
          success: false,
          error: 'IPFS credentials not configured. Please set up Pinata API keys.'
        };
      }

      const formData = new FormData();
      formData.append('file', file);

      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          uploadedBy: 'ArtMint',
          timestamp: new Date().toISOString()
        }
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      const headers: HeadersInit = {};
      if (this.jwt) {
        headers['Authorization'] = `Bearer ${this.jwt}`;
      } else if (this.apiKey && this.secretKey) {
        headers['pinata_api_key'] = this.apiKey;
        headers['pinata_secret_api_key'] = this.secretKey;
      }

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.details || 'Failed to upload to IPFS');
      }

      const result = await response.json();
      const hash = result.IpfsHash;
      const url = `${IPFS_GATEWAY}${hash}`;

      return {
        success: true,
        hash,
        url
      };
    } catch (error: any) {
      console.error('Error uploading file to IPFS:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload file to IPFS'
      };
    }
  }

  // Upload JSON metadata to IPFS
  async uploadMetadata(metadata: NFTMetadata): Promise<{ success: boolean; hash?: string; url?: string; error?: string }> {
    try {
      if (!this.hasPinataCredentials()) {
        return {
          success: false,
          error: 'IPFS credentials not configured. Please set up Pinata API keys.'
        };
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.jwt) {
        headers['Authorization'] = `Bearer ${this.jwt}`;
      } else if (this.apiKey && this.secretKey) {
        headers['pinata_api_key'] = this.apiKey;
        headers['pinata_secret_api_key'] = this.secretKey;
      }

      const body = {
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name}_metadata.json`,
          keyvalues: {
            type: 'nft-metadata',
            uploadedBy: 'ArtMint',
            timestamp: new Date().toISOString()
          }
        },
        pinataOptions: {
          cidVersion: 0
        }
      };

      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.details || 'Failed to upload metadata to IPFS');
      }

      const result = await response.json();
      const hash = result.IpfsHash;
      const url = `${IPFS_GATEWAY}${hash}`;

      return {
        success: true,
        hash,
        url
      };
    } catch (error: any) {
      console.error('Error uploading metadata to IPFS:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload metadata to IPFS'
      };
    }
  }

  // Fetch metadata from IPFS
  async fetchMetadata(hash: string): Promise<{ success: boolean; metadata?: NFTMetadata; error?: string }> {
    try {
      const url = `${IPFS_GATEWAY}${hash}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const metadata = await response.json();
      return {
        success: true,
        metadata
      };
    } catch (error: any) {
      console.error('Error fetching metadata from IPFS:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch metadata from IPFS'
      };
    }
  }

  // Create complete NFT metadata with file upload
  async createNFTMetadata(
    file: File,
    name: string,
    description: string,
    attributes?: Array<{ trait_type: string; value: string | number; display_type?: string; max_value?: number }>,
    externalUrl?: string
  ): Promise<{ success: boolean; metadataUrl?: string; imageUrl?: string; error?: string }> {
    try {
      // First upload the file
      const fileUpload = await this.uploadFile(file);
      if (!fileUpload.success) {
        return {
          success: false,
          error: fileUpload.error || 'Failed to upload file'
        };
      }

      // Create metadata object
      const metadata: NFTMetadata = {
        name,
        description,
        image: fileUpload.url!,
        external_url: externalUrl,
        attributes: attributes || []
      };

      // Add animation_url for video files
      if (file.type.startsWith('video/')) {
        metadata.animation_url = fileUpload.url!;
      }

      // Upload metadata
      const metadataUpload = await this.uploadMetadata(metadata);
      if (!metadataUpload.success) {
        return {
          success: false,
          error: metadataUpload.error || 'Failed to upload metadata'
        };
      }

      return {
        success: true,
        metadataUrl: metadataUpload.url!,
        imageUrl: fileUpload.url!
      };
    } catch (error: any) {
      console.error('Error creating NFT metadata:', error);
      return {
        success: false,
        error: error.message || 'Failed to create NFT metadata'
      };
    }
  }

  // Get IPFS URL from hash
  static getIPFSUrl(hash: string): string {
    return `${IPFS_GATEWAY}${hash}`;
  }

  // Extract hash from IPFS URL
  static extractHashFromUrl(url: string): string | null {
    const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  // Validate IPFS hash
  static isValidIPFSHash(hash: string): boolean {
    // Basic validation for IPFS hash (CIDv0 and CIDv1)
    return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|B[A-Z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{48})$/.test(hash);
  }
}

// Export singleton instance
export const ipfsService = IPFSService.getInstance();

// Utility functions
export const uploadFileToIPFS = (file: File) => ipfsService.uploadFile(file);
export const uploadMetadataToIPFS = (metadata: NFTMetadata) => ipfsService.uploadMetadata(metadata);
export const fetchMetadataFromIPFS = (hash: string) => ipfsService.fetchMetadata(hash);
export const createNFTMetadata = (
  file: File,
  name: string,
  description: string,
  attributes?: Array<{ trait_type: string; value: string | number; display_type?: string; max_value?: number }>,
  externalUrl?: string
) => ipfsService.createNFTMetadata(file, name, description, attributes, externalUrl);
