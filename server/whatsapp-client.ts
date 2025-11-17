import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import QRCode from "qrcode";

export class WhatsAppClient {
  private client: typeof Client.prototype | null = null;
  private isReady: boolean = false;
  private currentAccountInfo: { name: string; number: string } | null = null;

  constructor() {}

  async initialize(
    onQR: (qrCode: string) => void,
    onAuthenticated: (accountName: string, accountNumber: string) => void,
    onDisconnected: () => void,
  ) {
    if (this.client) {
      console.log("WhatsApp client already initialized");
      return;
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "whatsapp-checker",
      }),
      // Use remote web version to avoid Chromium dependency issues
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

    this.client.on("qr", async (qr: string) => {
      console.log("QR Code generated");
      try {
        const qrCodeDataURL = await QRCode.toDataURL(qr);
        onQR(qrCodeDataURL);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      }
    });

    this.client.on("ready", async () => {
      console.log("WhatsApp Web Client is ready!");
      this.isReady = true;

      if (this.client) {
        const clientInfo = (this.client as any).info;
        const accountName = clientInfo.pushname || "Unknown";
        const accountNumber = clientInfo.wid.user || "Unknown";

        this.currentAccountInfo = { name: accountName, number: accountNumber };
        onAuthenticated(accountName, accountNumber);
        console.log(`Ready - Account: ${accountName} (${accountNumber})`);
      }
    });

    this.client.on("authenticated", () => {
      console.log("WhatsApp Web Client authenticated");
    });

    this.client.on("auth_failure", (msg: any) => {
      console.error("Authentication failed:", msg);
    });

    this.client.on("disconnected", (reason: any) => {
      console.log("WhatsApp Web Client disconnected:", reason);
      this.isReady = false;
      this.currentAccountInfo = null;
      onDisconnected();
    });

    await this.client.initialize();
  }

  async checkNumber(phoneNumber: string): Promise<{
    isRegistered: boolean;
    error?: string;
  }> {
    if (!this.client || !this.isReady) {
      return { isRegistered: false, error: "WhatsApp client not ready" };
    }

    try {
      // Remove all non-digit characters
      let formattedNumber = phoneNumber.replace(/\D/g, "");

      // Format number with Indonesian country code (62)
      // This handles all formats:
      // - 88980818668 -> 6288980818668
      // - 08123456789 -> 62123456789
      // - 6281234567890 -> 6281234567890 (no change)
      if (!formattedNumber.startsWith("62")) {
        if (formattedNumber.startsWith("0")) {
          // Replace leading 0 with 62
          formattedNumber = "62" + formattedNumber.substring(1);
        } else {
          // Add 62 prefix for numbers starting with 8
          formattedNumber = "62" + formattedNumber;
        }
      }

      // Format for WhatsApp Web (add @c.us suffix)
      const formattedTarget = formattedNumber + "@c.us";

      console.log(`Checking number: ${phoneNumber} -> ${formattedTarget}`);

      // Check if number is registered on WhatsApp
      const isRegistered = await (this.client as any).isRegisteredUser(
        formattedTarget,
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

  getAccountInfo() {
    return this.currentAccountInfo;
  }

  isClientReady(): boolean {
    return this.isReady;
  }

  async destroy() {
    if (this.client) {
      await (this.client as any).destroy();
      this.client = null;
      this.isReady = false;
      this.currentAccountInfo = null;
    }
  }
}

export const whatsappClient = new WhatsAppClient();
