import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { whatsappManager } from "./whatsapp-manager";
import { randomUUID } from "crypto";
import cookieParser from "cookie-parser";
import { createUser, loginUser, getUserById } from "./auth";
import { db } from "./db";
import { whatsappSessions, checkHistory } from "./db-schema";
import { eq, desc } from "drizzle-orm";
import type { InsertUser, LoginCredentials } from "@shared/schema";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
}

interface CheckRequest {
  type: "startCheck" | "authenticate";
  numbers?: string[];
  token?: string;
}

// Store WebSocket connections per user
const userWsConnections = new Map<string, Set<AuthenticatedWebSocket>>();

// Simple JWT-like token (in production, use proper JWT library)
function generateToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, exp: Date.now() + 86400000 })).toString('base64');
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString());
    if (data.exp < Date.now()) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.use(cookieParser());

  // Auth middleware
  const requireAuth = async (req: Request, res: Response, next: Function) => {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    (req as any).user = user;
    next();
  };

  // Register endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData: InsertUser = req.body;
      const user = await createUser(userData);

      const token = generateToken(user.id);
      res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: 86400000,
        sameSite: 'lax'
      });

      res.json({ user, token });
    } catch (error: any) {
      if (error.message.includes("duplicate")) {
        res.status(400).json({ message: "Email already exists" });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const credentials: LoginCredentials = req.body;
      const user = await loginUser(credentials);

      const token = generateToken(user.id);
      res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: 86400000,
        sameSite: 'lax'
      });

      res.json({ user, token });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", requireAuth, async (req: Request, res: Response) => {
    res.clearCookie('auth_token');
    res.json({ message: "Logged out successfully" });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    res.json({ user: (req as any).user });
  });

  // Get user's WhatsApp session status
  app.get("/api/whatsapp/session", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      const [session] = await db
        .select()
        .from(whatsappSessions)
        .where(eq(whatsappSessions.userId, userId))
        .limit(1);

      if (!session) {
        return res.json({
          isAuthenticated: false,
          accountName: null,
          accountNumber: null
        });
      }

      res.json({
        isAuthenticated: session.isAuthenticated,
        accountName: session.accountName,
        accountNumber: session.accountNumber,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Clear WhatsApp session
  app.delete("/api/whatsapp/session", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      await whatsappManager.destroySession(userId);

      await db
        .delete(whatsappSessions)
        .where(eq(whatsappSessions.userId, userId));

      res.json({ message: "Session cleared successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get check history
  app.get("/api/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 100;

      const history = await db
        .select()
        .from(checkHistory)
        .where(eq(checkHistory.userId, userId))
        .orderBy(desc(checkHistory.checkedAt))
        .limit(limit);

      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const broadcastToUser = (userId: string, message: any) => {
    const connections = userWsConnections.get(userId);
    if (!connections) return;

    const messageStr = JSON.stringify(message);
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  };

  wss.on("connection", (ws: AuthenticatedWebSocket) => {
    console.log("WebSocket client connected");

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString()) as CheckRequest;

        // Authentication message
        if (message.type === "authenticate") {
          const token = message.token;
          if (!token) {
            ws.send(JSON.stringify({ type: "error", message: "No token provided" }));
            ws.close();
            return;
          }

          const decoded = verifyToken(token);
          if (!decoded) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
            ws.close();
            return;
          }

          ws.userId = decoded.userId;

          // Add to user connections
          if (!userWsConnections.has(decoded.userId)) {
            userWsConnections.set(decoded.userId, new Set());
          }
          userWsConnections.get(decoded.userId)!.add(ws);

          console.log(`WebSocket authenticated for user ${decoded.userId}`);

          // Initialize WhatsApp session for this user
          await whatsappManager.initializeSession(
            decoded.userId,
            // onQR
            (qrCode: string) => {
              broadcastToUser(decoded.userId, { type: "qr", qrCode });
              // Update DB
              db.insert(whatsappSessions)
                .values({
                  userId: decoded.userId,
                  isAuthenticated: false,
                  lastQrGenerated: new Date(),
                })
                .onConflictDoUpdate({
                  target: whatsappSessions.userId,
                  set: {
                    lastQrGenerated: new Date(),
                    updatedAt: new Date(),
                  },
                })
                .catch(console.error);
            },
            // onAuthenticated
            (accountName: string, accountNumber: string) => {
              broadcastToUser(decoded.userId, {
                type: "authenticated",
                accountName,
                accountNumber,
              });
              // Update DB
              db.insert(whatsappSessions)
                .values({
                  userId: decoded.userId,
                  isAuthenticated: true,
                  accountName,
                  accountNumber,
                  updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                  target: whatsappSessions.userId,
                  set: {
                    isAuthenticated: true,
                    accountName,
                    accountNumber,
                    updatedAt: new Date(),
                  },
                })
                .catch(console.error);
            },
            // onDisconnected
            () => {
              broadcastToUser(decoded.userId, { type: "disconnected" });
              // Update DB
              db.update(whatsappSessions)
                .set({
                  isAuthenticated: false,
                  updatedAt: new Date(),
                })
                .where(eq(whatsappSessions.userId, decoded.userId))
                .catch(console.error);
            }
          );

          // Send current session status
          const session = whatsappManager.getSession(decoded.userId);
          if (session?.isReady && session.accountInfo) {
            ws.send(
              JSON.stringify({
                type: "authenticated",
                accountName: session.accountInfo.name,
                accountNumber: session.accountInfo.number,
              })
            );
          }
        }

        // Start check message
        if (message.type === "startCheck") {
          if (!ws.userId) {
            ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
            return;
          }

          const numbers = message.numbers || [];
          console.log(`Starting check for user ${ws.userId}: ${numbers.length} numbers`);

          for (let i = 0; i < numbers.length; i++) {
            const number = numbers[i].trim();
            if (!number) continue;

            broadcastToUser(ws.userId, {
              type: "checkStart",
              number,
            });

            const result = await whatsappManager.checkNumber(ws.userId, number);

            const checkResult = {
              id: randomUUID(),
              phoneNumber: number,
              status: result.error ? "error" : result.isRegistered ? "active" : "non-wa",
              timestamp: new Date().toISOString(),
              errorMessage: result.error,
            };

            // Save to database
            await db.insert(checkHistory).values({
              userId: ws.userId,
              phoneNumber: number,
              status: checkResult.status as "active" | "non-wa" | "error",
              errorMessage: result.error,
            }).catch(console.error);

            broadcastToUser(ws.userId, {
              type: "checkResult",
              result: checkResult,
            });

            if (i < numbers.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
          }

          broadcastToUser(ws.userId, { type: "checkComplete" });
          console.log(`Checking complete for user ${ws.userId}`);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          })
        );
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      if (ws.userId) {
        const connections = userWsConnections.get(ws.userId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            userWsConnections.delete(ws.userId);
          }
        }
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      if (ws.userId) {
        const connections = userWsConnections.get(ws.userId);
        if (connections) {
          connections.delete(ws);
        }
      }
    });
  });

  return httpServer;
}
