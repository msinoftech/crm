/**
 * One-time script to create the first superadmin user.
 * Run from repo root (with .env.local containing Supabase keys):
 *
 *   node scripts/create-superadmin.cjs your@email.com YourSecurePassword
 *
 * Or with yarn (loads .env.local):
 *   yarn create-superadmin your@email.com YourSecurePassword
 *
 * Then log in at the Superadmin app (e.g. http://localhost:3001/login).
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, password] = process.argv.slice(2);

if (!url || !serviceRoleKey) {
  console.error("Missing env: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!email || !password) {
  console.error("Usage: node scripts/create-superadmin.cjs <email> <password>");
  console.error("Example: node scripts/create-superadmin.cjs admin@example.com MySecurePass123");
  process.exit(1);
}
if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { role: "superadmin" },
  });
  if (error) {
    console.error("Failed to create superadmin:", error.message);
    process.exit(1);
  }
  console.log("Superadmin user created successfully.");
  console.log("  Email:", data.user?.email);
  console.log("  ID:", data.user?.id);
  console.log("  user_metadata.role: superadmin");
  console.log("\nYou can now log in at the Superadmin app (e.g. http://localhost:3001/login).");
}

main();
