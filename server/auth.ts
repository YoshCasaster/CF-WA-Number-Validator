import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./db-schema";
import { eq } from "drizzle-orm";
import type { InsertUser, LoginCredentials } from "@shared/schema";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(userData: InsertUser) {
  const passwordHash = await hashPassword(userData.password);

  const [user] = await db
    .insert(users)
    .values({
      email: userData.email,
      passwordHash,
      fullName: userData.fullName,
    })
    .returning();

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    lastLogin: user.lastLogin?.toISOString() || null,
    isActive: user.isActive || true,
  };
}

export async function loginUser(credentials: LoginCredentials) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, credentials.email))
    .limit(1);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Account is inactive");
  }

  const isValid = await verifyPassword(credentials.password, user.passwordHash);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  // Update last login
  await db
    .update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, user.id));

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: user.isActive || true,
  };
}

export async function getUserById(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    lastLogin: user.lastLogin?.toISOString() || null,
    isActive: user.isActive || true,
  };
}
