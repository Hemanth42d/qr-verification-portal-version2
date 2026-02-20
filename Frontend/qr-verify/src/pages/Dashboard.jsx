import { useEffect, useState } from "react";
import api from "../api/axios";
import { LuAward, LuFileImage, LuMail } from "react-icons/lu";

export default function Dashboard() {
  const [stats, setStats] = useState({ certificates: 0, templates: 0, emailsSent: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [certRes, tmplRes] = await Promise.all([
          api.get("/certificates?limit=1"),
          api.get("/templates"),
        ]);
        setStats({
          certificates: certRes.data.total || 0,
          templates: certRes.data.templates?.length || tmplRes.data.templates?.length || 0,
          emailsSent: 0,
        });
      } catch {
        // Stats are non-critical
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Certificates Generated", value: stats.certificates, icon: LuAward, color: "bg-indigo-50 text-indigo-600" },
    { label: "Templates", value: stats.templates, icon: LuFileImage, color: "bg-emerald-50 text-emerald-600" },
    { label: "Emails Sent", value: stats.emailsSent, icon: LuMail, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-8">Overview of your certificate portal activity.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">{c.label}</span>
              <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center`}>
                <c.icon size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
