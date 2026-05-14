import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate, isProjectAdmin } from "@/lib/middleware";
import Project from "@/models/Project";
import Task from "@/models/Task";

// ─── GET /api/projects/[id] ───────────────────────────────────────────────
export async function GET(request, {params }) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();
     const {id} = await params
    const project = await Project.findById(id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    // Check if requesting user is actually part of this project
    const isMember = project.members.some(
      (m) => m.user._id.toString() === user._id.toString()
    );
    const isOwner = project.owner._id.toString() === user._id.toString();

    if (!isMember && !isOwner) {
      return NextResponse.json(
        { message: "You don't have access to this project." },
        { status: 403 }   // 403 = Forbidden (authenticated but not authorized)
      );
    }

    // Also fetch tasks for this project

    const tasks = await Task.find({ project: id })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ project, tasks });

  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { message: "Failed to fetch project." },
      { status: 500 }
    );
  }
}

// ─── PUT /api/projects/[id] ───────────────────────────────────────────────
export async function PUT(request, { params }) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();

    const {id} = await params

    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    // Only project admin or owner can update
    if (!isProjectAdmin(project, user._id)) {
      return NextResponse.json(
        { message: "Only project admins can update this project." },
        { status: 403 }
      );
    }

    const { name, description, status } = await request.json();

    if (name && name.trim().length < 2) {
      return NextResponse.json(
        { message: "Project name must be at least 2 characters." },
        { status: 400 }
      );
    }

    // Only update fields that were actually sent
    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (status) project.status = status;

    await project.save();
    await project.populate("owner", "name email");
    await project.populate("members.user", "name email");

    return NextResponse.json({
      message: "Project updated successfully!",
      project,
    });

  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { message: "Failed to update project." },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/projects/[id] ────────────────────────────────────────────
export async function DELETE(request, { params }) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();

    const project = await Project.findById(params.id);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    // Only the OWNER can delete (stricter than admin)
    if (project.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: "Only the project owner can delete this project." },
        { status: 403 }
      );
    }

    // Delete all tasks belonging to this project first
    await Task.deleteMany({ project: params.id });

    // Then delete the project
    await Project.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: "Project and all its tasks deleted successfully.",
    });

  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { message: "Failed to delete project." },
      { status: 500 }
    );
  }
}