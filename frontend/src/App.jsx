import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ReceptionDashboard from './pages/ReceptionDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import BedManagementPage from './pages/BedManagementPage';
import PatientDashboard from './pages/PatientDashboard';
import QueuePublicDisplay from './pages/QueuePublicDisplay';
import AdminDashboard from './pages/AdminDashboard';
import RegisterPatient from './pages/RegisterPatient';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function RoleHomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'DOCTOR' || user.role === 'NURSE') return <Navigate to="/doctor" replace />;
  if (user.role === 'PHARMACIST') return <Navigate to="/pharmacy" replace />;
  if (user.role === 'RECEPTIONIST') return <Navigate to="/reception" replace />;
  return <Navigate to="/patient" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterPatient />} />
              <Route path="/" element={<RoleHomeRedirect />} />
              
              <Route
                path="/reception"
                element={
                  <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                    <ReceptionDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/doctor"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR', 'NURSE']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/pharmacy"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACIST']}>
                    <PharmacistDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/beds"
                element={
                  <ProtectedRoute allowedRoles={['RECEPTIONIST', 'DOCTOR']}>
                    <BedManagementPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/patient"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT', 'RECEPTIONIST']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Analytics Dashboard */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Public TV Display View (no auth required) */}
              <Route path="/display" element={<QueuePublicDisplay />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

