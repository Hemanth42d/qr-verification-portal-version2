import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import TemplateEdit from "./pages/TemplateEdit";
import Generate from "./pages/Generate";
import Emails from "./pages/Emails";
import Register from "./pages/Register";
import Verify from "./pages/Verify";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:certificateId" element={<Verify />} />

          {/* Admin Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="templates" element={<Templates />} />
            <Route path="templates/edit/:id" element={<TemplateEdit />} />
            <Route path="generate" element={<Generate />} />
            <Route path="emails" element={<Emails />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: "14px" } }} />
    </AuthProvider>
  );
}
