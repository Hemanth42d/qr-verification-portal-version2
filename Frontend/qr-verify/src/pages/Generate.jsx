import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { LuUpload, LuDownload, LuCircleCheck, LuLoader } from "react-icons/lu";

export default function Generate() {
  const [templates, setTemplates] = useState([]);
  const [mode, setMode] = useState("single");
  const [form, setForm] = useState({ templateId: "", participantName: "", email: "", eventName: "", eventDate: "", venue: "", certificateId: "" });
  const [bulkForm, setBulkForm] = useState({ templateId: "", eventName: "", eventDate: "", venue: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [singleProgress, setSingleProgress] = useState(null); // null | "generating" | "uploading" | "saving" | "done" | "error"
  const [job, setJob] = useState(null);

  useEffect(() => {
    api.get("/templates").then((r) => setTemplates(r.data.templates)).catch(() => {});
  }, []);

  const handleSingle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSingleProgress("generating");
    try {
      // Simulate progress stages
      setTimeout(() => setSingleProgress("uploading"), 800);
      setTimeout(() => setSingleProgress("saving"), 1600);
      const payload = { ...form };
      if (!payload.certificateId) delete payload.certificateId;
      const { data } = await api.post("/certificates/generate", payload);
      setSingleProgress("done");
      toast.success("Certificate generated!");
      setForm({ ...form, participantName: "", email: "", certificateId: "" });
      setTimeout(() => setSingleProgress(null), 3000);
    } catch (err) {
      setSingleProgress("error");
      toast.error(err.response?.data?.message || "Generation failed");
      setTimeout(() => setSingleProgress(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleBulk = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please upload a CSV/XLSX file");
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("templateId", bulkForm.templateId);
    if (bulkForm.eventName) fd.append("eventName", bulkForm.eventName);
    if (bulkForm.eventDate) fd.append("eventDate", bulkForm.eventDate);
    if (bulkForm.venue) fd.append("venue", bulkForm.venue);
    try {
      const { data } = await api.post("/certificates/generate-bulk", fd);
      toast.success(`Bulk generation started: ${data.totalParticipants} certificates`);
      setJob(data);
      pollJob(data.jobId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk generation failed");
    } finally {
      setLoading(false);
    }
  };

  const pollJob = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/certificates/job/${jobId}`);
        setJob((prev) => ({ ...prev, ...data }));
        if (data.status !== "processing") {
          clearInterval(interval);
          if (data.status === "completed") toast.success("All certificates generated!");
          else toast("Completed with some errors", { icon: "⚠️" });
        }
      } catch { clearInterval(interval); }
    }, 2000);
  };

  const singleStages = [
    { key: "generating", label: "Generating PDF..." },
    { key: "uploading", label: "Uploading to Drive..." },
    { key: "saving", label: "Saving metadata..." },
    { key: "done", label: "Certificate ready!" },
    { key: "error", label: "Generation failed" },
  ];

  const singleProgressPercent = { generating: 25, uploading: 55, saving: 80, done: 100, error: 100 };

  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Certificate Generation</h1>
      <p className="text-slate-500 text-sm mb-6">Generate single or bulk certificates</p>

      <div className="flex gap-2 mb-6">
        {["single", "bulk"].map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === m ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {m === "single" ? "Single" : "Bulk Upload"}
          </button>
        ))}
      </div>

      {mode === "single" ? (
        <div className="max-w-2xl">
          <form onSubmit={handleSingle} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template</label>
              <select value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} required className={inputClass}>
                <option value="">Select template</option>
                {templates.map((t) => <option key={t._id} value={t._id}>{t.templateName}</option>)}
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Participant Name</label><input type="text" value={form.participantName} onChange={(e) => setForm({ ...form, participantName: e.target.value })} required className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputClass} /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Certificate ID <span className="text-slate-400 font-normal">(optional — auto-generated if empty)</span></label>
              <input type="text" value={form.certificateId} onChange={(e) => setForm({ ...form, certificateId: e.target.value })} className={inputClass} placeholder="e.g. TECH-2026-001" />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label><input type="text" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} required className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Event Date</label><input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Venue</label><input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required className={inputClass} /></div>
            </div>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? "Generating..." : "Generate Certificate"}
            </button>
          </form>

          {singleProgress && (
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {singleProgress === "done" ? <LuCircleCheck size={18} className="text-emerald-600" /> : singleProgress === "error" ? <span className="text-red-500 text-lg">✕</span> : <LuLoader size={18} className="text-indigo-600 animate-spin" />}
                  <span className={`text-sm font-medium ${singleProgress === "done" ? "text-emerald-700" : singleProgress === "error" ? "text-red-600" : "text-slate-700"}`}>
                    {singleStages.find((s) => s.key === singleProgress)?.label}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{singleProgressPercent[singleProgress]}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-500 ${singleProgress === "done" ? "bg-emerald-500" : singleProgress === "error" ? "bg-red-400" : "bg-indigo-600"}`} style={{ width: `${singleProgressPercent[singleProgress]}%` }} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-2xl">
          <form onSubmit={handleBulk} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template</label>
              <select value={bulkForm.templateId} onChange={(e) => setBulkForm({ ...bulkForm, templateId: e.target.value })} required className={inputClass}>
                <option value="">Select template</option>
                {templates.map((t) => <option key={t._id} value={t._id}>{t.templateName}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Upload CSV/XLSX</label>
                <a href="/sample-certificates.csv" download className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"><LuDownload size={12} /> Download sample CSV</a>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-indigo-300 transition-colors">
                <LuUpload className="mx-auto text-slate-400 mb-2" size={24} />
                <input type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files[0])} className="text-sm text-slate-600" />
                <p className="text-xs text-slate-400 mt-2">Columns: participantName, email, eventName, eventDate, venue</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Event Name (override)</label><input type="text" value={bulkForm.eventName} onChange={(e) => setBulkForm({ ...bulkForm, eventName: e.target.value })} className={inputClass} placeholder="Optional" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Event Date (override)</label><input type="date" value={bulkForm.eventDate} onChange={(e) => setBulkForm({ ...bulkForm, eventDate: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Venue (override)</label><input type="text" value={bulkForm.venue} onChange={(e) => setBulkForm({ ...bulkForm, venue: e.target.value })} className={inputClass} placeholder="Optional" /></div>
            </div>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? "Starting..." : "Start Bulk Generation"}
            </button>
          </form>

          {job && (
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {job.status === "completed" ? <LuCircleCheck size={18} className="text-emerald-600" /> : <LuLoader size={18} className="text-indigo-600 animate-spin" />}
                  <span className={`text-sm font-medium ${job.status === "completed" ? "text-emerald-700" : "text-slate-700"}`}>
                    {job.status === "completed" ? "All certificates generated!" : job.status === "completed_with_errors" ? "Completed with errors" : "Generating certificates..."}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-600">{job.processed || 0} / {job.total || job.totalParticipants}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all duration-300 ${job.status === "completed" ? "bg-emerald-500" : job.status === "completed_with_errors" ? "bg-amber-500" : "bg-indigo-600"}`}
                  style={{ width: `${(job.total || job.totalParticipants) ? ((job.processed || 0) / (job.total || job.totalParticipants)) * 100 : 0}%` }} />
              </div>
              {job.failed > 0 && <p className="text-xs text-red-500 mt-2">{job.failed} failed</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
