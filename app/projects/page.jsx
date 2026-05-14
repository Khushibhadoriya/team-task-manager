"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

// ── Project Card ──────────────────────────────────────────────────────────
function ProjectCard({ project }) {
  const statusStyles = {
    active:    "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    "on-hold": "bg-amber-100 text-amber-700",
  };

  const totalTasks = project.taskCount || 0;

  return (
    <Link href={`/projects/${project._id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 cursor-pointer group">

        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {project.name.charAt(0).toUpperCase()}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyles[project.status]}`}>
            {project.status}
          </span>
        </div>

        {/* Name + description */}
        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
          {project.name}
        </h3>
        {project.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            {/* Member avatars */}
            <div className="flex -space-x-2">
              {project.members.slice(0, 3).map((m) => (
                <div
                  key={m.user._id}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  title={m.user.name}
                >
                  {m.user.name?.charAt(0).toUpperCase()}
                </div>
              ))}
              {project.members.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-500 text-xs font-bold">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400 ml-1">
              {project.members.length} member{project.members.length !== 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Create Project Modal Form ──────────────────────────────────────────────
function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const [form,    setForm]    = useState({ name: "", description: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Project name is required.");

    try {
      setLoading(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onCreated(data.project);
      setForm({ name: "", description: "" });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <Alert message={error} type="error" />
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Project Name *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Website Redesign"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What is this project about?"
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { user }              = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects.");
      const data = await res.json();
      setProjects(data.projects);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleProjectCreated(project) {
    setProjects((prev) => [project, ...prev]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""} you&apos;re part of
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Project
        </button>
      </div>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && <Alert message={error} type="error" />}

      {/* ── Empty State ───────────────────────────────────────── */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-6xl mb-4">🗂️</div>
          <h3 className="text-lg font-bold text-gray-900">No projects yet</h3>
          <p className="text-gray-500 text-sm mt-1.5 max-w-sm mx-auto">
            Create your first project and start assigning tasks to your team.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-5 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────────── */}
      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}