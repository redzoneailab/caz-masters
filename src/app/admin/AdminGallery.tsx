"use client";

import { useState, useEffect, useCallback } from "react";

interface Album {
  id: string;
  year: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  _count: { photos: number };
}

const YEARS = Array.from({ length: 15 }, (_, i) => 2026 - i);

export default function AdminGallery({ password }: { password: string }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create album form
  const [showForm, setShowForm] = useState(false);
  const [year, setYear] = useState(2025);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Bulk photo upload
  const [uploadAlbumId, setUploadAlbumId] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState("");
  const [uploading, setUploading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gallery/albums", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAlbums(data.albums);
    } catch {
      setError("Failed to load albums");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  async function createAlbum(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/gallery/albums", {
        method: "POST",
        headers,
        body: JSON.stringify({
          year,
          title: title.trim(),
          description: description.trim() || undefined,
          coverUrl: coverUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create album");
        return;
      }
      setTitle("");
      setDescription("");
      setCoverUrl("");
      setShowForm(false);
      await fetchAlbums();
    } catch {
      setError("Failed to create album");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAlbum(albumId: string) {
    if (!confirm("Delete this album and all its photos?")) return;
    try {
      await fetch(`/api/admin/gallery/albums/${albumId}`, {
        method: "DELETE",
        headers,
      });
      await fetchAlbums();
    } catch {
      setError("Failed to delete album");
    }
  }

  async function bulkUploadPhotos(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadAlbumId || !photoUrls.trim()) return;
    setUploading(true);
    setError("");
    try {
      const urls = photoUrls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      const res = await fetch("/api/admin/gallery/photos", {
        method: "POST",
        headers,
        body: JSON.stringify({
          albumId: uploadAlbumId,
          photos: urls.map((url) => ({ url })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to upload photos");
        return;
      }
      setPhotoUrls("");
      setUploadAlbumId(null);
      await fetchAlbums();
    } catch {
      setError("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading gallery...</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-900">Albums ({albums.length})</h2>
        <div className="flex gap-2">
          <button onClick={fetchAlbums} className="bg-white border border-navy-200 text-navy-600 px-4 py-2 rounded-lg text-sm hover:bg-navy-50">
            Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + New Album
          </button>
        </div>
      </div>

      {/* Create album form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-navy-100 p-5">
          <form onSubmit={createAlbum} className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="border border-navy-200 rounded-lg px-3 py-2 text-sm"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Album title *"
                className="border border-navy-200 rounded-lg px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="border border-navy-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Cover image URL"
                className="border border-navy-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-6 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Album"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-navy-500 hover:text-navy-700 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk photo upload */}
      {uploadAlbumId && (
        <div className="bg-white rounded-xl border border-gold-200 p-5">
          <h3 className="font-bold text-navy-900 mb-3">
            Add Photos to: {albums.find((a) => a.id === uploadAlbumId)?.title}
          </h3>
          <form onSubmit={bulkUploadPhotos} className="space-y-3">
            <textarea
              value={photoUrls}
              onChange={(e) => setPhotoUrls(e.target.value)}
              placeholder="Paste image URLs, one per line..."
              rows={6}
              className="w-full border border-navy-200 rounded-lg px-3 py-2 text-sm resize-none font-mono"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-6 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Add Photos"}
              </button>
              <button
                type="button"
                onClick={() => setUploadAlbumId(null)}
                className="text-navy-500 hover:text-navy-700 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Albums list */}
      <div className="space-y-3">
        {albums.map((album) => (
          <div key={album.id} className="bg-white rounded-xl border border-navy-100 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {album.coverUrl ? (
                <img src={album.coverUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-navy-100 flex items-center justify-center text-navy-300 text-xs">
                  No img
                </div>
              )}
              <div>
                <p className="font-semibold text-navy-900">
                  {album.title} <span className="text-navy-400 font-normal">({album.year})</span>
                </p>
                <p className="text-xs text-navy-500">{album._count.photos} photos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setUploadAlbumId(album.id)}
                className="text-xs bg-navy-50 text-navy-600 hover:bg-navy-100 px-3 py-1.5 rounded transition-colors font-medium"
              >
                Add Photos
              </button>
              <button
                onClick={() => deleteAlbum(album.id)}
                className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {albums.length === 0 && (
        <p className="text-navy-400 text-sm text-center py-8">
          No albums yet. Create one to start adding photos.
        </p>
      )}
    </div>
  );
}
