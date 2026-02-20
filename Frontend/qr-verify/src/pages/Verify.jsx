import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { LuShieldCheck, LuShieldX, LuDownload, LuSearch } from "react-icons/lu";

export default function Verify() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const fetchCertificate = (id) => {
    setLoading(true);
    setSearched(true);
    setCertificate(null);
    setValid(false);
    api.get(`/certificates/verify/${id}`)
      .then((res) => { setValid(res.data.valid); setCertificate(res.data.certificate); })
      .catch(() => setValid(false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (certificateId) fetchCertificate(certificateId); }, [certificateId]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    navigate(`/verify/${trimmed}`);
  };

  const formatDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); } catch { return d; }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-gray-900">CertPortal</Link>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">← Home</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-start justify-center px-4 py-16">
        <div className="max-w-md w-full space-y-8">

          {/* Search */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Verify Certificate</h1>
            <p className="text-sm text-gray-500 mt-2">Enter a certificate ID or scan the QR code</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <LuSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Certificate ID..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {loading ? "..." : "Verify"}
            </button>
          </form>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
          )}

          {/* Verified */}
          {!loading && searched && valid && certificate && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-green-50 border-b border-green-200">
                <LuShieldCheck size={18} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">Certificate Verified</span>
              </div>

              <div className="px-5 py-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Participant</p>
                  <p className="text-base font-medium text-gray-900 mt-0.5">{certificate.participantName}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Event</p>
                  <p className="text-base font-medium text-gray-900 mt-0.5">{certificate.eventName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Date</p>
                    <p className="text-sm text-gray-900 mt-0.5">{formatDate(certificate.eventDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Venue</p>
                    <p className="text-sm text-gray-900 mt-0.5">{certificate.venue || "—"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Certificate ID</p>
                  <p className="text-sm font-mono text-gray-700 mt-0.5 break-all">{certificate.certificateId}</p>
                </div>

                <hr className="border-gray-100" />

                {certificate.driveLink ? (
                  <a
                    href={certificate.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <LuDownload size={16} /> Download Certificate
                  </a>
                ) : (
                  <p className="text-center text-sm text-gray-400 py-1">Download not available</p>
                )}
              </div>
            </div>
          )}

          {/* Not Found */}
          {!loading && searched && !valid && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-red-50 border-b border-red-200">
                <LuShieldX size={18} className="text-red-600" />
                <span className="text-sm font-medium text-red-800">Verification Failed</span>
              </div>
              <div className="px-5 py-5 text-center">
                <p className="text-sm text-gray-600">No certificate found with this ID.</p>
                <p className="text-xs text-gray-400 mt-2">Double-check the ID and try again.</p>
              </div>
            </div>
          )}

          {/* Back to Home */}
          <p className="text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">← Back to Home</Link>
          </p>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-5">
        <p className="text-center text-xs text-gray-400">
          Issued via Student Community Portal maintained by student community chapters.
        </p>
      </footer>
    </div>
  );
}
