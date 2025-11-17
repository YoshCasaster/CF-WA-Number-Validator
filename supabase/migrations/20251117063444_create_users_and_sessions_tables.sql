/*
  # Create User Authentication and WhatsApp Session Management

  ## Tables Created
  
  1. `users` - User accounts
     - `id` (uuid, primary key) - User identifier
     - `email` (text, unique) - User email for login
     - `password_hash` (text) - Hashed password
     - `full_name` (text) - User's full name
     - `created_at` (timestamptz) - Account creation timestamp
     - `last_login` (timestamptz) - Last login timestamp
     - `is_active` (boolean) - Account active status
  
  2. `whatsapp_sessions` - WhatsApp session status per user
     - `id` (uuid, primary key)
     - `user_id` (uuid, foreign key) - Reference to users table
     - `is_authenticated` (boolean) - WhatsApp authentication status
     - `account_name` (text) - WhatsApp account name
     - `account_number` (text) - WhatsApp phone number
     - `last_qr_generated` (timestamptz) - Last QR code generation time
     - `session_created_at` (timestamptz) - Session creation time
     - `updated_at` (timestamptz) - Last update time
  
  3. `check_history` - History of phone number checks
     - `id` (uuid, primary key)
     - `user_id` (uuid, foreign key) - Reference to users table
     - `phone_number` (text) - Phone number checked
     - `status` (text) - Check result (active/non-wa/error)
     - `error_message` (text, nullable) - Error message if any
     - `checked_at` (timestamptz) - Timestamp of check
  
  ## Security
  
  - Enable RLS on all tables
  - Users can only access their own data
  - Proper indexes for performance
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
);

-- Create whatsapp_sessions table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_authenticated boolean DEFAULT false,
  account_name text,
  account_number text,
  last_qr_generated timestamptz,
  session_created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create check_history table
CREATE TABLE IF NOT EXISTS check_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'non-wa', 'error')),
  error_message text,
  checked_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user_id ON whatsapp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_check_history_user_id ON check_history(user_id);
CREATE INDEX IF NOT EXISTS idx_check_history_checked_at ON check_history(checked_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for whatsapp_sessions table
CREATE POLICY "Users can view own session"
  ON whatsapp_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own session"
  ON whatsapp_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own session"
  ON whatsapp_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own session"
  ON whatsapp_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for check_history table
CREATE POLICY "Users can view own check history"
  ON check_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own check history"
  ON check_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own check history"
  ON check_history FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
