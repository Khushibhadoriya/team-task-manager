import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/middleware";
import Project from "@/models/Project";

// ─── GET /api/projects ────────────────────────────────────────────────────
// Returns all projects where the user is owner OR a member
export async function GET(request) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();

    const projects = await Project.find({
      $or: [
        { owner: user._id },
        { "members.user": user._id },
      ],
    })
      .populate("owner", "name email")           // replace owner ID with name+email
      .populate("members.user", "name email")    // replace each member ID with name+email
      .sort({ createdAt: -1 });                  // newest first

    return NextResponse.json({ projects });

  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { message: "Failed to fetch projects." },
      { status: 500 }
    );
  }
}

// ─── POST /api/projects ───────────────────────────────────────────────────
// Creates a new project. Creator becomes owner AND first admin member
export async function POST(request) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    const { name, description } = await request.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { message: "Project name must be at least 2 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || "",
      owner: user._id,
      // Creator is automatically added as first admin member
      members: [{ user: user._id, role: "admin" }],
    });

    // Populate before returning so frontend gets full user info
    await project.populate("owner", "name email");
    await project.populate("members.user", "name email");

    return NextResponse.json(
      { message: "Project created successfully!", project },
      { status: 201 }
    );

  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { message: "Failed to create project." },
      { status: 500 }
    );
  }
}