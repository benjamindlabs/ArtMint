// Type definitions for NFT Marketplace

export interface NFT {
  id: number | string;
  name: string;
  creator?: string;
  owner?: string;
  price: string;
  image: string;
  likes?: number;
  description?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  history?: Array<{
    event: string;
    from: string;
    to: string;
    price?: string;
    date: string;
  }>;
}

export interface Collection {
  id: number | string;
  name: string;
  items: number;
  image: string;
}

export interface UserProfile {
  address: string;
  fullAddress: string;
  username: string;
  bio?: string;
  joinedDate: string;
  profileImage?: string;
}
