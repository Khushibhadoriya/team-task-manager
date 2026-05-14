import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,                     // removes accidental spaces
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,                   // no two users with same email
      lowercase: true,                // store as lowercase always
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,                  // ← NEVER return password in queries by default
    },
    role: {
      type: String,
      enum: ["admin", "member"],      // only these two values allowed
      default: "member",
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,                 // auto adds createdAt and updatedAt
  }
);

// ─── MIDDLEWARE: Hash password before saving ───────────────────────────────
// This runs automatically every time we save a User document
UserSchema.pre("save", async function () {
  // Only hash if password was actually changed (not on profile updates)
  if (!this.isModified("password")) return ;

  // bcrypt turns "mypassword123" into "$2b$10$xK9..." — unreadable
  // The "12" is the salt rounds — higher = more secure but slower
  this.password = await bcrypt.hash(this.password, 12);
  
});

// ─── METHOD: Compare password during login ────────────────────────────────
// We add a custom method to every User document
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Prevent model re-compilation in Next.js hot reload
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;