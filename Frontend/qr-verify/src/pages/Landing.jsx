import { Link } from "react-router-dom";
import { LuShieldCheck, LuArrowRight } from "react-icons/lu";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">CertPortal</span>
          <Link to="/verify" className="text-sm text-blue-600 hover:text-blue-800">
            Verify Certificate
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center bg-white">
        <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 w-full">
          <p className="text-sm text-blue-600 font-medium mb-4">Student-Led Community Initiative</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Certificate Verification Portal
          </h1>
          <p className="mt-4 text-base text-gray-500 max-w-lg leading-relaxed">
            Verify and download your event certificates issued by student community chapters.
          </p>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Verify a Certificate <LuArrowRight size={16} />
          </Link>

          {/* Steps */}
          <div className="mt-16 border-t border-gray-100 pt-10">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-6">How it works</p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { n: "1", title: "Get your Certificate ID", desc: "Received via email after attending an event." },
                { n: "2", title: "Enter the ID", desc: "Search on the verification page." },
                { n: "3", title: "Download", desc: "View details and download the PDF." },
              ].map((s) => (
                <div key={s.n} className="flex gap-3">
                  <span className="text-sm font-bold text-blue-600 mt-0.5">{s.n}.</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            <span className="font-medium text-gray-700">Disclaimer:</span> This website is operated by a student-led community chapter. It is not affiliated with, endorsed by, or connected to any university, corporation, or organization. Certificates are for community events organized by student volunteers. The platform is provided "as is" without warranties. By using this portal, you acknowledge this is a student community initiative.
          </p>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Student Community Certificate Portal</p>
        </div>
      </footer>
    </div>
  );
}
