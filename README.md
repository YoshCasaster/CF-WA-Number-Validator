# WhatsApp Number Checker

Aplikasi web modern untuk mengecek apakah nomor telepon terdaftar di WhatsApp. Built dengan React, TypeScript, Express.js, dan whatsapp-web.js.

## Fitur

- ✅ **Autentikasi WhatsApp Web** - Scan QR code untuk connect
- ✅ **Upload Bulk Numbers** - Input manual atau upload file .txt
- ✅ **Real-time Checking** - Update status secara real-time via WebSocket
- ✅ **Dashboard Modern** - 3-column responsive layout dengan Material Design
- ✅ **Dark Mode** - Support light/dark theme
- ✅ **Export Results** - Download hasil checking dalam format CSV
- ✅ **Progress Tracking** - Monitor progress checking dengan visual yang jelas
- ✅ **Statistics** - Lihat statistik real-time (aktif, tidak terdaftar, error)

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS + Shadcn UI
- TanStack Query
- Socket.IO Client
- Wouter (routing)

**Backend:**
- Express.js
- WebSocket (ws)
- whatsapp-web.js
- QRCode generation

## Prerequisites

### System Requirements

whatsapp-web.js menggunakan Puppeteer untuk mengontrol Chrome/Chromium. Pastikan system dependencies berikut terinstall:

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install -y \
  chromium-browser \
  libgobject-2.0-0 \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2
```

**Note untuk Replit:** Di environment Replit, beberapa system libraries mungkin tidak tersedia. Untuk production deployment, sebaiknya gunakan Docker container atau VPS dengan full system access.

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## Cara Penggunaan

1. **Scan QR Code**
   - Buka aplikasi di browser
   - Modal QR code akan muncul otomatis
   - Scan QR code dengan WhatsApp di ponsel Anda
   - Tunggu sampai status "Connected" muncul

2. **Upload Nomor**
   - Masukkan nomor telepon (satu per baris) di textarea
   - Atau drag & drop file .txt berisi daftar nomor
   - Format nomor: `62812345678` atau `08123456789`

3. **Start Checking**
   - Klik tombol "Start Checking"
   - Monitor progress real-time di dashboard
   - Hasil akan muncul di tabel dengan status:
     - ✅ **AKTIF** - Nomor terdaftar di WhatsApp
     - ❌ **NON-WA** - Nomor tidak terdaftar
     - ⚠️ **ERROR** - Terjadi error saat checking

4. **Export Results**
   - Setelah checking selesai, klik "Export Results"
   - File CSV akan ter-download otomatis

## Format Nomor

Aplikasi mendukung format nomor Indonesia:
- Dengan kode negara: `62812345678`
- Tanpa kode negara: `08123456789` (akan otomatis dikonversi ke `62812345678`)

## Architecture

### Frontend Structure
```
client/src/
├── components/
│   ├── ui/              # Shadcn UI components
│   ├── AppHeader.tsx    # Header dengan status connection
│   ├── QRAuthModal.tsx  # Modal untuk scan QR WhatsApp
│   ├── UploadInterface.tsx   # Form upload nomor
│   ├── CheckingProgress.tsx  # Progress indicator
│   ├── QuickStats.tsx        # Statistics panel
│   ├── ResultsTable.tsx      # Tabel hasil checking
│   ├── ControlBar.tsx        # Control pause/resume/stop
│   └── ThemeProvider.tsx     # Dark mode provider
├── pages/
│   └── HomePage.tsx     # Main dashboard page
└── App.tsx
```

### Backend Structure
```
server/
├── whatsapp-client.ts   # WhatsApp Web client wrapper
├── routes.ts            # WebSocket server & routes
└── index.ts             # Express server entry point
```

### Data Flow

1. **Authentication Flow:**
   ```
   Client connects → WebSocket established → WhatsApp client generates QR
   → Broadcast QR to all clients → User scans → Authenticated event broadcast
   ```

2. **Checking Flow:**
   ```
   User submits numbers → WebSocket message {type: 'startCheck', numbers: []}
   → Server checks each number → Broadcast results in real-time
   → Update statistics → Checking complete
   ```

## API / WebSocket Messages

### Client → Server

```typescript
{
  type: "startCheck",
  numbers: string[]  // Array of phone numbers
}
```

### Server → Client

```typescript
// QR Code
{
  type: "qr",
  qrCode: string  // Data URL of QR code image
}

// Authenticated
{
  type: "authenticated",
  accountName: string,
  accountNumber: string
}

// Check Start
{
  type: "checkStart",
  number: string
}

// Check Result
{
  type: "checkResult",
  result: {
    id: string,
    phoneNumber: string,
    status: "active" | "non-wa" | "error",
    timestamp: string,
    errorMessage?: string
  }
}

// Check Complete
{
  type: "checkComplete"
}

// Error
{
  type: "error",
  message: string
}
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### ⚠️ SECURITY WARNING

**NEVER commit WhatsApp session files to version control!**

The following directories contain sensitive authentication data and are automatically ignored by `.gitignore`:
- `.wwebjs_auth/` - WhatsApp session cookies and tokens
- `.wwebjs_cache/` - Cached session data

If you've accidentally committed these files:
1. Remove them from git history immediately
2. Invalidate the WhatsApp session by logging out from all linked devices
3. Generate a new session by scanning QR code again

**For production deployment:**
- Store session data in a secure location (encrypted volume/secrets manager)
- Never share or expose `.wwebjs_auth` directory
- Implement proper session rotation and monitoring

## Troubleshooting

### WhatsApp client fails to initialize

**Error:** `Failed to launch the browser process!`

**Solution:** Install required system libraries (lihat Prerequisites)

### QR Code tidak muncul

- Check apakah WhatsApp client sudah ter-initialize (lihat server logs)
- Pastikan tidak ada session WhatsApp lain yang aktif
- Hapus folder `.wwebjs_auth` dan `.wwebjs_cache` lalu restart

### WebSocket disconnected

- Check apakah server masih running
- Refresh halaman browser
- Check firewall/proxy settings

## Production Deployment

### Recommended Setup

1. **Docker Container** - Paling reliable untuk Puppeteer/Chromium
2. **VPS dengan full root access** - Install semua dependencies
3. **Cloud Run / Container Services** - Support Docker

### Environment Variables

```bash
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secret-here
```

## License

ISC

## Credits

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp Web API client
- [Shadcn UI](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
