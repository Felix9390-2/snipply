import { type User, type InsertUser, type Snippet, type InsertSnippet, type SnippetLike, type SnippetView, type SnippetWithAuthor, type UserProfile, type Follow, type InsertFollow, type Notification, type InsertNotification, type NotificationWithDetails } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createAdminUser(user: InsertUser & { rank: 'admin' | 'default' }): Promise<User>;
  verifyPassword(username: string, password: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Snippet methods
  getSnippet(id: string): Promise<Snippet | undefined>;
  getSnippetWithAuthor(id: string): Promise<SnippetWithAuthor | undefined>;
  getSnippetsByAuthor(authorId: string): Promise<SnippetWithAuthor[]>;
  getUserOwnSnippets(authorId: string): Promise<SnippetWithAuthor[]>;
  getPublicSnippets(limit?: number, offset?: number): Promise<SnippetWithAuthor[]>;
  getTrendingSnippets(limit?: number): Promise<SnippetWithAuthor[]>;
  createSnippet(snippet: InsertSnippet & { authorId: string }): Promise<Snippet>;
  updateSnippet(id: string, updates: Partial<Snippet>): Promise<Snippet | undefined>;
  deleteSnippet(id: string): Promise<boolean>;
  incrementViews(snippetId: string, userId?: string, ipAddress?: string): Promise<void>;
  
  // Like methods
  likeSnippet(snippetId: string, userId: string): Promise<boolean>;
  unlikeSnippet(snippetId: string, userId: string): Promise<boolean>;
  isSnippetLiked(snippetId: string, userId: string): Promise<boolean>;
  getLikedSnippetsByUser(userId: string): Promise<SnippetWithAuthor[]>;
  
  // Search and filtering
  searchSnippets(query: string, isPublic?: boolean): Promise<SnippetWithAuthor[]>;
  
  // Admin methods  
  searchUsers(query: string): Promise<User[]>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getAllSnippets(limit?: number, offset?: number): Promise<SnippetWithAuthor[]>;
  deleteUserAndSnippets(userId: string): Promise<boolean>;
  
  // Follow methods
  followUser(followerId: string, followingId: string): Promise<boolean>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  getUserProfile(username: string, currentUserId?: string): Promise<UserProfile | undefined>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string, limit?: number): Promise<NotificationWithDetails[]>;
  markNotificationRead(id: string, userId: string): Promise<boolean>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private snippets: Map<string, Snippet>;
  private snippetLikes: Map<string, SnippetLike>;
  private snippetViews: Map<string, SnippetView>;
  private follows: Map<string, Follow>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.snippets = new Map();
    this.snippetLikes = new Map();
    this.snippetViews = new Map();
    this.follows = new Map();
    this.notifications = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = { 
      ...insertUser, 
      id,
      password: hashedPassword,
      displayName: insertUser.displayName || insertUser.username,
      avatarUrl: null,
      profilePicture: null,
      bio: insertUser.bio || null,
      location: insertUser.location || null,
      website: insertUser.website || null,
      rank: 'default',
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createAdminUser(insertUser: InsertUser & { rank: 'admin' | 'default' }): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = { 
      ...insertUser, 
      id,
      password: hashedPassword,
      displayName: insertUser.displayName || insertUser.username,
      avatarUrl: null,
      profilePicture: null,
      bio: insertUser.bio || null,
      location: insertUser.location || null,
      website: insertUser.website || null,
      rank: insertUser.rank,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Snippet methods
  async getSnippet(id: string): Promise<Snippet | undefined> {
    return this.snippets.get(id);
  }

  async getSnippetWithAuthor(id: string): Promise<SnippetWithAuthor | undefined> {
    const snippet = this.snippets.get(id);
    if (!snippet) return undefined;

    const author = this.users.get(snippet.authorId);
    if (!author) return undefined;

    return {
      ...snippet,
      author: {
        id: author.id,
        username: author.username,
        displayName: author.displayName || author.username,
        avatarUrl: author.avatarUrl,
        profilePicture: author.profilePicture,
      },
    };
  }

  async getSnippetsByAuthor(authorId: string): Promise<SnippetWithAuthor[]> {
    const author = this.users.get(authorId);
    if (!author) return [];

    const snippets = Array.from(this.snippets.values())
      .filter(snippet => snippet.authorId === authorId && snippet.isPublic)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return snippets.map(snippet => ({
      ...snippet,
      author: {
        id: author.id,
        username: author.username,
        displayName: author.displayName || author.username,
        avatarUrl: author.avatarUrl,
        profilePicture: author.profilePicture,
      },
    }));
  }

  async getUserOwnSnippets(authorId: string): Promise<SnippetWithAuthor[]> {
    const author = this.users.get(authorId);
    if (!author) return [];

    const snippets = Array.from(this.snippets.values())
      .filter(snippet => snippet.authorId === authorId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return snippets.map(snippet => ({
      ...snippet,
      author: {
        id: author.id,
        username: author.username,
        displayName: author.displayName || author.username,
        avatarUrl: author.avatarUrl,
        profilePicture: author.profilePicture,
      },
    }));
  }

  async getPublicSnippets(limit = 50, offset = 0): Promise<SnippetWithAuthor[]> {
    const publicSnippets = Array.from(this.snippets.values())
      .filter(snippet => snippet.isPublic)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(offset, offset + limit);

    return Promise.all(publicSnippets.map(async snippet => {
      const author = this.users.get(snippet.authorId)!;
      return {
        ...snippet,
        author: {
          id: author.id,
          username: author.username,
          displayName: author.displayName || author.username,
          avatarUrl: author.avatarUrl,
          profilePicture: author.profilePicture,
        },
      };
    }));
  }

  async getTrendingSnippets(limit = 20): Promise<SnippetWithAuthor[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const trendingSnippets = Array.from(this.snippets.values())
      .filter(snippet => snippet.isPublic && new Date(snippet.createdAt) > weekAgo)
      .sort((a, b) => (b.likes + b.views) - (a.likes + a.views))
      .slice(0, limit);

    return Promise.all(trendingSnippets.map(async snippet => {
      const author = this.users.get(snippet.authorId)!;
      return {
        ...snippet,
        author: {
          id: author.id,
          username: author.username,
          displayName: author.displayName || author.username,
          avatarUrl: author.avatarUrl,
          profilePicture: author.profilePicture,
        },
      };
    }));
  }

  async createSnippet(snippetData: InsertSnippet & { authorId: string }): Promise<Snippet> {
    const id = randomUUID();
    const now = new Date();
    const snippet: Snippet = {
      title: snippetData.title,
      description: snippetData.description || null,
      html: snippetData.html || "",
      css: snippetData.css || "",
      javascript: snippetData.javascript || "",
      isPublic: snippetData.isPublic ?? false,
      authorId: snippetData.authorId,
      id,
      views: 0,
      likes: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.snippets.set(id, snippet);
    return snippet;
  }

  async updateSnippet(id: string, updates: Partial<Snippet>): Promise<Snippet | undefined> {
    const snippet = this.snippets.get(id);
    if (!snippet) return undefined;

    const updatedSnippet = { 
      ...snippet, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.snippets.set(id, updatedSnippet);
    return updatedSnippet;
  }

  async deleteSnippet(id: string): Promise<boolean> {
    return this.snippets.delete(id);
  }

  async incrementViews(snippetId: string, userId?: string, ipAddress?: string): Promise<void> {
    // Check if this user/IP has already viewed this snippet
    const existingView = Array.from(this.snippetViews.values())
      .find(view => 
        view.snippetId === snippetId && 
        (userId ? view.userId === userId : view.ipAddress === ipAddress)
      );
    
    if (existingView) return; // Don't increment if already viewed

    // Record the view
    const viewId = randomUUID();
    const view: SnippetView = {
      id: viewId,
      snippetId,
      userId: userId || null,
      ipAddress: ipAddress || null,
      createdAt: new Date(),
    };
    
    this.snippetViews.set(viewId, view);

    // Increment view count on snippet
    const snippet = this.snippets.get(snippetId);
    if (snippet) {
      snippet.views += 1;
      this.snippets.set(snippetId, snippet);
    }
  }

  // Like methods
  async likeSnippet(snippetId: string, userId: string): Promise<boolean> {
    const existingLike = Array.from(this.snippetLikes.values())
      .find(like => like.snippetId === snippetId && like.userId === userId);
    
    if (existingLike) return false;

    const likeId = randomUUID();
    const like: SnippetLike = {
      id: likeId,
      snippetId,
      userId,
      createdAt: new Date(),
    };
    
    this.snippetLikes.set(likeId, like);

    // Increment likes count on snippet
    const snippet = this.snippets.get(snippetId);
    if (snippet) {
      snippet.likes += 1;
      this.snippets.set(snippetId, snippet);
    }

    return true;
  }

  async unlikeSnippet(snippetId: string, userId: string): Promise<boolean> {
    const like = Array.from(this.snippetLikes.values())
      .find(like => like.snippetId === snippetId && like.userId === userId);
    
    if (!like) return false;

    this.snippetLikes.delete(like.id);

    // Decrement likes count on snippet
    const snippet = this.snippets.get(snippetId);
    if (snippet && snippet.likes > 0) {
      snippet.likes -= 1;
      this.snippets.set(snippetId, snippet);
    }

    return true;
  }

  async isSnippetLiked(snippetId: string, userId: string): Promise<boolean> {
    return Array.from(this.snippetLikes.values())
      .some(like => like.snippetId === snippetId && like.userId === userId);
  }

  async getLikedSnippetsByUser(userId: string): Promise<SnippetWithAuthor[]> {
    const userLikes = Array.from(this.snippetLikes.values())
      .filter(like => like.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const likedSnippets = await Promise.all(
      userLikes.map(like => this.getSnippetWithAuthor(like.snippetId))
    );

    return likedSnippets.filter((snippet): snippet is SnippetWithAuthor => 
      snippet !== undefined && snippet.isPublic
    );
  }

  async searchSnippets(query: string, isPublic = true): Promise<SnippetWithAuthor[]> {
    const searchTerms = query.toLowerCase().split(' ');
    
    const matchingSnippets = Array.from(this.snippets.values())
      .filter(snippet => {
        if (isPublic && !snippet.isPublic) return false;
        
        const searchableText = [
          snippet.title,
          snippet.description || '',
          snippet.html,
          snippet.css,
          snippet.javascript
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return Promise.all(matchingSnippets.map(async snippet => {
      const author = this.users.get(snippet.authorId)!;
      return {
        ...snippet,
        author: {
          id: author.id,
          username: author.username,
          displayName: author.displayName || author.username,
          avatarUrl: author.avatarUrl,
          profilePicture: author.profilePicture,
        },
      };
    }));
  }

  async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Follow methods
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;
    
    const existingFollow = Array.from(this.follows.values())
      .find(follow => follow.followerId === followerId && follow.followingId === followingId);
    
    if (existingFollow) return false;

    const followId = randomUUID();
    const follow: Follow = {
      id: followId,
      followerId,
      followingId,
      createdAt: new Date(),
    };
    
    this.follows.set(followId, follow);
    return true;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const follow = Array.from(this.follows.values())
      .find(follow => follow.followerId === followerId && follow.followingId === followingId);
    
    if (!follow) return false;

    this.follows.delete(follow.id);
    return true;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return Array.from(this.follows.values())
      .some(follow => follow.followerId === followerId && follow.followingId === followingId);
  }

  async getFollowers(userId: string): Promise<User[]> {
    const followerIds = Array.from(this.follows.values())
      .filter(follow => follow.followingId === userId)
      .map(follow => follow.followerId);
    
    return followerIds
      .map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    return followingIds
      .map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
  }

  async getUserProfile(username: string, currentUserId?: string): Promise<UserProfile | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;

    // Count public snippets for this user
    const snippetsCount = Array.from(this.snippets.values())
      .filter(snippet => snippet.authorId === user.id && snippet.isPublic).length;

    // Count followers
    const followersCount = Array.from(this.follows.values())
      .filter(follow => follow.followingId === user.id).length;

    // Count following
    const followingCount = Array.from(this.follows.values())
      .filter(follow => follow.followerId === user.id).length;

    const isFollowing = currentUserId ? await this.isFollowing(currentUserId, user.id) : false;

    return {
      ...user,
      snippetsCount,
      followersCount,
      followingCount,
      isFollowing,
    };
  }

  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      snippetId: insertNotification.snippetId || null,
      fromUserId: insertNotification.fromUserId || null,
      isRead: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotifications(userId: string, limit = 50): Promise<NotificationWithDetails[]> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return await Promise.all(userNotifications.map(async notification => {
      const result: NotificationWithDetails = { ...notification };
      
      if (notification.fromUserId) {
        const fromUser = this.users.get(notification.fromUserId);
        if (fromUser) {
          result.fromUser = {
            id: fromUser.id,
            username: fromUser.username,
            displayName: fromUser.displayName,
            profilePicture: fromUser.profilePicture,
          };
        }
      }

      if (notification.snippetId) {
        const snippet = this.snippets.get(notification.snippetId);
        if (snippet) {
          result.snippet = {
            id: snippet.id,
            title: snippet.title,
          };
        }
      }

      return result;
    }));
  }

  async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification || notification.userId !== userId) return false;
    
    notification.isRead = true;
    this.notifications.set(id, notification);
    return true;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const notificationsArray = Array.from(this.notifications.values());
    for (const notification of notificationsArray) {
      if (notification.userId === userId && !notification.isRead) {
        notification.isRead = true;
        this.notifications.set(notification.id, notification);
      }
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead).length;
  }

  // Admin methods
  async searchUsers(query: string): Promise<User[]> {
    const searchTerms = query.toLowerCase().split(' ');
    
    return Array.from(this.users.values()).filter(user => {
      const searchableText = [
        user.username,
        user.displayName || '',
        user.email,
        user.bio || ''
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  async getAllSnippets(limit = 50, offset = 0): Promise<SnippetWithAuthor[]> {
    const allSnippets = Array.from(this.snippets.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(offset, offset + limit);

    return Promise.all(allSnippets.map(async snippet => {
      const author = this.users.get(snippet.authorId)!;
      return {
        ...snippet,
        author: {
          id: author.id,
          username: author.username,
          displayName: author.displayName || author.username,
          avatarUrl: author.avatarUrl,
          profilePicture: author.profilePicture,
        },
      };
    }));
  }

  async deleteUserAndSnippets(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    // Delete all snippets by this user
    const userSnippets = Array.from(this.snippets.values())
      .filter(snippet => snippet.authorId === userId);
    
    for (const snippet of userSnippets) {
      this.snippets.delete(snippet.id);
      
      // Delete related likes and views
      Array.from(this.snippetLikes.values())
        .filter(like => like.snippetId === snippet.id)
        .forEach(like => this.snippetLikes.delete(like.id));
      
      Array.from(this.snippetViews.values())
        .filter(view => view.snippetId === snippet.id)
        .forEach(view => this.snippetViews.delete(view.id));
    }

    // Delete user's likes and views
    Array.from(this.snippetLikes.values())
      .filter(like => like.userId === userId)
      .forEach(like => this.snippetLikes.delete(like.id));
    
    Array.from(this.snippetViews.values())
      .filter(view => view.userId === userId)
      .forEach(view => this.snippetViews.delete(view.id));

    // Delete user's follows and notifications
    Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId || follow.followingId === userId)
      .forEach(follow => this.follows.delete(follow.id));
    
    Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId || notification.fromUserId === userId)
      .forEach(notification => this.notifications.delete(notification.id));

    // Finally delete the user
    this.users.delete(userId);
    return true;
  }
}

import { db } from "./db";
import { users, snippets, snippetLikes, snippetViews, follows, notifications } from "@shared/schema";
import { eq, desc, and, or, sql, count, asc, like } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        id: randomUUID(),
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async createAdminUser(insertUser: InsertUser & { rank: 'admin' | 'default' }): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        id: randomUUID(),
        password: hashedPassword,
        rank: insertUser.rank,
      })
      .returning();
    return user;
  }

  async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getSnippet(id: string): Promise<Snippet | undefined> {
    const [snippet] = await db.select().from(snippets).where(eq(snippets.id, id));
    return snippet || undefined;
  }

  async getSnippetWithAuthor(id: string): Promise<SnippetWithAuthor | undefined> {
    const result = await db
      .select({
        id: snippets.id,
        title: snippets.title,
        description: snippets.description,
        html: snippets.html,
        css: snippets.css,
        javascript: snippets.javascript,
        isPublic: snippets.isPublic,
        authorId: snippets.authorId,
        views: snippets.views,
        likes: snippets.likes,
        createdAt: snippets.createdAt,
        updatedAt: snippets.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          profilePicture: users.profilePicture,
        }
      })
      .from(snippets)
      .innerJoin(users, eq(snippets.authorId, users.id))
      .where(eq(snippets.id, id));

    return result[0] || undefined;
  }

  async getSnippetsByAuthor(authorId: string): Promise<SnippetWithAuthor[]> {
    return await db
      .select({
        id: snippets.id,
        title: snippets.title,
        description: snippets.description,
        html: snippets.html,
        css: snippets.css,
        javascript: snippets.javascript,
        isPublic: snippets.isPublic,
        authorId: snippets.authorId,
        views: snippets.views,
        likes: snippets.likes,
        createdAt: snippets.createdAt,
        updatedAt: snippets.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          profilePicture: users.profilePicture,
        }
      })
      .from(snippets)
      .innerJoin(users, eq(snippets.authorId, users.id))
      .where(and(eq(snippets.authorId, authorId), eq(snippets.isPublic, true)))
      .orderBy(desc(snippets.createdAt));
  }

  async getUserOwnSnippets(authorId: string): Promise<SnippetWithAuthor[]> {
    return await db
      .select({
        id: snippets.id,
        title: snippets.title,
        description: snippets.description,
        html: snippets.html,
        css: snippets.css,
        javascript: snippets.javascript,
        isPublic: snippets.isPublic,
        authorId: snippets.authorId,
        views: snippets.views,
        likes: snippets.likes,
        createdAt: snippets.createdAt,
        updatedAt: snippets.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          profilePicture: users.profilePicture,
        }
      })
      .from(snippets)
      .innerJoin(users, eq(snippets.authorId, users.id))
      .where(eq(snippets.authorId, authorId))
      .orderBy(desc(snippets.createdAt));
  }

  async getPublicSnippets(limit: number = 50, offset: number = 0): Promise<SnippetWithAuthor[]> {
    return await db
      .select({
        id: snippets.id,
        title: snippets.title,
        description: snippets.description,
        html: snippets.html,
        css: snippets.css,
        javascript: snippets.javascript,
        isPublic: snippets.isPublic,
        authorId: snippets.authorId,
        views: snippets.views,
        likes: snippets.likes,
        createdAt: snippets.createdAt,
        updatedAt: snippets.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          profilePicture: users.profilePicture,
        }
      })
      .from(snippets)
      .innerJoin(users, eq(snippets.authorId, users.id))
      .where(eq(snippets.isPublic, true))
      .orderBy(desc(snippets.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getTrendingSnippets(limit: number = 10): Promise<SnippetWithAuthor[]> {
    return await db
      .select({
        id: snippets.id,
        title: snippets.title,
        description: snippets.description,
        html: snippets.html,
        css: snippets.css,
        javascript: snippets.javascript,
        isPublic: snippets.isPublic,
        authorId: snippets.authorId,
        views: snippets.views,
        likes: snippets.likes,
        createdAt: snippets.createdAt,
        updatedAt: snippets.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          profilePicture: users.profilePicture,
        }
      })
      .from(snippets)
      .innerJoin(users, eq(snippets.authorId, users.id))
      .where(eq(snippets.isPublic, true))
      .orderBy(desc(sql`(${snippets.likes} + ${snippets.views})`))
      .limit(limit);
  }

  async createSnippet(snippet: InsertSnippet & { authorId: string }): Promise<Snippet> {
    const [newSnippet] = await db
      .insert(snippets)
      .values(snippet)
      .returning();
    return newSnippet;
  }

  async updateSnippet(id: string, updates: Partial<Snippet>): Promise<Snippet | undefined> {
    const [snippet] = await db
      .update(snippets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(snippets.id, id))
      .returning();
    return snippet || undefined;
  }

  async deleteSnippet(id: string): Promise<boolean> {
    const result = await db.delete(snippets).where(eq(snippets.id, id));
    return (result.rowCount || 0) > 0;
  }

  async incrementViews(snippetId: string, userId?: string, ipAddress?: string): Promise<void> {
    // Check if view already exists for this combination
    if (userId) {
      const [existingView] = await db
        .select()
        .from(snippetViews)
        .where(and(eq(snippetViews.snippetId, snippetId), eq(snippetViews.userId, userId)));
      
      if (existingView) return;
    } else if (ipAddress) {
      const [existingView] = await db
        .select()
        .from(snippetViews)
        .where(and(eq(snippetViews.snippetId, snippetId), eq(snippetViews.ipAddress, ipAddress)));
      
      if (existingView) return;
    }

    // Create new view record
    await db.insert(snippetViews).values({
      id: randomUUID(),
      snippetId,
      userId: userId || null,
      ipAddress: ipAddress || null,
      createdAt: new Date(),
    });

    // Increment snippet views count
    await db
      .update(snippets)
      .set({ views: sql`${snippets.views} + 1` })
      .where(eq(snippets.id, snippetId));
  }

  async likeSnippet(snippetId: string, userId: string): Promise<boolean> {
    const [existingLike] = await db
      .select()
      .from(snippetLikes)
      .where(and(eq(snippetLikes.snippetId, snippetId), eq(snippetLikes.userId, userId)));

    if (existingLike) return false;

    await db.insert(snippetLikes).values({
      id: randomUUID(),
      snippetId,
      userId,
      createdAt: new Date(),
    });

    await db
      .update(snippets)
      .set({ likes: sql`${snippets.likes} + 1` })
      .where(eq(snippets.id, snippetId));

    return true;
  }

  async unlikeSnippet(snippetId: string, userId: string): Promise<boolean> {
    const [existingLike] = await db
      .select()
      .from(snippetLikes)
      .where(and(eq(snippetLikes.snippetId, snippetId), eq(snippetLikes.userId, userId)));

    if (!existingLike) return false;

    await db
      .delete(snippetLikes)
      .where(and(eq(snippetLikes.snippetId, snippetId), eq(snippetLikes.userId, userId)));

    await db
      .update(snippets)
      .set({ likes: sql`${snippets.likes} - 1` })
      .where(eq(snippets.id, snippetId));

    return true;
  }

  async isSnippetLiked(snippetId: string, userId: string): Promise<boolean> {
    const [existingLike] = await db
      .select()
      .from(snippetLikes)
      .where(and(eq(snippetLikes.snippetId, snippetId), eq(snippetLikes.userId, userId)));

    return !!existingLike;
  }

  async getLikedSnippetsByUser(userId: string): Promise<SnippetWithAuthor[]> {
    return await db
      .select({
        id: snippets.id,
        title: snippets.title,
        description: snippets.description,
        html: snippets.html,
        css: snippets.css,
        javascript: snippets.javascript,
        isPublic: snippets.isPublic,
        authorId: snippets.authorId,
        views: snippets.views,
        likes: snippets.likes,
        createdAt: snippets.createdAt,
        updatedAt: snippets.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          profilePicture: users.profilePicture,
        }
      })
      .from(snippets)
      .innerJoin(users, eq(snippets.authorId, users.id))
      .innerJoin(snippetLikes, eq(snippets.id, snippetLikes.snippetId))
      .where(and(eq(snippetLikes.userId, userId), eq(snippets.isPublic, true)))
      .orderBy(desc(snippetLikes.createdAt));
  }

  async searchSnippets(query: string, isPublic: boolean = true): Promise<SnippetWithAuthor[]> {
    return await db
      .select({
        id: snippets.id,
        title: snippets.title,
        description: snippets.description,
        html: snippets.html,
        css: snippets.css,
        javascript: snippets.javascript,
        isPublic: snippets.isPublic,
        authorId: snippets.authorId,
        views: snippets.views,
        likes: snippets.likes,
        createdAt: snippets.createdAt,
        updatedAt: snippets.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          profilePicture: users.profilePicture,
        }
      })
      .from(snippets)
      .innerJoin(users, eq(snippets.authorId, users.id))
      .where(and(
        eq(snippets.isPublic, isPublic),
        like(snippets.title, `%${query}%`)
      ))
      .orderBy(desc(snippets.createdAt));
  }

  async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;
    
    const [existingFollow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    
    if (existingFollow) return false;

    await db.insert(follows).values({
      id: randomUUID(),
      followerId,
      followingId,
      createdAt: new Date(),
    });
    
    return true;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    
    return (result.rowCount || 0) > 0;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    
    return !!follow;
  }

  async getFollowers(userId: string): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        profilePicture: users.profilePicture,
        bio: users.bio,
        location: users.location,
        website: users.website,
        rank: users.rank,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(follows, eq(users.id, follows.followerId))
      .where(eq(follows.followingId, userId));
  }

  async getFollowing(userId: string): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        profilePicture: users.profilePicture,
        bio: users.bio,
        location: users.location,
        website: users.website,
        rank: users.rank,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(follows, eq(users.id, follows.followingId))
      .where(eq(follows.followerId, userId));
  }

  async getUserProfile(username: string, currentUserId?: string): Promise<UserProfile | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;

    const [snippetsCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(snippets)
      .where(and(eq(snippets.authorId, user.id), eq(snippets.isPublic, true)));

    const [followersCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, user.id));

    const [followingCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, user.id));

    const isFollowing = currentUserId ? await this.isFollowing(currentUserId, user.id) : false;

    return {
      ...user,
      snippetsCount: snippetsCountResult.count,
      followersCount: followersCountResult.count,
      followingCount: followingCountResult.count,
      isFollowing,
    };
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        ...insertNotification,
        id: randomUUID(),
        isRead: false,
        createdAt: new Date(),
      })
      .returning();
    return notification;
  }

  async getNotifications(userId: string, limit: number = 50): Promise<NotificationWithDetails[]> {
    const notificationsResult = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return Promise.all(notificationsResult.map(async (notification) => {
      const result: NotificationWithDetails = { ...notification };

      if (notification.fromUserId) {
        const fromUser = await this.getUser(notification.fromUserId);
        if (fromUser) {
          result.fromUser = {
            id: fromUser.id,
            username: fromUser.username,
            displayName: fromUser.displayName,
            profilePicture: fromUser.profilePicture,
          };
        }
      }

      if (notification.snippetId) {
        const snippet = await this.getSnippet(notification.snippetId);
        if (snippet) {
          result.snippet = {
            id: snippet.id,
            title: snippet.title,
          };
        }
      }

      return result;
    }));
  }

  async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    
    return (result.rowCount || 0) > 0;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return result.count;
  }

  // Admin methods
  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        sql`LOWER(${users.username}) LIKE LOWER(${'%' + query + '%'}) 
            OR LOWER(${users.displayName}) LIKE LOWER(${'%' + query + '%'})
            OR LOWER(${users.email}) LIKE LOWER(${'%' + query + '%'})
            OR LOWER(${users.bio}) LIKE LOWER(${'%' + query + '%'})`
      )
      .orderBy(desc(users.createdAt));
  }

  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getAllSnippets(limit = 50, offset = 0): Promise<SnippetWithAuthor[]> {
    return await db
      .select({
        id: snippets.id,
        title: snippets.title,
        description: snippets.description,
        html: snippets.html,
        css: snippets.css,
        javascript: snippets.javascript,
        isPublic: snippets.isPublic,
        authorId: snippets.authorId,
        views: snippets.views,
        likes: snippets.likes,
        createdAt: snippets.createdAt,
        updatedAt: snippets.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          profilePicture: users.profilePicture,
        }
      })
      .from(snippets)
      .innerJoin(users, eq(snippets.authorId, users.id))
      .orderBy(desc(snippets.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  async deleteUserAndSnippets(userId: string): Promise<boolean> {
    try {
      // Delete in order to handle foreign key constraints properly
      // Delete snippet likes first
      await db.delete(snippetLikes).where(
        sql`${snippetLikes.snippetId} IN (SELECT id FROM ${snippets} WHERE ${snippets.authorId} = ${userId}) 
            OR ${snippetLikes.userId} = ${userId}`
      );

      // Delete snippet views
      await db.delete(snippetViews).where(
        sql`${snippetViews.snippetId} IN (SELECT id FROM ${snippets} WHERE ${snippets.authorId} = ${userId})
            OR ${snippetViews.userId} = ${userId}`
      );

      // Delete follows
      await db.delete(follows).where(
        sql`${follows.followerId} = ${userId} OR ${follows.followingId} = ${userId}`
      );

      // Delete notifications
      await db.delete(notifications).where(
        sql`${notifications.userId} = ${userId} OR ${notifications.fromUserId} = ${userId}`
      );

      // Delete snippets
      await db.delete(snippets).where(eq(snippets.authorId, userId));

      // Finally delete the user
      const result = await db.delete(users).where(eq(users.id, userId));
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting user and snippets:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
