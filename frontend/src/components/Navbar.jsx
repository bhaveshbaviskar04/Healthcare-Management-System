import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User, Tv, Stethoscope, ClipboardList, Pill, BedDouble, BarChart3 } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (location.pathname === '/display' || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const roleBadgeColor = {
    RECEPTIONIST: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    DOCTOR: 'bg-blue-100 text-blue-800 border-blue-300',
    PHARMACIST: 'bg-purple-100 text-purple-800 border-purple-300',
    PATIENT: 'bg-amber-100 text-amber-800 border-amber-300',
  }[user?.role] || 'bg-slate-100 text-slate-800 border-slate-300';

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-blue-600 font-extrabold text-xl tracking-tight">
              <Activity className="w-7 h-7" />
              <span>CLINICIFY</span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-1">
                {(user.role === 'RECEPTIONIST') && (
                  <Link
                    to="/reception"
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
                      location.pathname === '/reception' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" /> OPD Queue & Desk
                  </Link>
                )}

                {(user.role === 'DOCTOR' || user.role === 'NURSE') && (
                  <Link
                    to="/doctor"
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
                      location.pathname === '/doctor' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" /> Doctor Cabin
                  </Link>
                )}

                {(user.role === 'PHARMACIST') && (
                  <Link
                    to="/pharmacy"
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
                      location.pathname === '/pharmacy' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Pill className="w-4 h-4" /> Pharmacy & Stock
                  </Link>
                )}

                {(user.role === 'RECEPTIONIST' || user.role === 'DOCTOR') && (
                  <Link
                    to="/beds"
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
                      location.pathname === '/beds' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BedDouble className="w-4 h-4" /> Inpatient & Beds
                  </Link>
                )}

                {(user.role === 'RECEPTIONIST') && (
                  <Link
                    to="/analytics"
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
                      location.pathname === '/analytics' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" /> Analytics
                  </Link>
                )}

                {(user.role === 'PATIENT') && (
                  <Link
                    to="/patient"
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
                      location.pathname === '/patient' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-amber-600" /> My Health Portal
                  </Link>
                )}

                <Link
                  to="/display"
                  target="_blank"
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-100 flex items-center gap-1.5 transition"
                >
                  <Tv className="w-4 h-4 text-emerald-600" /> Waiting TV
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {user.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{user.fullName}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleBadgeColor}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

