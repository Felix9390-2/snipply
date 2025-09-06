import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertSnippetSchema, insertFollowSchema, insertNotificationSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";

// Extend session types
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'snipply-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Middleware to check admin privileges
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.rank !== 'admin') {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    
    req.adminUser = user; // Store admin user in request for convenience
    next();
  };

  // Setup admin user (development only)
  app.post("/api/setup/admin", async (req, res) => {
    try {
      // Check if admin user already exists
      const existingAdmin = await storage.getUserByUsername("Felix9390");
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin user already exists" });
      }

      const adminUser = await storage.createAdminUser({
        username: "Felix9390",
        password: "1234567890",
        email: "felix9390@snipply.dev",
        displayName: "Felix - Admin",
        bio: "System Administrator",
        rank: "admin",
      });

      res.json({ 
        message: "Admin user created successfully", 
        user: { 
          id: adminUser.id, 
          username: adminUser.username, 
          rank: adminUser.rank 
        } 
      });
    } catch (error) {
      console.error("Admin creation error:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(userData);
      
      // Auto-login after registration
      req.session.userId = user.id;
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.verifyPassword(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // Snippet routes
  app.get("/api/snippets", async (req, res) => {
    try {
      const { author, limit = "50", offset = "0", trending } = req.query;
      
      let snippets: any[];
      
      if (trending === "true") {
        snippets = await storage.getTrendingSnippets(parseInt(limit as string));
      } else if (author) {
        snippets = await storage.getSnippetsByAuthor(author as string);
      } else {
        snippets = await storage.getPublicSnippets(
          parseInt(limit as string), 
          parseInt(offset as string)
        );
      }

      // Add isLiked property for authenticated users
      if (req.session?.userId) {
        for (const snippet of snippets) {
          snippet.isLiked = await storage.isSnippetLiked(snippet.id, req.session.userId);
        }
      }

      res.json(snippets);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/snippets/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query required" });
      }

      const snippets = await storage.searchSnippets(q as string);
      res.json(snippets);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/snippets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const snippet = await storage.getSnippetWithAuthor(id);
      
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }

      // Check if user has permission to view private snippets
      if (!snippet.isPublic && req.session?.userId !== snippet.authorId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Increment view count (unique per user/IP)
      const userId = req.session?.userId;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      await storage.incrementViews(id, userId, ipAddress);

      // Check if current user has liked this snippet
      if (req.session?.userId) {
        snippet.isLiked = await storage.isSnippetLiked(id, req.session.userId);
      }

      res.json(snippet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/snippets", requireAuth, async (req, res) => {
    try {
      const snippetData = insertSnippetSchema.parse(req.body);
      const snippet = await storage.createSnippet({
        ...snippetData,
        authorId: req.session.userId!
      });

      // If snippet is public, notify followers
      if (snippet.isPublic) {
        try {
          const followers = await storage.getFollowers(req.session.userId!);
          const author = await storage.getUser(req.session.userId!);
          
          if (author) {
            // Create notifications for all followers
            for (const follower of followers) {
              await storage.createNotification({
                userId: follower.id,
                type: 'new_snippet',
                title: 'New Snippet Posted',
                message: `${author.displayName || author.username} posted a new snippet: "${snippet.title}"`,
                snippetId: snippet.id,
                fromUserId: author.id,
              });
            }
          }
        } catch (notificationError) {
          console.warn('Failed to create notifications:', notificationError);
          // Don't fail the snippet creation if notifications fail
        }
      }
      
      res.status(201).json(snippet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/snippets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertSnippetSchema.partial().parse(req.body);
      
      const existingSnippet = await storage.getSnippet(id);
      if (!existingSnippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }

      if (existingSnippet.authorId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedSnippet = await storage.updateSnippet(id, updates);
      res.json(updatedSnippet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/snippets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const existingSnippet = await storage.getSnippet(id);
      if (!existingSnippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }

      if (existingSnippet.authorId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteSnippet(id);
      res.json({ message: "Snippet deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Like/unlike routes
  app.post("/api/snippets/:id/like", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.likeSnippet(id, req.session.userId!);
      
      if (!success) {
        return res.status(400).json({ message: "Already liked or snippet not found" });
      }

      res.json({ message: "Snippet liked successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/snippets/:id/like", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.unlikeSnippet(id, req.session.userId!);
      
      if (!success) {
        return res.status(400).json({ message: "Not liked or snippet not found" });
      }

      res.json({ message: "Snippet unliked successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User profile routes
  app.get("/api/users/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const userProfile = await storage.getUserProfile(username, req.session?.userId);
      
      if (!userProfile) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...profileWithoutPassword } = userProfile;
      res.json(profileWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get liked snippets for a user
  app.get("/api/users/:username/liked", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const likedSnippets = await storage.getLikedSnippetsByUser(user.id);
      
      // Add isLiked property (should always be true for liked snippets)
      if (req.session?.userId) {
        for (const snippet of likedSnippets) {
          snippet.isLiked = true; // These are liked snippets, so always true
        }
      }
      
      res.json(likedSnippets);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get user's own snippets (both public and private)
  app.get("/api/my-snippets", requireAuth, async (req, res) => {
    try {
      const snippets = await storage.getUserOwnSnippets(req.session.userId!);
      
      // Add isLiked property for user's own snippets
      for (const snippet of snippets) {
        snippet.isLiked = await storage.isSnippetLiked(snippet.id, req.session.userId!);
      }
      
      res.json(snippets);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Follow routes
  app.post("/api/users/:username/follow", requireAuth, async (req, res) => {
    try {
      const { username } = req.params;
      const userToFollow = await storage.getUserByUsername(username);
      
      if (!userToFollow) {
        return res.status(404).json({ message: "User not found" });
      }

      if (userToFollow.id === req.session.userId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const success = await storage.followUser(req.session.userId!, userToFollow.id);
      
      if (!success) {
        return res.status(400).json({ message: "Already following this user" });
      }

      res.json({ message: "User followed successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/users/:username/follow", requireAuth, async (req, res) => {
    try {
      const { username } = req.params;
      const userToUnfollow = await storage.getUserByUsername(username);
      
      if (!userToUnfollow) {
        return res.status(404).json({ message: "User not found" });
      }

      const success = await storage.unfollowUser(req.session.userId!, userToUnfollow.id);
      
      if (!success) {
        return res.status(400).json({ message: "Not following this user" });
      }

      res.json({ message: "User unfollowed successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/following", requireAuth, async (req, res) => {
    try {
      const following = await storage.getFollowing(req.session.userId!);
      res.json(following.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }));
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/followers", requireAuth, async (req, res) => {
    try {
      const followers = await storage.getFollowers(req.session.userId!);
      res.json(followers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }));
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const { limit = "50" } = req.query;
      const notifications = await storage.getNotifications(
        req.session.userId!, 
        parseInt(limit as string)
      );
      res.json(notifications);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.markNotificationRead(id, req.session.userId!);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.session.userId!);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.session.userId!);
      res.json({ count });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Profile picture upload
  app.put("/api/profile/picture", requireAuth, async (req, res) => {
    try {
      const { profilePicture } = req.body;
      
      if (!profilePicture || typeof profilePicture !== 'string') {
        return res.status(400).json({ message: "Profile picture data is required" });
      }

      const updatedUser = await storage.updateUser(req.session.userId!, {
        profilePicture
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { search, limit = "50", offset = "0" } = req.query;
      let users: any[];

      if (search) {
        // Add search functionality for users
        users = await storage.searchUsers(search as string);
      } else {
        users = await storage.getAllUsers(parseInt(limit as string), parseInt(offset as string));
      }

      // Remove passwords from response
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(safeUsers);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/snippets", requireAdmin, async (req, res) => {
    try {
      const { limit = "50", offset = "0" } = req.query;
      const snippets = await storage.getAllSnippets(parseInt(limit as string), parseInt(offset as string));
      res.json(snippets);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/snippets/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const existingSnippet = await storage.getSnippet(id);
      if (!existingSnippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }

      await storage.deleteSnippet(id);
      res.json({ message: "Snippet deleted successfully by admin" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      if (id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete all snippets by this user first
      await storage.deleteUserAndSnippets(id);
      res.json({ message: "User and all their content deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin route to promote/demote users
  app.patch("/api/admin/users/:id/rank", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { rank } = req.body;
      
      if (!rank || !['admin', 'default'].includes(rank)) {
        return res.status(400).json({ message: "Invalid rank. Must be 'admin' or 'default'" });
      }

      // Prevent admin from demoting themselves
      if (id === req.session.userId && rank === 'default') {
        return res.status(400).json({ message: "Cannot demote yourself" });
      }

      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(id, { rank });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ message: `User rank updated to ${rank}`, user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin stats route
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers(1000);
      const snippets = await storage.getAllSnippets(1000);
      
      const stats = {
        totalUsers: users.length,
        totalSnippets: snippets.length,
        totalAdmins: users.filter(u => u.rank === 'admin').length,
        publicSnippets: snippets.filter(s => s.isPublic).length,
        privateSnippets: snippets.filter(s => !s.isPublic).length,
      };

      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
