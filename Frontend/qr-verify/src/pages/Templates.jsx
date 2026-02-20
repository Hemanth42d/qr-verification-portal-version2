import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { LuPlus, LuTrash2, LuX, LuEye, LuPencil } from "react-icons/lu";

function TemplatePreview({ imageUrl, form }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (!imageUrl) { setImgLoaded(false); return; }
    const img = new Image();
    img.onload = () => { imgRef.current = img; setImgLoaded(true); };
    img.src = imageUrl;
    return () => { img.onload = null; };
  }, [imageUrl]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    const containerWidth = canvas.parentElement?.clientWidth || 600;
    const scale = Math.min(containerWidth / img.width, 1);
    const w = img.width * scale, h = img.height * scale;
    canvas.width = w; canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const nameX = Number(form.nameX) * scale, nameY = Number(form.nameY) * scale;
    const fontSize = Math.max(8, Number(form.fontSize) * scale);
    ctx.font = `bold ${fontSize}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = form.fontColor || "#000000";
    ctx.textBaseline = "top";
    ctx.fillText("Sample Name", nameX, nameY);
    const qrX = Number(form.qrX) * scale, qrY = Number(form.qrY) * scale;
    const qrSize = Math.max(10, Number(form.qrSize) * scale);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 2; ctx.strokeRect(qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = "#6366f1";
    const cellSize = qrSize / 7;
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if ((r + c) % 2 === 0) ctx.fillRect(qrX + c * cellSize, qrY + r * cellSize, cellSize, cellSize);
    ctx.font = `${11 * scale}px Arial, sans-serif`; ctx.fillStyle = "#6366f1";
    ctx.fillText("↑ Name", nameX, nameY + fontSize + 4 * scale);
    ctx.fillText("↑ QR Code", qrX, qrY + qrSize + 4 * scale);
  }, [imgLoaded, form]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => { const h = () => draw(); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, [draw]);

  if (!imageUrl) return <div className="border-2 border-dashed border-slate-200 rounded-xl h-64 flex items-center justify-center text-slate-400 text-sm">Upload an image to see preview</div>;
  return <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100"><canvas ref={canvasRef} className="w-full block" /></div>;
}

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ templateName: "", nameX: 300, nameY: 250, fontSize: 36, fontColor: "#000000", qrX: 50, qrY: 450, qrSize: 100 });
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const fetchTemplates = async () => {
    try { const { data } = await api.get("/templates"); setTemplates(data.templates); } catch { toast.error("Failed to load templates"); } finally { setLoading(false); }
  };
  useEffect(() => { fetchTemplates(); }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0]; setFile(f);
    if (f) { if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(URL.createObjectURL(f)); } else { setImageUrl(null); }
  };
  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a template image");
    setSubmitting(true);
    const fd = new FormData();
    fd.append("templateName", form.templateName);
    fd.append("templateImage", file);
    fd.append("namePosition", JSON.stringify({ x: Number(form.nameX), y: Number(form.nameY), fontSize: Number(form.fontSize), fontFamily: "Helvetica", color: form.fontColor }));
    fd.append("qrPosition", JSON.stringify({ x: Number(form.qrX), y: Number(form.qrY), size: Number(form.qrSize) }));
    try {
      await api.post("/templates", fd);
      toast.success("Template created");
      setShowCreate(false); setForm({ templateName: "", nameX: 300, nameY: 250, fontSize: 36, fontColor: "#000000", qrX: 50, qrY: 450, qrSize: 100 });
      setFile(null); setImageUrl(null); fetchTemplates();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create template"); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this template?")) return;
    try { await api.delete(`/templates/${id}`); toast.success("Template deleted"); setTemplates((t) => t.filter((x) => x._id !== id)); } catch { toast.error("Failed to delete template"); }
  };

  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-slate-800">Templates</h1><p className="text-slate-500 text-sm mt-1">Manage your certificate templates</p></div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          {showCreate ? <><LuX size={16} /> Cancel</> : <><LuPlus size={16} /> New Template</>}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label><input type="text" value={form.templateName} onChange={(e) => updateForm("templateName", e.target.value)} required className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Template Image (PNG/JPG)</label><input type="file" accept="image/png,image/jpeg" onChange={handleFileChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm file:font-medium" /></div>
              <fieldset className="border border-slate-200 rounded-lg p-4"><legend className="text-sm font-semibold text-slate-700 px-2">Name Position</legend>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div><label className="block text-xs text-slate-500 mb-1">X</label><input type="number" value={form.nameX} onChange={(e) => updateForm("nameX", e.target.value)} className={inputClass} /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Y</label><input type="number" value={form.nameY} onChange={(e) => updateForm("nameY", e.target.value)} className={inputClass} /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Font Size</label><input type="number" value={form.fontSize} onChange={(e) => updateForm("fontSize", e.target.value)} className={inputClass} /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Color</label><input type="color" value={form.fontColor} onChange={(e) => updateForm("fontColor", e.target.value)} className="w-full h-[38px] border border-slate-200 rounded-lg cursor-pointer" /></div>
                </div>
              </fieldset>
              <fieldset className="border border-slate-200 rounded-lg p-4"><legend className="text-sm font-semibold text-slate-700 px-2">QR Code Position</legend>
                <div className="grid grid-cols-3 gap-3 mt-1">
                  <div><label className="block text-xs text-slate-500 mb-1">X</label><input type="number" value={form.qrX} onChange={(e) => updateForm("qrX", e.target.value)} className={inputClass} /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Y</label><input type="number" value={form.qrY} onChange={(e) => updateForm("qrY", e.target.value)} className={inputClass} /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Size</label><input type="number" value={form.qrSize} onChange={(e) => updateForm("qrSize", e.target.value)} className={inputClass} /></div>
                </div>
              </fieldset>
              <button type="submit" disabled={submitting} className="w-full px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">{submitting ? "Creating..." : "Create Template"}</button>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3"><LuEye size={16} className="text-slate-500" /><span className="text-sm font-medium text-slate-700">Live Preview</span></div>
              <TemplatePreview imageUrl={imageUrl} form={form} />
              {imageUrl && <p className="text-xs text-slate-400 mt-2 text-center">Adjust values on the left — preview updates in real time</p>}
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
      ) : templates.length === 0 && !showCreate ? (
        <div className="text-center py-12 text-slate-500">No templates yet. Create your first one.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t._id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div><h3 className="font-semibold text-slate-800">{t.templateName}</h3><p className="text-xs text-slate-500 mt-1">Name: ({t.namePosition?.x}, {t.namePosition?.y}) · QR: ({t.qrPosition?.x}, {t.qrPosition?.y})</p></div>
                <div className="flex gap-1">
                  <button onClick={() => navigate(`/dashboard/templates/edit/${t._id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" aria-label="Edit template"><LuPencil size={16} /></button>
                  <button onClick={() => handleDelete(t._id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" aria-label="Delete template"><LuTrash2 size={16} /></button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">{new Date(t.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
