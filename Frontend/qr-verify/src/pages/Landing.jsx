import { Link } from "react-router-dom";
import { LuShieldCheck, LuQrCode, LuCloud, LuLayers, LuMail, LuArrowRight } from "react-icons/lu";

const features = [
  { icon: LuShieldCheck, title: "Secure Certificate Generation", desc: "Generate tamper-proof certificates with unique identifiers and QR verification codes." },
  { icon: LuQrCode, title: "QR-Based Verification", desc: "Instant certificate verification through QR code scanning from any device." },
  { icon: LuCloud, title: "Cloud Storage", desc: "All certificates securely stored in Google Drive with organized folder structure." },
  { icon: LuLayers, title: "Bulk Certificate Processing", desc: "Generate hundreds of certificates at once with CSV/XLSX upload support." },
  { icon: LuMail, title: "Email Delivery", desc: "Send certificates directly to participants via professional email templates." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-800">CertPortal</span>
          <Link
            to="/login"
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-6">
          <LuShieldCheck size={16} />
          Trusted by Student Communities
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight max-w-4xl mx-auto">
          Student Community Certificate Portal
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A secure certificate generation and verification platform maintained and run by student community chapters.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Get Started <LuArrowRight size={18} />
          </Link>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-8 py-3 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Verify Certificate
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Platform Features</h2>
        <p className="text-slate-600 text-center mb-12 max-w-xl mx-auto">
          Everything you need to manage certificates for your student community events.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                <f.icon size={20} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <p className="text-center text-sm text-slate-500">
          Maintained and run by student community chapters
        </p>
      </footer>
    </div>
  );
}
