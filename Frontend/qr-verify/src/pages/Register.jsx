import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-slate-800">CertPortal</Link>
          <p className="text-slate-500 mt-2">Create a new admin account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="John Doe" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="admin@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} placeholder="••••••••" />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
            <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className={inputClass} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
          <span className="mx-2">·</span>
          <Link to="/" className="text-indigo-600 hover:underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
