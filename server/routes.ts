import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { whatsappClient } from "./whatsapp-client";
import { randomUUID } from "crypto";

interface CheckRequest {
  type: "startCheck";
  numbers: string[];
}

// Store all active WebSocket connections
const wsClients = new Set<WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Create WebSocket server on a distinct path
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Initialize WhatsApp client once
  const initWhatsAppClient = async () => {
    await whatsappClient.initialize(
      // onQR callback - broadcast to all clients
      (qrCode: string) => {
        broadcastToAll({
          type: "qr",
          qrCode,
        });
      },
      // onAuthenticated callback - broadcast to all clients
      (accountName: string, accountNumber: string) => {
        broadcastToAll({
          type: "authenticated",
          accountName,
          accountNumber,
        });
      },
      // onDisconnected callback - broadcast to all clients
      () => {
        broadcastToAll({
          type: "disconnected",
        });
      }
    );
  };

  // Broadcast message to all connected clients
  const broadcastToAll = (message: any) => {
    const messageStr = JSON.stringify(message);
    wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  };

  // Initialize WhatsApp client once on server start
  initWhatsAppClient().catch((error) => {
    console.error("Failed to initialize WhatsApp client:", error);
  });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    wsClients.add(ws);

    // If already authenticated, send account info to new client
    if (whatsappClient.isClientReady()) {
      const accountInfo = whatsappClient.getAccountInfo();
      if (accountInfo) {
        ws.send(
          JSON.stringify({
            type: "authenticated",
            accountName: accountInfo.name,
            accountNumber: accountInfo.number,
          })
        );
      }
    }

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString()) as CheckRequest;

        if (message.type === "startCheck") {
          const numbers = message.numbers;
          console.log(`Starting check for ${numbers.length} numbers`);

          // Process numbers one by one
          for (let i = 0; i < numbers.length; i++) {
            const number = numbers[i].trim();
            
            if (!number) continue;

            // Notify all clients that we're checking this number
            broadcastToAll({
              type: "checkStart",
              number,
            });

            // Check the number
            const result = await whatsappClient.checkNumber(number);

            const checkResult = {
              id: randomUUID(),
              phoneNumber: number,
              status: result.error
                ? "error"
                : result.isRegistered
                  ? "active"
                  : "non-wa",
              timestamp: new Date().toISOString(),
              errorMessage: result.error,
            };

            // Send result to all clients
            broadcastToAll({
              type: "checkResult",
              result: checkResult,
            });

            // Add delay to avoid rate limiting (3 seconds)
            if (i < numbers.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
          }

          // Notify all clients that checking is complete
          broadcastToAll({
            type: "checkComplete",
          });

          console.log("Checking complete");
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        broadcastToAll({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      wsClients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      wsClients.delete(ws);
    });
  });

  return httpServer;
}
