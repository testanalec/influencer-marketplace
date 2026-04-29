export interface User {
  id: string;
  email: string;
  role: "INFLUENCER" | "COMPANY";
  createdAt: Date;
}

export interface InfluencerProfile {
  id: string;
  userId: string;
  name: string;
  bio: string;
  avatar?: string;
  country?: string;
  city?: string;
  niche: string;
  phone?: string;
  status?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
  facebook?: string;
  contactEmail?: string;
  instagramFollowers?: number;
  youtubeFollowers?: number;
  twitterFollowers?: number;
  tiktokFollowers?: number;
  facebookFollowers?: number;
  ratePerPost: number;
  currency: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  industry: string;
  website?: string;
  description: string;
  budget: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  companyId: string;
  influencerId: string;
  title: string;
  description: string;
  dealValue: number;
  commission: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
  createdAt: Date;
  updatedAt: Date;
}

export interface InfluencerWithUser extends InfluencerProfile {
  user: User;
}
