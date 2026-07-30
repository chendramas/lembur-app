import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SPLList from "./pages/spl/SPLList";
import SPLForm from "./pages/spl/SPLForm";
import SPLDetail from "./pages/spl/SPLDetail";
import Employees from "./pages/admin/Employees";
import Sections from "./pages/admin/Sections";
import HariLibur from "./pages/admin/HariLibur";
import AbsensiPage from "./pages/admin/Absensi";
import UsersPage from "./pages/admin/Users";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/spl" element={<SPLList />} />
            <Route path="/spl/new" element={<SPLForm />} />
            <Route path="/spl/:id" element={<SPLDetail />} />
            <Route path="/spl/:id/edit" element={<SPLForm />} />
            <Route path="/admin/employees" element={<Employees />} />
            <Route path="/admin/sections" element={<Sections />} />
            <Route path="/admin/hari-libur" element={<HariLibur />} />
            <Route path="/admin/absensi" element={<AbsensiPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
