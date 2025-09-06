import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRankEnum = pgEnum('user_rank', ['default', 'admin']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  avatarUrl: text("avatar_url"),
  profilePicture: text("profile_picture"),
  rank: userRankEnum("rank").notNull().default("default"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const snippets = pgTable("snippets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  html: text("html").notNull().default(""),
  css: text("css").notNull().default(""),
  javascript: text("javascript").notNull().default(""),
  isPublic: boolean("is_public").notNull().default(false),
  authorId: varchar("author_id").notNull(),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const snippetLikes = pgTable("snippet_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snippetId: varchar("snippet_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const snippetViews = pgTable("snippet_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snippetId: varchar("snippet_id").notNull(),
  userId: varchar("user_id"),
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull(),
  followingId: varchar("following_id").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // 'new_snippet'
  title: text("title").notNull(),
  message: text("message").notNull(),
  snippetId: varchar("snippet_id"),
  fromUserId: varchar("from_user_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
  bio: true,
  location: true,
  website: true,
});

export const insertSnippetSchema = createInsertSchema(snippets).pick({
  title: true,
  description: true,
  html: true,
  css: true,
  javascript: true,
  isPublic: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertFollowSchema = createInsertSchema(follows).pick({
  followerId: true,
  followingId: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  snippetId: true,
  fromUserId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSnippet = z.infer<typeof insertSnippetSchema>;
export type Snippet = typeof snippets.$inferSelect;
export type SnippetLike = typeof snippetLikes.$inferSelect;
export type SnippetView = typeof snippetViews.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

// Extended types for API responses
export type SnippetWithAuthor = Snippet & {
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'profilePicture'>;
  isLiked?: boolean;
};

export type UserProfile = User & {
  snippetsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
};

export type NotificationWithDetails = Notification & {
  fromUser?: Pick<User, 'id' | 'username' | 'displayName' | 'profilePicture'>;
  snippet?: Pick<Snippet, 'id' | 'title'>;
};
