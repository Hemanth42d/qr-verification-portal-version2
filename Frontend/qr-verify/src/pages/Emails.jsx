import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { LuMail, LuSend, LuRefreshCw, LuCircleCheck, LuTrash2, LuCloudUpload } from "react-icons/lu";

export default function Emails() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingBatch, setSendingBatch] = useState(null); // eventName of batch being sent
  const [reuploadingBatch, setReuploadingBatch] = useState(null);
  const [jobs, setJobs] = useState({}); // eventName -> job status

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/certificates/batches");
      setBatches(data.batches);
    } catch {
      toast.error("Failed to load certificate batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  const sendEmails = async (batch) => {
    const pending = batch.certificateIds;
    if (pending.length === 0) return toast("No certificates to send", { icon: "ℹ️" });

    setSendingBatch(batch.eventName);
    try {
      const { data } = await api.post("/emails/send-bulk", { certificateIds: pending });
      toast.success(`Sending ${data.totalEmails} emails for "${batch.eventName}"`);
      setJobs((prev) => ({ ...prev, [batch.eventName]: { jobId: data.jobId, ...data } }));
      pollJob(batch.eventName, data.jobId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send emails");
    } finally {
      setSendingBatch(null);
    }
  };

  const pollJob = (eventName, jobId) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/emails/job/${jobId}`);
        setJobs((prev) => ({ ...prev, [eventName]: { jobId, ...data } }));
        if (data.status !== "processing") {
          clearInterval(interval);
          if (data.status === "completed") {
            toast.success(`All emails sent for "${eventName}"`);
          } else {
            toast("Completed with some errors", { icon: "⚠️" });
          }
          // Refresh batches to update counts
          fetchBatches();
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);
  };

  const deleteBatch = async (batch) => {
    if (!confirm(`Delete all ${batch.total} certificates for "${batch.eventName}"? This cannot be undone.`)) return;
    try {
      const { data } = await api.post("/certificates/delete-batch", {
        eventName: batch.eventName,
        eventDate: batch.eventDate,
        venue: batch.venue,
      });
      toast.success(`Deleted ${data.deletedCount} certificates`);
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete batch");
    }
  };

  const reuploadToDrive = async (batch) => {
    setReuploadingBatch(batch.eventName);
    try {
      const { data } = await api.post("/certificates/regenerate-drive-links", {
        eventName: batch.eventName,
        eventDate: batch.eventDate,
        venue: batch.venue,
      });
      if (data.updated > 0) {
        toast.success(`Re-uploaded ${data.updated} certificates to Drive`);
      } else {
        toast("All certificates already have Drive links", { icon: "ℹ️" });
      }
      if (data.errors?.length > 0) {
        toast.error(`${data.errors.length} failed — check console`);
        console.error("Re-upload errors:", data.errors);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Re-upload failed");
    } finally {
      setReuploadingBatch(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Email Sender</h1>
          <p className="text-slate-500 text-sm mt-1">Send certificates to participants by batch</p>
        </div>
        <button onClick={fetchBatches} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">
          <LuRefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16">
          <LuMail size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No certificate batches yet.</p>
          <p className="text-slate-400 text-sm mt-1">Generate certificates first, then come here to send emails.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => {
            const job = jobs[batch.eventName];
            const isProcessing = job?.status === "processing";
            const isSending = sendingBatch === batch.eventName;
            const allSent = batch.emailsPending === 0;

            return (
              <div key={`${batch.eventName}-${batch.eventDate}`} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">{batch.eventName}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
                      <span>Date: {batch.eventDate}</span>
                      <span>Venue: {batch.venue}</span>
                      <span>Total: {batch.total} certificates</span>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        <LuCircleCheck size={12} /> {batch.emailsSent} sent
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        <LuMail size={12} /> {batch.emailsPending} pending
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => reuploadToDrive(batch)}
                      disabled={reuploadingBatch === batch.eventName}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      title="Re-upload certificates to Google Drive"
                    >
                      <LuCloudUpload size={16} className={reuploadingBatch === batch.eventName ? "animate-pulse" : ""} />
                      {reuploadingBatch === batch.eventName ? "Uploading..." : "Upload to Drive"}
                    </button>
                    {allSent ? (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg">
                        <LuCircleCheck size={16} /> All Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => sendEmails(batch)}
                        disabled={isSending || isProcessing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        <LuSend size={16} />
                        {isSending ? "Starting..." : isProcessing ? "Sending..." : `Send ${batch.emailsPending} Emails`}
                      </button>
                    )}
                    <button
                      onClick={() => deleteBatch(batch)}
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete batch"
                    >
                      <LuTrash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress bar when sending */}
                {isProcessing && job && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Sending emails...</span>
                      <span>{job.processed || 0} / {job.total} {job.failed > 0 && `· ${job.failed} failed`}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${job.total ? (job.processed / job.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
