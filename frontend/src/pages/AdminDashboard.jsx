import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import {
  BarChart3, Users, CheckCircle2, Clock, BedDouble, AlertTriangle,
  Pill, Timer, RefreshCw, Activity, ShieldAlert, FileText
} from 'lucide-react';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/reports/daily-summary');
      setSummary(res.data);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading Analytics Dashboard...
      </div>
    );
  }

  const stats = [
    {
      label: 'Total OPD Tokens Today',
      value: summary.todayTotalTokens,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      accent: 'text-blue-900',
    },
    {
      label: 'Currently Waiting',
      value: summary.waitingCount,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      accent: 'text-amber-900',
    },
    {
      label: 'In Consultation',
      value: summary.inConsultationCount,
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      accent: 'text-indigo-900',
    },
    {
      label: 'Completed Consultations',
      value: summary.completedCount,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      accent: 'text-emerald-900',
    },
    {
      label: 'Avg Wait Time (mins)',
      value: summary.averageWaitTimeMinutes ?? '—',
      icon: <Timer className="w-5 h-5" />,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      accent: 'text-cyan-900',
    },
    {
      label: 'Bed Occupancy Rate',
      value: `${summary.bedOccupancyRate ?? 0}%`,
      icon: <BedDouble className="w-5 h-5" />,
      color: 'bg-violet-50 text-violet-600 border-violet-200',
      accent: 'text-violet-900',
    },
    {
      label: 'Low Stock Medicines',
      value: summary.lowStockCount,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: summary.lowStockCount > 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200',
      accent: summary.lowStockCount > 0 ? 'text-rose-900' : 'text-slate-900',
    },
    {
      label: 'Pending Prescriptions',
      value: summary.pendingRxCount,
      icon: <Pill className="w-5 h-5" />,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      accent: 'text-orange-900',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl flex items-center justify-center shadow-md">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Admin Analytics Dashboard</h1>
            <p className="text-xs text-slate-500">
              Real-time operational summary for today • Auto-refreshes every 10s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-mono">Last: {lastRefresh}</span>
          <button
            onClick={() => { setLoading(true); fetchSummary(); }}
            className="p-2 border rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Doctor Delay Banner */}
      {summary.doctorDelayMinutes > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-200 text-amber-800 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Doctor Delay Active — {summary.doctorDelayMinutes} minutes
              </p>
              <p className="text-xs text-amber-700">{summary.doctorDelayReason || 'No reason provided'}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-200 px-3 py-1 rounded-lg">
            +{summary.doctorDelayMinutes} min added to wait times
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border shadow-sm ${stat.color}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {stat.icon}
              <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className={`text-3xl font-black ${stat.accent} tracking-tight`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Bed Breakdown & Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-violet-600" /> Bed Breakdown
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Total Beds</span>
              <span className="font-bold text-slate-900">{summary.totalBeds}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-emerald-600">Available</span>
              <span className="font-bold text-emerald-800">{summary.availableBeds}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-rose-600">Occupied</span>
              <span className="font-bold text-rose-800">{summary.occupiedBeds}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-amber-600">Reserved</span>
              <span className="font-bold text-amber-800">{summary.reservedBeds}</span>
            </div>
          </div>
          {/* Occupancy Bar */}
          <div className="pt-2">
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.bedOccupancyRate ?? 0}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-right">{summary.bedOccupancyRate}% occupied</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Pill className="w-4 h-4 text-orange-600" /> Pharmacy Status
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Dispensed Rx Today</span>
              <span className="font-bold text-emerald-800">{summary.dispensedRxCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Pending Rx</span>
              <span className="font-bold text-amber-800">{summary.pendingRxCount}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Low Stock Alerts</span>
              <span className={`font-bold ${summary.lowStockCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {summary.lowStockCount > 0 ? `⚠ ${summary.lowStockCount}` : '✓ None'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Timer className="w-4 h-4 text-cyan-600" /> Queue Performance
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Total Tokens</span>
              <span className="font-bold text-slate-900">{summary.todayTotalTokens}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Throughput (Completed)</span>
              <span className="font-bold text-emerald-800">{summary.completedCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Avg Wait Time</span>
              <span className="font-bold text-blue-800">{summary.averageWaitTimeMinutes ?? '—'} min</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Doctor Delay</span>
              <span className={`font-bold ${summary.doctorDelayMinutes > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {summary.doctorDelayMinutes > 0 ? `+${summary.doctorDelayMinutes} min` : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audit Log */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" /> Recent Audit Trail (Last 12 Actions)
        </h3>
        {summary.recentAuditLogs && summary.recentAuditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y">
                <tr>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Entity</th>
                  <th className="py-2 px-3">User</th>
                  <th className="py-2 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recentAuditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 text-slate-500 font-mono whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : (log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : '—')}
                    </td>
                    <td className="py-2 px-3">
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {log.actionType || log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {log.entityType} {log.entityId && log.entityId !== 'GLOBAL' ? `#${log.entityId}` : (log.entityId === 'GLOBAL' ? '(Global)' : '')}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {log.performedBy?.username ? log.performedBy.username : (log.userId ? `User #${log.userId}` : 'System')}
                    </td>
                    <td className="py-2 px-3 text-slate-500 max-w-xs truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">No audit log entries recorded yet today.</p>
        )}
      </div>
    </div>
  );
}

