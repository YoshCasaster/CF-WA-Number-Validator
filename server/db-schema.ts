import { pgTable, text, timestamp, uuid, boolean, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  emailIdx: index("idx_users_email").on(table.email),
}));

export const whatsappSessions = pgTable("whatsapp_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isAuthenticated: boolean("is_authenticated").default(false),
  accountName: text("account_name"),
  accountNumber: text("account_number"),
  lastQrGenerated: timestamp("last_qr_generated"),
  sessionCreatedAt: timestamp("session_created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_whatsapp_sessions_user_id").on(table.userId),
}));

export const checkHistory = pgTable("check_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  checkedAt: timestamp("checked_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_check_history_user_id").on(table.userId),
  checkedAtIdx: index("idx_check_history_checked_at").on(table.checkedAt),
}));
