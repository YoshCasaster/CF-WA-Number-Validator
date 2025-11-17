import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

interface ClientSession {
  client: typeof Client.prototype;
  isReady: boolean;
  accountInfo: { name: string; number: string } | null;
}

export class WhatsAppManager {
  private sessions: Map<string, ClientSession> = new Map();
  private sessionDir: string;

  constructor() {
    this.sessionDir = path.resolve(process.cwd(), ".wwebjs_sessions");
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  async initializeSession(
    userId: string,
    onQR: (qrCode: string) => void,
    onAuthenticated: (accountName: string, accountNumber: string) => void,
    onDisconnected: () => void
  ) {
    // Check if session already exists
    if (this.sessions.has(userId)) {
      console.log(`Session already exists for user ${userId}`);
      const session = this.sessions.get(userId)!;
      if (session.isReady && session.accountInfo) {
        onAuthenticated(session.accountInfo.name, session.accountInfo.number);
      }
      return;
    }

    console.log(`Initializing WhatsApp session for user ${userId}`);

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `user-${userId}`,
        dataPath: this.sessionDir,
      }),
      webVersionCache: {
        type: "remote",
        remotePath:
          "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
      },
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
      },
    });

    const session: ClientSession = {
      client,
      isReady: false,
      accountInfo: null,
    };

    this.sessions.set(userId, session);

    client.on("qr", async (qr: string) => {
      console.log(`QR Code generated for user ${userId}`);
      try {
        const qrCodeDataURL = await QRCode.toDataURL(qr);
        onQR(qrCodeDataURL);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      }
    });

    client.on("ready", async () => {
      console.log(`WhatsApp ready for user ${userId}`);
      session.isReady = true;

      const clientInfo = (client as any).info;
      const accountName = clientInfo.pushname || "Unknown";
      const accountNumber = clientInfo.wid.user || "Unknown";

      session.accountInfo = { name: accountName, number: accountNumber };
      onAuthenticated(accountName, accountNumber);
    });

    client.on("authenticated", () => {
      console.log(`WhatsApp authenticated for user ${userId}`);
    });

    client.on("auth_failure", (msg: any) => {
      console.error(`Authentication failed for user ${userId}:`, msg);
    });

    client.on("disconnected", (reason: any) => {
      console.log(`WhatsApp disconnected for user ${userId}:`, reason);
      session.isReady = false;
      session.accountInfo = null;
      onDisconnected();
    });

    await client.initialize();
  }

  async checkNumber(
    userId: string,
    phoneNumber: string
  ): Promise<{ isRegistered: boolean; error?: string }> {
    const session = this.sessions.get(userId);

    if (!session || !session.isReady) {
      return { isRegistered: false, error: "WhatsApp session not ready" };
    }

    try {
      let formattedNumber = phoneNumber.replace(/\D/g, "");

      if (!formattedNumber.startsWith("62")) {
        if (formattedNumber.startsWith("0")) {
          formattedNumber = "62" + formattedNumber.substring(1);
        } else {
          formattedNumber = "62" + formattedNumber;
        }
      }

      const formattedTarget = formattedNumber + "@c.us";

      console.log(
        `Checking number for user ${userId}: ${phoneNumber} -> ${formattedTarget}`
      );

      const isRegistered = await (session.client as any).isRegisteredUser(
        formattedTarget
      );

      return { isRegistered };
    } catch (error) {
      console.error("Error checking number:", error);
      return {
        isRegistered: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getSession(userId: string): ClientSession | undefined {
    return this.sessions.get(userId);
  }

  isSessionReady(userId: string): boolean {
    const session = this.sessions.get(userId);
    return session?.isReady || false;
  }

  getAccountInfo(userId: string) {
    const session = this.sessions.get(userId);
    return session?.accountInfo || null;
  }

  async destroySession(userId: string) {
    const session = this.sessions.get(userId);
    if (session) {
      await (session.client as any).destroy();
      this.sessions.delete(userId);
      console.log(`Session destroyed for user ${userId}`);

      // Clean up session files
      const sessionPath = path.join(
        this.sessionDir,
        `session-user-${userId}`
      );
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }
    }
  }
}

export const whatsappManager = new WhatsAppManager();
