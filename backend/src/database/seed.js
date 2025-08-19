import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './connection.js';
import User from '../models/User.js';

dotenv.config();

async function seedOwnerAdmin() {
  await connectDB();
  try {
    const email = process.env.SEED_OWNER_EMAIL || 'owner@zilliance.com';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`[seed] Owner already exists: ${email}`);
      return;
    }
    const password = process.env.SEED_OWNER_PASSWORD || 'ChangeMe!234';
    const user = new User({
      email,
      password,
      firstName: 'Owner',
      lastName: 'Admin',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });
    await user.save();
    console.log(`[seed] Created Owner admin: ${email}`);
  } catch (e) {
    console.error('[seed] Error seeding owner admin', e);
  } finally {
    await disconnectDB();
  }
}

seedOwnerAdmin();

