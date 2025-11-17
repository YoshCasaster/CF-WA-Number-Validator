import { z } from "zod";

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
