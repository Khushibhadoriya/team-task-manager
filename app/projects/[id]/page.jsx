"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;
  return new Date(task.dueDate) < new Date();
}

function StatusBadge({ status }) {
  const map = {
    "todo":        { cls: "bg-slate-100 text-slate-600",  label: "To Do"       },
    "in-progress": { cls: "bg-blue-100 text-blue-700",    label: "In Progress" },
    "done":        { cls: "bg-green-100 text-green-700",  label: "Done"        },
  };
  const { cls, label } = map[status] || map["todo"];
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    low:    "bg-gray-100 text-gray-500",
    medium: "bg-amber-100 text-amber-700",
    high:   "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${map[priority]}`}>
      {priority}
    </span>
  );
}

function TaskCard({ task, onStatusChange, onDelete, isAdmin }) {
  const [updating, setUpdating] = useState(false);
  const statusOrder = ["todo", "in-progress", "done"];
  const nextStatus  = statusOrder[(statusOrder.indexOf(task.status) + 1) % 3];
  const nextLabel   = { "todo": "Start", "in-progress": "Complete", "done": "Reopen" };

  async function handleStatusChange() {
    setUpdating(true);
    await onStatusChange(task._id, nextStatus);
    setUpdating(false);
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 transition-all hover:shadow-md ${
      isOverdue(task) ? "border-red-200" : "border-gray-100"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold ${
              task.status === "done" ? "line-through text-gray-400" : "text-gray-800"
            }`}>
              {task.title}
            </p>
            {isOverdue(task) && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                Overdue
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <PriorityBadge priority={task.priority} />
            {task.assignedTo ? (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <div
                  className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold"
                  style={{ fontSize: "8px" }}
                >
                  {task.assignedTo.name?.charAt(0).toUpperCase()}
                </div>
                {task.assignedTo.name}
              </span>
            ) : (
              <span className="text-xs text-gray-400">Unassigned</span>
            )}
            {task.dueDate && (
              <span className={`text-xs font-medium ${isOverdue(task) ? "text-red-500" : "text-gray-400"}`}>
                📅 {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={task.status} />
          <div className="flex items-center gap-1">
            <button
              onClick={handleStatusChange}
              disabled={updating}
              className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-semibold transition disabled:opacity-50"
            >
              {updating ? "..." : nextLabel[task.status]}
            </button>
            {isAdmin && (
              <button
                onClick={() => onDelete(task._id)}
                className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                title="Delete task"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateTaskModal({ isOpen, onClose, projectId, members, onCreated }) {
  const [form, setForm] = useState({
    title: "", description: "", assignedTo: "",
    priority: "medium", dueDate: "",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setForm({ title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" });
  }, [isOpen]);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Task title is required.");
    try {
      setLoading(true);
      const body = {
        title:       form.title.trim(),
        description: form.description.trim(),
        projectId,
        priority:    form.priority,
        assignedTo:  form.assignedTo || undefined,
        dueDate:     form.dueDate    || undefined,
      };
      const res  = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onCreated(data.task);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
      <Alert message={error} type="error" />
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
          <input type="text" name="title" value={form.title}
            onChange={handleChange} placeholder="e.g. Design login page"
            className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <textarea name="description" value={form.description}
            onChange={handleChange} placeholder="Task details..."
            rows={2} className={`${inputClass} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
            <input type="date" name="dueDate" value={form.dueDate}
              onChange={handleChange} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign To</label>
          <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className={inputClass}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user._id} value={m.user._id}>
                {m.user.name} ({m.role})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition flex items-center justify-center">
            {loading ? <Spinner size="sm" /> : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddMemberModal({ isOpen, onClose, projectId, onAdded }) {
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState("member");
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) { setEmail(""); setRole("member"); setError(""); setSuccess(""); }
  }, [isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return setError("Email is required.");
    try {
      setLoading(true);
      setError(""); setSuccess("");
      const res  = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(data.message);
      setEmail(""); setRole("member");
      onAdded(data.project);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member">
      <Alert message={error}   type="error"   />
      <Alert message={success} type="success" />
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
          <input type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="teammate@example.com"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
          <p className="text-xs text-gray-400 mt-1.5">They must already have a TaskFlow account.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
            <option value="member">Member — can update task status</option>
            <option value="admin">Admin — can manage tasks and members</option>
          </select>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            Close
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition flex items-center justify-center">
            {loading ? <Spinner size="sm" /> : "Add Member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectDetailPage() {
  const { id }   = useParams();
  const { user } = useAuth();
  const router   = useRouter();

  const [project,  setProject]  = useState(null);
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [filter,   setFilter]   = useState("all");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember,  setShowAddMember]  = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProject(data.project);
      setTasks(data.tasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const isAdmin = project && user && (
    project.owner._id?.toString() === user._id?.toString() ||
    project.members?.some(
      (m) => m.user._id?.toString() === user._id?.toString() && m.role === "admin"
    )
  );

  const isOwner = project && user &&
    project.owner._id?.toString() === user._id?.toString();

  async function handleStatusChange(taskId, newStatus) {
    try {
      const res  = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteTask(taskId) {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    try {
      const res  = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteProject() {
    if (!confirm("Delete this project and ALL its tasks? This cannot be undone.")) return;
    try {
      const res  = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      router.push("/projects");
    } catch (err) {
      alert(err.message);
    }
  }

  // ✅ NEW — Remove member handler
  async function handleRemoveMember(memberId) {
    if (!confirm("Remove this member from the project?")) return;
    try {
      const res  = await fetch(`/api/projects/${id}/members/${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Remove instantly from local state — no page reload needed
      setProject((prev) => ({
        ...prev,
        members: prev.members.filter(
          (m) => m.user._id?.toString() !== memberId?.toString()
        ),
      }));
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all")     return true;
    if (filter === "overdue") return isOverdue(t);
    return t.status === filter;
  });

  const taskStats = {
    total:      tasks.length,
    todo:       tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    done:       tasks.filter((t) => t.status === "done").length,
    overdue:    tasks.filter((t) => isOverdue(t)).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-red-500 font-medium">{error}</p>
        <Link href="/projects"
          className="mt-4 inline-block text-indigo-600 hover:underline text-sm font-medium">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/projects" className="hover:text-indigo-600 transition font-medium">
          Projects
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full capitalize">
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="text-indigo-200 text-sm mt-1.5 max-w-xl">{project.description}</p>
            )}
            <p className="text-indigo-300 text-xs mt-2">Owner: {project.owner.name}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <>
                <button onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                  Add Member
                </button>
                <button onClick={() => setShowCreateTask(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New Task
                </button>
              </>
            )}
            {isOwner && (
              <button onClick={handleDeleteProject}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/30 hover:bg-red-500/50 text-white text-sm font-semibold rounded-xl transition">
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/20 flex-wrap">
          {[
            { label: "Total",       value: taskStats.total,      color: "text-white"      },
            { label: "To Do",       value: taskStats.todo,       color: "text-indigo-200" },
            { label: "In Progress", value: taskStats.inProgress, color: "text-amber-300"  },
            { label: "Done",        value: taskStats.done,       color: "text-green-300"  },
            { label: "Overdue",     value: taskStats.overdue,    color: "text-red-300"    },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-indigo-300 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Tasks */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-fit flex-wrap">
            {[
              { key: "all",         label: `All (${taskStats.total})`              },
              { key: "todo",        label: `To Do (${taskStats.todo})`             },
              { key: "in-progress", label: `In Progress (${taskStats.inProgress})` },
              { key: "done",        label: `Done (${taskStats.done})`              },
              { key: "overdue",     label: `Overdue (${taskStats.overdue})`        },
            ].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  filter === f.key
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="text-5xl mb-4">{filter === "done" ? "🎉" : "📭"}</div>
              <p className="text-gray-500 font-medium">
                {filter === "all" ? "No tasks yet."
                  : filter === "done" ? "No completed tasks yet."
                  : `No ${filter} tasks.`}
              </p>
              {isAdmin && filter === "all" && (
                <button onClick={() => setShowCreateTask(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
                  Create First Task
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteTask}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>

        {/* ✅ Members sidebar — with remove button */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Team Members</h3>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {project.members.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {project.members.map((m) => {
                const memberIsOwner = m.user._id?.toString() === project.owner._id?.toString();
                return (
                  <div key={m.user._id} className="flex items-center gap-3 px-5 py-3 group">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {m.user.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {m.user.name}
                        {memberIsOwner && (
                          <span className="ml-1 text-xs text-amber-500">★</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                    </div>

                    {/* Role badge */}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      m.role === "admin"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {m.role}
                    </span>

                    {/* ✅ Remove button — hover to reveal, never on owner */}
                    {isAdmin && !memberIsOwner && (
                      <button
                        onClick={() => handleRemoveMember(m.user._id)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all flex-shrink-0"
                        title={`Remove ${m.user.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11"
                          viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {isAdmin && (
              <div className="px-5 py-3 border-t border-gray-100">
                <button onClick={() => setShowAddMember(true)}
                  className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 text-xs font-semibold rounded-xl transition">
                  + Add Member
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={id}
        members={project.members}
        onCreated={(task) => setTasks((prev) => [task, ...prev])}
      />
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        projectId={id}
        onAdded={(updatedProject) => setProject(updatedProject)}
      />
    </div>
  );
}