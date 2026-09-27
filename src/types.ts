export interface CostDetails {
  materialsCost: number;
  laborHours: number;
  hourlyRate: number;
  overheadCost: number;
  targetMarginPercent: number;
}

export interface ArtisanProfile {
  makerName: string;
  studioName: string;
  craftSpecialty: string;
  location: string;
  bio: string;
  instagramHandle: string;
  websiteUrl: string;
  defaultHourlyRate: number;
  defaultOverheadRate: number;
  standardMarginPercent: number;
}

export interface ProductIdea {
  id: string;
  name: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Master Artisan';
  estimatedHours: number;
  materialsCost: number;
  suggestedRetail: number;
  profitMarginPercent: number;
  materials: string;
  craftTechnique: string;
  starterStory: string;
  photoUrl: string;
  whyItSells: string;
  marketDemand: 'Bestseller' | 'High Demand' | 'Trending' | 'Steady';
  bestSeason: string;
  tags: string[];
}

export interface ProductInput {
  id: string;
  name: string;
  ownerName?: string;
  productDetails?: string;
  targetAudience?: string;
  category: string;
  currentPrice: number | null;
  cost?: number | null;
  materials: string;
  story: string;
  craftTechnique: string;
  photoUrl: string;
  caption?: string;
  productDescription?: string;
  productIdea?: string;
  costDetails: CostDetails;
}

export interface PlatformCaption {
  title?: string;
  body: string;
  hashtags: string[];
  callToAction?: string;
  hook?: string;
  audioIdea?: string;
}

export interface MarketingContent {
  captions: {
    instagram: PlatformCaption;
    facebook: PlatformCaption;
    tiktok: PlatformCaption;
  };
  descriptions: {
    short: string;
    story: string;
    bulletPoints: string[];
    careInstructions: string;
  };
  promotional: {
    marketPitch: string;
    limitedDrop: string;
    makerStory: string;
  };
  pricing: {
    suggestedRetail: number;
    wholesale: number;
    minBreakeven: number;
    profitMarginPercent: number;
    pricingTip: string;
    marketComparison: string;
  };
  generatedAt: string;
  isAiGenerated: boolean;
  aiModelUsed: string;
  isSimulated: boolean;
  userSatisfied: boolean;
}

export interface SavedCraft {
  id: string;
  product: ProductInput;
  content: MarketingContent;
  status: 'draft' | 'approved' | 'posted';
  createdAt: string;
  copyCount: number;
  lastCopiedPlatform?: string;
}

export interface AnalyticsMetrics {
  totalGenerated: number;
  totalApproved: number;
  totalCopies: number;
  estimatedRevenueBoost: number;
  hoursSaved: number;
  platformShares: {
    instagram: number;
    facebook: number;
    tiktok: number;
    marketplaces: number;
  };
  recentActivities: {
    id: string;
    timestamp: string;
    action: string;
    productName: string;
    platform?: string;
  }[];
}
