import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  createdAt: z.string(),
  lastLogin: z.string().nullable(),
  isActive: z.boolean(),
});

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

// WhatsApp session schema
export const whatsappSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  isAuthenticated: z.boolean(),
  accountName: z.string().nullable(),
  accountNumber: z.string().nullable(),
  lastQrGenerated: z.string().nullable(),
  sessionCreatedAt: z.string(),
  updatedAt: z.string(),
});

export type WhatsAppSession = z.infer<typeof whatsappSessionSchema>;

// Check history schema
export const checkHistorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  phoneNumber: z.string(),
  status: z.enum(["active", "non-wa", "error"]),
  errorMessage: z.string().nullable(),
  checkedAt: z.string(),
});

export type CheckHistory = z.infer<typeof checkHistorySchema>;

// Phone check result schema
export const phoneCheckSchema = z.object({
  id: z.string(),
  phoneNumber: z.string(),
  status: z.enum(["pending", "checking", "active", "non-wa", "error"]),
  timestamp: z.string(),
  errorMessage: z.string().optional(),
});

export const insertPhoneCheckSchema = phoneCheckSchema.omit({
  id: true,
  timestamp: true
});

export type PhoneCheck = z.infer<typeof phoneCheckSchema>;
export type InsertPhoneCheck = z.infer<typeof insertPhoneCheckSchema>;

// WhatsApp session info schema
export const sessionInfoSchema = z.object({
  isAuthenticated: z.boolean(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  qrCode: z.string().optional(),
});

export type SessionInfo = z.infer<typeof sessionInfoSchema>;

// Check batch schema
export const checkBatchSchema = z.object({
  numbers: z.array(z.string()).min(1, "At least one phone number is required"),
});

export type CheckBatch = z.infer<typeof checkBatchSchema>;

// Statistics schema
export const statisticsSchema = z.object({
  total: z.number(),
  checked: z.number(),
  active: z.number(),
  nonWa: z.number(),
  errors: z.number(),
  checking: z.number(),
});

export type Statistics = z.infer<typeof statisticsSchema>;

// WebSocket message types
export const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("qr"),
    qrCode: z.string(),
  }),
  z.object({
    type: z.literal("authenticated"),
    accountName: z.string(),
    accountNumber: z.string(),
  }),
  z.object({
    type: z.literal("disconnected"),
  }),
  z.object({
    type: z.literal("checkStart"),
    number: z.string(),
  }),
  z.object({
    type: z.literal("checkResult"),
    result: phoneCheckSchema,
  }),
  z.object({
    type: z.literal("checkComplete"),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
  }),
]);

export type WSMessage = z.infer<typeof wsMessageSchema>;
