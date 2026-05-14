import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate, isProjectAdmin } from "@/lib/middleware";
import Task from "@/models/Task";
import Project from "@/models/Project";

// ─── GET /api/tasks/[id] ──────────────────────────────────────────────────
export async function GET(request, { params }) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();

    const task = await Task.findById(params.id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name description");

    if (!task) {
      return NextResponse.json(
        { message: "Task not found." },
        { status: 404 }
      );
    }

    // Verify user belongs to the project this task is in
    const project = await Project.findById(task.project._id);
    const isMember = project.members.some(
      (m) => m.user.toString() === user._id.toString()
    );
    const isOwner = project.owner.toString() === user._id.toString();

    if (!isMember && !isOwner) {
      return NextResponse.json(
        { message: "You don't have access to this task." },
        { status: 403 }
      );
    }

    return NextResponse.json({ task });

  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json(
      { message: "Failed to fetch task." },
      { status: 500 }
    );
  }
}

// ─── PUT /api/tasks/[id] ──────────────────────────────────────────────────
// Members can update STATUS only
// Admins/owners can update everything
export async function PUT(request, { params }) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();
     
    const {id} = await params
    const task = await Task.findById(id);

    if (!task) {
      return NextResponse.json(
        { message: "Task not found." },
        { status: 404 }
      );
    }

    const project = await Project.findById(task.project);
    const isAdmin = isProjectAdmin(project, user._id);
    const isMember = project.members.some(
      (m) => m.user.toString() === user._id.toString()
    );

    if (!isAdmin && !isMember) {
      return NextResponse.json(
        { message: "You don't have access to this task." },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (isAdmin) {
      // ── Admins can update everything ───────────────────────────────
      if (body.title && body.title.trim().length < 2) {
        return NextResponse.json(
          { message: "Task title must be at least 2 characters." },
          { status: 400 }
        );
      }

      if (body.title)                       task.title       = body.title.trim();
      if (body.description !== undefined)   task.description = body.description.trim();
      if (body.status)                      task.status      = body.status;
      if (body.priority)                    task.priority    = body.priority;
      if (body.dueDate !== undefined)       task.dueDate     = body.dueDate;
      if (body.assignedTo !== undefined)    task.assignedTo  = body.assignedTo;

    } else {
      // ── Regular members can ONLY update status ─────────────────────
      if (!body.status) {
        return NextResponse.json(
          { message: "Members can only update task status." },
          { status: 403 }
        );
      }
      task.status = body.status;
    }

    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("project", "name");

    return NextResponse.json({
      message: "Task updated successfully!",
      task,
    });

  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { message: "Failed to update task." },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/tasks/[id] ───────────────────────────────────────────────
export async function DELETE(request, { params }) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();
     const {id} = await params
    const task = await Task.findById(id);

    if (!task) {
      return NextResponse.json(
        { message: "Task not found." },
        { status: 404 }
      );
    }

    const project = await Project.findById(task.project);

    // Only project admin/owner can delete tasks
    if (!isProjectAdmin(project, user._id)) {
      return NextResponse.json(
        { message: "Only project admins can delete tasks." },
        { status: 403 }
      );
    }
     
    await Task.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Task deleted successfully.",
    });

  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { message: "Failed to delete task." },
      { status: 500 }
    );
  }
}