import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { LuEye, LuX, LuUpload, LuArrowLeft } from "react-icons/lu";

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
    const w = img.width * scale;
    const h = img.height * scale;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const nameX = Number(form.nameX) * scale;
    const nameY = Number(form.nameY) * scale;
    const fontSize = Math.max(8, Number(form.fontSize) * scale);
    ctx.font = `bold ${fontSize}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = form.fontColor || "#000000";
    ctx.textBaseline = "top";
    ctx.fillText("Sample Name", nameX, nameY);

    const qrX = Number(form.qrX) * scale;
    const qrY = Number(form.qrY) * scale;
    const qrSize = Math.max(10, Number(form.qrSize) * scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = "#6366f1";
    const cellSize = qrSize / 7;
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++)
        if ((r + c) % 2 === 0) ctx.fillRect(qrX + c * cellSize, qrY + r * cellSize, cellSize, cellSize);

    ctx.font = `${11 * scale}px Arial, sans-serif`;
    ctx.fillStyle = "#6366f1";
    ctx.fillText("↑ Name", nameX, nameY + fontSize + 4 * scale);
    ctx.fillText("↑ QR Code", qrX, qrY + qrSize + 4 * scale);
  }, [imgLoaded, form]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => { const h = () => draw(); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, [draw]);

  if (!imageUrl) return <div className="border-2 border-dashed border-slate-200 rounded-xl h-64 flex items-center justify-center text-slate-400 text-sm">Upload an image to see preview</div>;
  return <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100"><canvas ref={canvasRef} className="w-full block" /></div>;
}

export default function TemplateEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ templateName: "", nameX: 300, nameY: 250, fontSize: 36, fontColor: "#000000", qrX: 50, qrY: 450, qrSize: 100 });
  const [serverImageUrl, setServerImageUrl] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [newFileUrl, setNewFileUrl] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const { data } = await api.get(`/templates/${id}`);
        const t = data.template;
        setForm({
          templateName: t.templateName,
          nameX: t.namePosition?.x ?? 300, nameY: t.namePosition?.y ?? 250,
          fontSize: t.namePosition?.fontSize ?? 36, fontColor: t.namePosition?.color || "#000000",
          qrX: t.qrPosition?.x ?? 50, qrY: t.qrPosition?.y ?? 450, qrSize: t.qrPosition?.size ?? 100,
        });
        // Fetch image with auth token and create blob URL
        try {
          const imgRes = await api.get(`/templates/${id}/image`, { responseType: "blob" });
          setServerImageUrl(URL.createObjectURL(imgRes.data));
        } catch {
          console.warn("Could not load template image");
        }
      } catch {
        toast.error("Failed to load template");
        navigate("/dashboard/templates");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [id, navigate]);

  const currentImageUrl = newFileUrl || (imageRemoved ? null : serverImageUrl);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setNewFile(f);
      if (newFileUrl) URL.revokeObjectURL(newFileUrl);
      setNewFileUrl(URL.createObjectURL(f));
      setImageRemoved(false);
    }
  };

  const handleRemoveImage = () => {
    setNewFile(null);
    if (newFileUrl) URL.revokeObjectURL(newFileUrl);
    setNewFileUrl(null);
    setImageRemoved(true);
  };

  const handleRestoreOriginal = () => {
    setNewFile(null);
    if (newFileUrl) URL.revokeObjectURL(newFileUrl);
    setNewFileUrl(null);
    setImageRemoved(false);
  };

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imageRemoved && !newFile) return toast.error("Please upload a new image or restore the original");
    setSubmitting(true);
    const fd = new FormData();
    fd.append("templateName", form.templateName);
    fd.append("namePosition", JSON.stringify({ x: Number(form.nameX), y: Number(form.nameY), fontSize: Number(form.fontSize), fontFamily: "Helvetica", color: form.fontColor }));
    fd.append("qrPosition", JSON.stringify({ x: Number(form.qrX), y: Number(form.qrY), size: Number(form.qrSize) }));
    if (newFile) fd.append("templateImage", newFile);
    try {
      await api.put(`/templates/${id}`, fd);
      toast.success("Template updated");
      navigate("/dashboard/templates");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update template");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      <button onClick={() => navigate("/dashboard/templates")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <LuArrowLeft size={16} /> Back to Templates
      </button>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Edit Template</h1>
      <p className="text-slate-500 text-sm mb-6">Update positions, image, or settings</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
              <input type="text" value={form.templateName} onChange={(e) => updateForm("templateName", e.target.value)} required className={inputClass} />
            </div>

            {/* Image management */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Template Image</label>
              {!imageRemoved && !newFile && serverImageUrl && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg mb-2">
                  <img src={serverImageUrl} alt="Current" className="w-16 h-12 object-cover rounded border border-slate-200" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">Current image loaded</p>
                    <p className="text-xs text-slate-400">Upload a new one to replace, or remove it</p>
                  </div>
                  <button type="button" onClick={handleRemoveImage} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" aria-label="Remove image">
                    <LuX size={18} />
                  </button>
                </div>
              )}
              {newFile && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg mb-2">
                  <img src={newFileUrl} alt="New" className="w-16 h-12 object-cover rounded border border-indigo-200" />
                  <div className="flex-1">
                    <p className="text-sm text-indigo-700">{newFile.name}</p>
                    <p className="text-xs text-indigo-400">New image selected</p>
                  </div>
                  <button type="button" onClick={handleRestoreOriginal} className="p-1.5 text-indigo-400 hover:text-red-500 transition-colors" aria-label="Remove new image">
                    <LuX size={18} />
                  </button>
                </div>
              )}
              {imageRemoved && !newFile && (
                <div className="p-3 bg-amber-50 rounded-lg mb-2 flex items-center justify-between">
                  <p className="text-sm text-amber-700">Image removed — upload a new one or restore original</p>
                  <button type="button" onClick={handleRestoreOriginal} className="text-xs text-indigo-600 hover:underline">Restore</button>
                </div>
              )}
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors">
                <LuUpload className="mx-auto text-slate-400 mb-1" size={20} />
                <input type="file" accept="image/png,image/jpeg" onChange={handleFileChange} className="text-sm text-slate-600" />
              </div>
            </div>

            <fieldset className="border border-slate-200 rounded-lg p-4">
              <legend className="text-sm font-semibold text-slate-700 px-2">Name Position</legend>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div><label className="block text-xs text-slate-500 mb-1">X</label><input type="number" value={form.nameX} onChange={(e) => updateForm("nameX", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Y</label><input type="number" value={form.nameY} onChange={(e) => updateForm("nameY", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Font Size</label><input type="number" value={form.fontSize} onChange={(e) => updateForm("fontSize", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Color</label><input type="color" value={form.fontColor} onChange={(e) => updateForm("fontColor", e.target.value)} className="w-full h-[38px] border border-slate-200 rounded-lg cursor-pointer" /></div>
              </div>
            </fieldset>

            <fieldset className="border border-slate-200 rounded-lg p-4">
              <legend className="text-sm font-semibold text-slate-700 px-2">QR Code Position</legend>
              <div className="grid grid-cols-3 gap-3 mt-1">
                <div><label className="block text-xs text-slate-500 mb-1">X</label><input type="number" value={form.qrX} onChange={(e) => updateForm("qrX", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Y</label><input type="number" value={form.qrY} onChange={(e) => updateForm("qrY", e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Size</label><input type="number" value={form.qrSize} onChange={(e) => updateForm("qrSize", e.target.value)} className={inputClass} /></div>
              </div>
            </fieldset>

            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {submitting ? "Updating..." : "Update Template"}
              </button>
              <button type="button" onClick={() => navigate("/dashboard/templates")} className="px-6 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <LuEye size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Live Preview</span>
            </div>
            <TemplatePreview imageUrl={currentImageUrl} form={form} />
            {currentImageUrl && <p className="text-xs text-slate-400 mt-2 text-center">Adjust values on the left — preview updates in real time</p>}
          </div>
        </div>
      </form>
    </div>
  );
}
