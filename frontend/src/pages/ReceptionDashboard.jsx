import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { UserPlus, Ticket, Search, AlertTriangle, Clock, RefreshCw, CheckCircle2, ChevronRight, User, ShieldAlert } from 'lucide-react';

export default function ReceptionDashboard() {
  const [queue, setQueue] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [priority, setPriority] = useState(false);
  const [priorityReason, setPriorityReason] = useState('');
  const [department, setDepartment] = useState('General Medicine');
  const [loading, setLoading] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  // New patient form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState('MALE');
  const [newBloodGroup, setNewBloodGroup] = useState('B+');
  // Delay awareness
  const [delayInfo, setDelayInfo] = useState({ hasDelay: false, delayMinutes: 0, reason: '' });

  useEffect(() => {
    loadData();
    const interval = setInterval(() => { loadQueue(); loadDelay(); }, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadQueue(), loadPatients(), loadDelay()]);
    setLoading(false);
  };

  const loadDelay = async () => {
    try {
      const res = await api.get('/queue/active-delay');
      setDelayInfo(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadQueue = async () => {
    try {
      const res = await api.get('/queue/today');
      setQueue(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
      if (res.data.length > 0 && !selectedPatient) {
        setSelectedPatient(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      loadPatients();
      return;
    }
    try {
      const res = await api.get(`/patients/search?query=${q}`);
      setPatients(res.data);
      if (res.data.length > 0) setSelectedPatient(res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIssueToken = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const res = await api.post('/queue/generate', {
        patientId: selectedPatient.patientId,
        department,
        priority,
        priorityReason: priority ? priorityReason : null
      });
      alert(`Token #${res.data.tokenNumber} successfully issued for ${selectedPatient.fullName}!`);
      setPriority(false);
      setPriorityReason('');
      loadQueue();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue token');
    }
  };

  const handleMakePriority = async (tokenId) => {
    const reason = prompt('Enter Clinical Urgency / Priority Reason (e.g. Chest pain, Severe trauma):', 'Severe Acute Distress');
    if (!reason) return;
    try {
      await api.put(`/queue/${tokenId}/priority`, { reason });
      loadQueue();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set priority');
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/patients', {
        fullName: newName,
        phone: newPhone,
        gender: newGender,
        bloodGroup: newBloodGroup
      });
      alert(`Patient ${res.data.fullName} registered successfully!`);
      setShowNewPatientModal(false);
      setNewName('');
      setNewPhone('');
      await loadPatients();
      setSelectedPatient(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register patient');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">OPD Reception & Token Generation</h1>
          <p className="text-xs text-slate-500">Coordinate patient check-in, token issuance, priority triage, and live queue status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewPatientModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <UserPlus className="w-4 h-4 text-blue-600" /> New Patient Registration
          </button>
          <button
            onClick={loadData}
            className="p-2 border rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Doctor Delay Warning Banner */}
      {delayInfo.hasDelay && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-amber-200 text-amber-800 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">
              ⚠ Doctor Delay Active — Wait times increased by {delayInfo.delayMinutes} minutes
            </p>
            <p className="text-xs text-amber-700">Reason: {delayInfo.reason || 'No reason provided'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Token Issuance Desk */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Ticket className="w-4 h-4 text-blue-600" /> Issue Today's OPD Token
          </h2>

          {/* Patient Quick Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search Patient</label>
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name or phone number..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-100 rounded-lg p-2 bg-slate-50">
              {patients.map((p) => (
                <div
                  key={p.patientId}
                  onClick={() => setSelectedPatient(p)}
                  className={`p-2 rounded-md text-xs cursor-pointer flex justify-between items-center transition ${
                    selectedPatient?.patientId === p.patientId
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{p.fullName}</span>
                  <span className={`text-[10px] ${selectedPatient?.patientId === p.patientId ? 'text-blue-200' : 'text-slate-400'}`}>
                    {p.phone}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selectedPatient && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-blue-900">Selected: {selectedPatient.fullName}</p>
              <p className="text-blue-700">Phone: {selectedPatient.phone} | Blood: {selectedPatient.bloodGroup || 'N/A'}</p>
            </div>
          )}

          <form onSubmit={handleIssueToken} className="space-y-4 pt-2 border-t">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="General Medicine">General Medicine (OPD)</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Cardiology">Cardiology</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={priority}
                  onChange={(e) => setPriority(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Emergency / Priority Case
                </span>
              </label>

              {priority && (
                <input
                  type="text"
                  placeholder="Reason for urgency (e.g. Elderly, High fever, Chest pain)..."
                  value={priorityReason}
                  onChange={(e) => setPriorityReason(e.target.value)}
                  required
                  className="w-full text-xs border border-amber-300 rounded p-1.5 focus:outline-none bg-amber-50"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedPatient}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Ticket className="w-4 h-4" /> Print & Issue Token
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Live OPD Queue Monitor */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Active Today's OPD Queue ({queue.length} tokens)
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Auto-refreshes every 6s</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y">
                <tr>
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Est. Wait</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      No active OPD tokens issued today. Issue a token to start the queue.
                    </td>
                  </tr>
                ) : (
                  queue.map((t) => (
                    <tr
                      key={t.tokenId}
                      className={t.priorityFlag ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50/80'}
                    >
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-sm text-slate-900 font-mono">#{t.tokenNumber}</span>
                        {t.priorityFlag && (
                          <span className="block text-[9px] font-bold text-amber-700 uppercase tracking-tight">
                            ⚡ Priority: {t.priorityReason || 'Urgent'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800">{t.visit?.patient?.fullName || 'Walk-in'}</p>
                        <p className="text-[10px] text-slate-400">{t.visit?.department}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            t.queueStatus === 'WAITING'
                              ? 'bg-amber-100 text-amber-800'
                              : t.queueStatus === 'CALLED'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : t.queueStatus === 'IN_CONSULTATION'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {t.queueStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {t.queueStatus === 'WAITING' ? (
                          <span className="flex items-center gap-1 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-blue-500" /> ~{t.estimatedWaitingMinutes} mins
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {t.queueStatus === 'WAITING' && !t.priorityFlag && (
                          <button
                            onClick={() => handleMakePriority(t.tokenId)}
                            className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded font-semibold transition"
                          >
                            Mark Priority
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Patient Registration Modal */}
      {showNewPatientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" /> Register New Patient
            </h3>
            <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Parag Kasodekar"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. 9822114455"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full border rounded p-2 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Blood Group</label>
                  <select
                    value={newBloodGroup}
                    onChange={(e) => setNewBloodGroup(e.target.value)}
                    className="w-full border rounded p-2 focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(false)}
                  className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

