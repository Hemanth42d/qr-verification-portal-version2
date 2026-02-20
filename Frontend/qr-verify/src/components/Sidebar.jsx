import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LuLayoutDashboard, LuFileImage, LuAward, LuMail, LuLogOut, LuMenu, LuX } from "react-icons/lu";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
  { to: "/dashboard/templates", label: "Templates", icon: LuFileImage },
  { to: "/dashboard/generate", label: "Certificate Generation", icon: LuAward },
  { to: "/dashboard/emails", label: "Email Sender", icon: LuMail },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        aria-label="Toggle menu"
      >
        {open ? <LuX size={20} /> : <LuMenu size={20} />}
      </button>

      {/* Overlay */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/20 z-30" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-800">Certificate Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Student Community</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/dashboard"} className={linkClass} onClick={() => setOpen(false)}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LuLogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
