const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'admin' },
    passwordHash: { type: String, required: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('AdminUser', AdminUserSchema);
