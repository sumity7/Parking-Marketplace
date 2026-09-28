// Run with: npm run seed:admin
// Creates (or promotes) an admin account using ADMIN_EMAIL / ADMIN_PASSWORD from .env.local
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function main() {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Missing MONGODB_URI, ADMIN_EMAIL or ADMIN_PASSWORD in .env.local");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  const UserSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const email = ADMIN_EMAIL.toLowerCase();

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "admin";
    existing.verified = true;
    await existing.save();
    console.log(`Promoted existing user ${email} to admin.`);
  } else {
    await User.create({
      name: "Admin",
      email,
      passwordHash,
      role: "admin",
      verified: true,
    });
    console.log(`Created new admin account: ${email}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
