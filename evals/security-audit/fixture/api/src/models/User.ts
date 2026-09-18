import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    address: String,
    resetToken: String,
    resetTokenExpires: Date,
  },
  { timestamps: true },
);

export const User = model('User', userSchema);
