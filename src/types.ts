export enum RoomCategory {
  MYSTERY = 'Mystery',
  HORROR = 'Horror',
  TREASURE_HUNT = 'Treasure Hunt',
  CONSPIRACY = 'Conspiracy',
  HISTORICAL = 'Historical',
  DAILY = 'Daily'
}

export enum RoomDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  EXPERT = 'Expert'
}

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  ADMIN = 'admin'
}

export interface User {
  uid: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  credibilityScore: number; // default 100
  level: number; // default 1
  rank: string; // "Explorer" etc.
  xp: number;
  coins: number;
  premium: boolean;
  role: 'user' | 'creator' | 'admin';
  interests: string[];
  createdAt: string;
  lastActiveAt?: string;
  purchasedRooms?: string[]; // array of roomIds of premium rooms purchased
}

export interface PuzzleObject {
  id: string;
  name: string;
  description: string;
  isKey: boolean;
}

export interface Puzzle {
  description: string;
  objects: PuzzleObject[];
  solution: string; // The text answer to match
  hints: string[];
}

export interface Room {
  roomId: string;
  title: string;
  description: string;
  category: RoomCategory;
  creatorId: string;
  creatorName?: string;
  difficulty: RoomDifficulty;
  status: 'active' | 'archived' | 'draft';
  thumbnail?: string;
  totalPlayers?: number;
  totalVisits?: number;
  premium: boolean;
  aiGenerated: boolean;
  story: string; // narrative text
  puzzle: Puzzle;
  hiddenLore: string[];
  evolvedLore?: string[];
  createdAt: string;
}

export interface Clue {
  clueId: string;
  roomId: string;
  userId: string;
  username: string;
  content: string; // text, voice url, or drawing base64 contents
  clueType: 'text' | 'voice' | 'drawing';
  helpfulVotes: number;
  misleadingVotes: number;
  funnyVotes: number;
  geniusVotes: number;
  netCredibility: number;
  flagged: boolean;
  createdAt: string;
}

export interface RoomProgress {
  userId: string;
  roomId: string;
  completed: boolean;
  completionTime: number; // seconds to solve
  score: number;
  cluesLeft: number;
  createdAt: string;
}

export interface MarketplaceRoom {
  listingId: string;
  roomId: string;
  creatorId: string;
  title: string;
  description: string;
  price: number; // in USD or Coins? USD listed like 1.99 - 4.99
  bundleItems?: string[];
  purchases: number;
  rating: number;
  revenue: number;
  createdAt: string;
}

export interface Subscription {
  userId: string;
  plan: 'free' | 'premium';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  active: boolean;
  expiresAt?: string;
}

export interface Notification {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type: 'vote' | 'achievement' | 'daily' | 'system';
  read: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string;
  score: number;
  rank: number;
}

export interface Leaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'alltime';
  category: 'mostHelpful' | 'bestDetective' | 'fastestSolver' | 'topCreator';
  entries: LeaderboardEntry[];
  updatedAt: string;
}
