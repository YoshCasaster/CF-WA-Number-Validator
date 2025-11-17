# WhatsApp Number Checker - Implementation Notes

## Fitur yang Sudah Diimplementasikan

### 1. Authentication & User Management
- **Register**: User bisa daftar dengan email, password, dan nama lengkap
- **Login**: User login dengan email/password
- **Session Management**: Cookie-based authentication dengan token
- **Protected Routes**: Halaman utama hanya bisa diakses setelah login

### 2. Multi-User WhatsApp Sessions
- Setiap user memiliki WhatsApp session terpisah
- Session disimpan di folder `.wwebjs_sessions/user-{userId}`
- QR Code personal untuk setiap user
- Session info disimpan di database (Supabase)

### 3. Database Schema (Supabase)
- **users**: Data user (email, password hash, nama)
- **whatsapp_sessions**: Status WhatsApp session per user
- **check_history**: History checking nomor per user

### 4. Real-time Features
- WebSocket dengan authentication per user
- Real-time QR code generation
- Real-time checking progress
- Broadcast hasil checking ke user yang bersangkutan saja

### 5. UI/UX Improvements
- Login/Register pages dengan validation
- User menu dropdown (profile info, clear session, logout)
- Loading states & error handling
- Toast notifications untuk feedback

### 6. Security
- Password hashing dengan bcrypt
- Row Level Security (RLS) di Supabase
- User hanya bisa akses data sendiri
- Token-based authentication
- HttpOnly cookies

## Cara Menggunakan

### Setup Pertama Kali

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Pastikan DATABASE_URL sudah di .env**
   File .env sudah berisi Supabase connection string

3. **Run Development Server**
   ```bash
   npm run dev
   ```

### Flow Penggunaan

1. **Register/Login**
   - Buka http://localhost:5000
   - Akan redirect ke /login
   - Klik "Daftar di sini" untuk register
   - Isi form: Nama, Email, Password
   - Setelah register, auto login

2. **Scan QR WhatsApp**
   - Setelah login, otomatis muncul QR code modal
   - Scan QR dengan WhatsApp di HP
   - Tunggu sampai status "Connected"

3. **Check Nomor**
   - Input nomor (satu per baris) atau upload file .txt
   - Format: 8xxx atau 08xxx (auto tambah 62)
   - Klik "Start Checking"
   - Lihat hasil real-time di tabel

4. **Export Hasil**
   - Klik "Copy Results" di panel kanan
   - Format: 1 untuk aktif, kosong untuk non-WA

5. **Clear Session**
   - Klik user icon (pojok kanan atas)
   - Pilih "Clear WA Session" untuk logout WhatsApp
   - QR code akan muncul lagi

6. **Logout**
   - Klik user icon
   - Pilih "Logout"

## File Structure

```
server/
├── auth.ts              # Auth functions (login, register, hash)
├── db.ts                # Supabase DB connection
├── db-schema.ts         # Drizzle schema definitions
├── routes.ts            # Express routes + WebSocket server
├── whatsapp-manager.ts  # Multi-user WhatsApp session manager
└── index.ts             # Server entry point

client/src/
├── contexts/
│   └── AuthContext.tsx  # Auth context provider
├── lib/
│   └── auth.ts          # Auth API calls
├── pages/
│   ├── LoginPage.tsx    # Login page
│   ├── RegisterPage.tsx # Register page
│   └── HomePage.tsx     # Main checker page (protected)
├── components/
│   ├── AppHeader.tsx    # Header with user menu
│   ├── QRAuthModal.tsx  # QR code modal
│   ├── UploadInterface.tsx
│   ├── CheckingProgress.tsx
│   ├── QuickStats.tsx
│   └── ResultsTable.tsx
└── App.tsx              # Main app with routing

shared/
└── schema.ts            # Shared TypeScript schemas
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### WhatsApp Session
- `GET /api/whatsapp/session` - Get session status
- `DELETE /api/whatsapp/session` - Clear WhatsApp session

### History
- `GET /api/history?limit=100` - Get check history

## WebSocket Messages

### Client → Server
```json
{
  "type": "authenticate",
  "token": "auth_token_here"
}

{
  "type": "startCheck",
  "numbers": ["628123456789", "628987654321"]
}
```

### Server → Client
```json
{
  "type": "qr",
  "qrCode": "data:image/png;base64,..."
}

{
  "type": "authenticated",
  "accountName": "John Doe",
  "accountNumber": "628123456789"
}

{
  "type": "checkStart",
  "number": "628123456789"
}

{
  "type": "checkResult",
  "result": {
    "id": "uuid",
    "phoneNumber": "628123456789",
    "status": "active" | "non-wa" | "error",
    "timestamp": "2025-01-10T12:00:00Z",
    "errorMessage": "optional error"
  }
}

{
  "type": "checkComplete"
}

{
  "type": "disconnected"
}

{
  "type": "error",
  "message": "Error message"
}
```

## Important Notes

### Session Management
- WhatsApp sessions disimpan di `.wwebjs_sessions/` folder
- JANGAN commit folder ini ke git (sudah ada di .gitignore)
- Setiap user punya folder terpisah: `.wwebjs_sessions/session-user-{userId}`

### Database
- Menggunakan Supabase PostgreSQL
- RLS enabled untuk semua tabel
- User hanya bisa akses data sendiri

### Security
- Password di-hash dengan bcrypt (10 rounds)
- Token expired setelah 24 jam
- HttpOnly cookies untuk prevent XSS
- CSRF protection dengan SameSite cookies

### Rate Limiting
- Delay 3 detik antar nomor checking
- Untuk prevent WhatsApp rate limit
- Bisa diubah di `server/routes.ts` line 352

## Troubleshooting

### WhatsApp Client Fails to Initialize
- Pastikan semua dependencies terinstall
- Check folder `.wwebjs_sessions` writable
- Clear session folder jika corrupt

### Database Connection Error
- Check DATABASE_URL di .env
- Pastikan Supabase project aktif

### WebSocket Not Connecting
- Check browser console untuk error
- Pastikan token valid (belum expired)
- Try logout & login again

### QR Code Tidak Muncul
- Clear WhatsApp session dari user menu
- Refresh page
- Check server logs

## Production Deployment

### Environment Variables
```bash
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=5000
```

### Build
```bash
npm run build
npm start
```

### Important
- Backup `.wwebjs_sessions` folder regularly
- Monitor disk space (WhatsApp sessions bisa besar)
- Setup proper logging untuk production
- Consider rate limiting di API endpoints
