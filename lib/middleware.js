import { NextResponse } from "next/server";
import { verifyToken } from "./auth";
import { connectDB } from "./db";
import User from "@/models/User";

export async function authenticate(request) {
  try {
    // ── 1. Get the token from cookies ──────────────────────────────────
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return {
        error: NextResponse.json(
          { message: "Not authenticated. Please login." },
          { status: 401 }
        ),
      };
    }

    // ── 2. Verify the token is valid and not expired ───────────────────
    const decoded = verifyToken(token);

    if (!decoded) {
      return {
        error: NextResponse.json(
          { message: "Invalid or expired token. Please login again." },
          { status: 401 }
        ),
      };
    }

    // ── 3. Fetch the actual user from DB using the userId in the token ──
    await connectDB();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return {
        error: NextResponse.json(
          { message: "User no longer exists." },
          { status: 401 }
        ),
      };
    }

    // ── 4. Return the user so the API route can use it ──────────────────
    return { user };

  } catch (error) {
    return {
      error: NextResponse.json(
        { message: "Authentication failed." },
        { status: 500 }
      ),
    };
  }
}

// ─── RBAC Helper: Check if user is project admin ──────────────────────────
// We'll call this in Project/Task routes to check permissions
export function isProjectAdmin(project, userId) {
  const member = project.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  return (
    project.owner.toString() === userId.toString() ||
    member?.role === "admin"
  );
}