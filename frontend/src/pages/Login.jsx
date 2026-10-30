import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, User, AlertCircle, ArrowRight, UserPlus } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('receptionist1');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.role === 'DOCTOR' || user.role === 'NURSE') navigate('/doctor');
      else if (user.role === 'PHARMACIST') navigate('/pharmacy');
      else if (user.role === 'RECEPTIONIST') navigate('/reception');
      else navigate('/patient');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const setDemo = (userRole, uname) => {
    setUsername(uname);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">CLINICIFY</h1>
          <p className="text-xs text-slate-500 mt-1">Smart Hospital & Predictive OPD Queue System</p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* New Patient Self-Registration Option */}
        <div className="mt-4">
          <Link
            to="/register"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-emerald-500/30 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs transition"
          >
            <UserPlus className="w-4 h-4 text-emerald-600" /> New Patient? Register & Create Account
          </Link>
        </div>

        {/* 1-Click Role Switcher for instant demonstration */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            Quick Demo Accounts (Password: Password@123)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setDemo('Receptionist', 'receptionist1')}
              className="p-2 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <span className="font-bold block text-slate-800">Receptionist</span>
              <span className="text-[10px] text-slate-400">receptionist1</span>
            </button>
            <button
              onClick={() => setDemo('Doctor', 'dr_sharma')}
              className="p-2 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <span className="font-bold block text-slate-800">Doctor (Cabin)</span>
              <span className="text-[10px] text-slate-400">dr_sharma</span>
            </button>
            <button
              onClick={() => setDemo('Pharmacist', 'pharmacist1')}
              className="p-2 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <span className="font-bold block text-slate-800">Pharmacist</span>
              <span className="text-[10px] text-slate-400">pharmacist1</span>
            </button>
            <button
              onClick={() => setDemo('Patient', 'patient_rahul')}
              className="p-2 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <span className="font-bold block text-slate-800">Patient</span>
              <span className="text-[10px] text-slate-400">patient_rahul</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

