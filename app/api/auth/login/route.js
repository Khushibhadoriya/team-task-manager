import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { signToken } from "@/lib/auth";
import User from "@/models/User";

export async function POST(request) {
  try {
    // ── 1. Parse body ──────────────────────────────────────────────────
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    // ── 2. Find user by email ──────────────────────────────────────────
    // NOTE: We use .select("+password") because we set select:false on password
    // We explicitly ASK for the password field here because we need to compare it
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      // ⚠️ Important: Don't say "email not found" — that leaks info
      // Always give a vague message for security
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // ── 3. Compare password ────────────────────────────────────────────
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // ── 4. Create token ────────────────────────────────────────────────
    const token = signToken(user._id);

    // ── 5. Build response ──────────────────────────────────────────────
    const response = NextResponse.json(
      {
        message: "Logged in successfully!",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // ── 6. Set cookie (same as signup) ─────────────────────────────────
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}