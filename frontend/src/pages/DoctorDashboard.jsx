import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { Stethoscope, UserCheck, Plus, Trash2, BedDouble, Send, Clock, AlertCircle, Timer, ShieldAlert, XCircle, Printer, Eye, FileText } from 'lucide-react';
import PrescriptionPrintModal from '../components/PrescriptionPrintModal';

export default function DoctorDashboard() {
  const [queue, setQueue] = useState([]);
  const [activeToken, setActiveToken] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [recommendAdmission, setRecommendAdmission] = useState(false);
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medicineName: 'Paracetamol (Dolo)', dosage: '650mg', frequency: '1-0-1', duration: '5 Days', quantity: 10, instructions: 'After food' }
  ]);
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedPrintRx, setSelectedPrintRx] = useState(null);
  const [lastPrescription, setLastPrescription] = useState(null);
  // Delay management state
  const [delayInfo, setDelayInfo] = useState({ hasDelay: false, delayMinutes: 0, reason: '' });
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState('');

  useEffect(() => {
    loadQueue();
    loadDelay();
    const interval = setInterval(() => { loadQueue(); loadDelay(); }, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadDelay = async () => {
    try {
      const res = await api.get('/queue/active-delay');
      setDelayInfo(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDelay = async (e) => {
    e.preventDefault();
    try {
      await api.post('/queue/delay', { delayMinutes, reason: delayReason || 'Doctor Consultation Delay' });
      setShowDelayModal(false);
      setDelayReason('');
      loadDelay();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set delay');
    }
  };

  const handleClearDelay = async () => {
    try {
      await api.post('/queue/delay/clear');
      loadDelay();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clear delay');
    }
  };

  const startTimeRef = useRef(null);
  const activeTokenIdRef = useRef(null);

  // Timer for active consultation (uses real timestamp difference so polling never resets it to 0)
  useEffect(() => {
    let timer;
    if (activeToken) {
      if (activeTokenIdRef.current !== activeToken.tokenId) {
        activeTokenIdRef.current = activeToken.tokenId;
        const serverStart = activeToken.consultationStartedAt ? new Date(activeToken.consultationStartedAt).getTime() : null;
        startTimeRef.current = serverStart || Date.now();
      }

      const updateElapsed = () => {
        if (startTimeRef.current) {
          const diff = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
          setElapsedSeconds(diff);
        }
      };

      updateElapsed();
      timer = setInterval(updateElapsed, 1000);
    } else {
      activeTokenIdRef.current = null;
      startTimeRef.current = null;
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [activeToken?.tokenId]);

  const loadQueue = async () => {
    try {
      const res = await api.get('/queue/today');
      setQueue(res.data);
      // Synchronize activeToken with queue without resetting reference on polling
      setActiveToken((prev) => {
        if (prev) {
          const stillActive = res.data.find(
            (t) => t.tokenId === prev.tokenId && (t.queueStatus === 'CALLED' || t.queueStatus === 'IN_CONSULTATION')
          );
          return stillActive || null;
        }
        return res.data.find((t) => t.queueStatus === 'CALLED' || t.queueStatus === 'IN_CONSULTATION') || null;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCallNext = async () => {
    setLoading(true);
    try {
      const res = await api.post('/queue/call-next');
      setActiveToken(res.data);
      loadQueue();
    } catch (err) {
      alert(err.response?.data?.message || 'No patients currently waiting.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medicineName: '', dosage: '1 Tab', frequency: '1-0-1', duration: '5 Days', quantity: 10, instructions: '' }
    ]);
  };

  const removeItem = (idx) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    const updated = [...prescriptionItems];
    updated[idx][field] = value;
    setPrescriptionItems(updated);
  };

  const handlePreviewDraft = () => {
    if (!activeToken) return;
    const draftRx = {
      prescriptionId: 'DRAFT',
      patient: activeToken.visit?.patient || { fullName: 'Consulting Patient' },
      doctor: { fullName: 'Consulting Physician' },
      consultation: {
        symptoms,
        diagnosis,
        clinicalNotes,
        recommendedAdmission: recommendAdmission
      },
      items: prescriptionItems,
      prescriptionStatus: 'DRAFT_PREVIEW',
      createdAt: new Date().toISOString()
    };
    setSelectedPrintRx(draftRx);
  };

  const handleSubmitConsultation = async (e) => {
    e.preventDefault();
    if (!activeToken) return;

    try {
      const rxRes = await api.post('/clinical/prescriptions', {
        visitId: activeToken.visit.visitId,
        symptoms,
        diagnosis,
        clinicalNotes,
        recommendAdmission,
        items: prescriptionItems
      });

      // Complete token
      await api.put(`/queue/${activeToken.tokenId}/complete`);

      const savedRx = rxRes.data;
      setLastPrescription(savedRx);
      setSelectedPrintRx(savedRx);

      alert('Consultation saved! Digital Prescription routed to Pharmacy Dispensary.');
      setActiveToken(null);
      setDiagnosis('');
      setSymptoms('');
      setClinicalNotes('');
      setRecommendAdmission(false);
      setPrescriptionItems([{ medicineName: 'Paracetamol (Dolo)', dosage: '650mg', frequency: '1-0-1', duration: '5 Days', quantity: 10, instructions: 'After food' }]);
      loadQueue();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit consultation');
    }
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Clinician Consultation Cabin</h1>
            <p className="text-xs text-slate-500">Examine patients, generate digital prescriptions, and record inpatient admission orders.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastPrescription && (
            <button
              type="button"
              onClick={() => setSelectedPrintRx(lastPrescription)}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition"
              title="Print or export PDF for the last completed prescription"
            >
              <Printer className="w-4 h-4 text-purple-600" /> Print Last Rx (#{lastPrescription.prescriptionId})
            </button>
          )}
          {delayInfo.hasDelay ? (
            <button
              onClick={handleClearDelay}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition border border-amber-300"
            >
              <XCircle className="w-4 h-4" /> Clear Delay
            </button>
          ) : (
            <button
              onClick={() => setShowDelayModal(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition"
            >
              <Timer className="w-4 h-4 text-amber-600" /> Set Delay
            </button>
          )}
          <button
            onClick={handleCallNext}
            disabled={loading || activeToken !== null}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <UserCheck className="w-4 h-4" /> Call Next Eligible Patient
          </button>
        </div>
      </div>

      {/* Active Delay Banner */}
      {delayInfo.hasDelay && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-200 text-amber-800 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Delay Active — {delayInfo.delayMinutes} minutes added to all wait times
              </p>
              <p className="text-xs text-amber-700">{delayInfo.reason || 'No reason provided'}</p>
            </div>
          </div>
          <button
            onClick={handleClearDelay}
            className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1.5 rounded-lg font-semibold transition"
          >
            Clear Delay
          </button>
        </div>
      )}

      {/* Set Delay Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Timer className="w-5 h-5 text-amber-600" /> Set Doctor Delay
            </h3>
            <form onSubmit={handleSetDelay} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Delay Duration (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  required
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 15)}
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency OT Case, Lunch Break"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowDelayModal(false)}
                  className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-white font-semibold rounded hover:bg-amber-600 transition"
                >
                  Apply Delay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting List Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Queue Order ({queue.length})</h2>
            <span className="text-[10px] text-slate-400 font-mono">Prioritized</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {queue.map((t) => (
              <div
                key={t.tokenId}
                className={`p-3 rounded-xl border transition ${
                  activeToken?.tokenId === t.tokenId
                    ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-100'
                    : t.priorityFlag
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 font-mono">#{t.tokenNumber}</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{t.visit?.patient?.fullName}</p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      t.queueStatus === 'WAITING'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {t.queueStatus}
                  </span>
                </div>
                {t.priorityFlag && (
                  <span className="inline-block mt-1.5 text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded">
                    ⚡ Priority: {t.priorityReason || 'Urgent'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center / Right: Active Consultation & Prescription Writer */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          {activeToken ? (
            <form onSubmit={handleSubmitConsultation} className="space-y-4">
              {/* Active Patient Card */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
                <div>
                  <span className="text-xs uppercase tracking-widest text-blue-300 font-bold">In Active Consultation</span>
                  <h3 className="text-xl font-black mt-0.5">{activeToken.visit?.patient?.fullName}</h3>
                  <p className="text-xs text-blue-200">
                    Token #{activeToken.tokenNumber} • Phone: {activeToken.visit?.patient?.phone} • Blood: {activeToken.visit?.patient?.bloodGroup || 'N/A'}
                  </p>
                </div>
                <div className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg text-right">
                  <span className="text-[10px] text-blue-200 font-medium block">Consultation Time</span>
                  <span className="text-lg font-mono font-bold text-white flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-400" /> {formatTimer(elapsedSeconds)}
                  </span>
                </div>
              </div>

              {/* Symptoms & Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chief Symptoms & Complaints</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. High fever, dry cough, sore throat"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Diagnosis</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute upper respiratory tract infection"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes & Advice</label>
                <textarea
                  rows="2"
                  placeholder="Additional clinician findings, dietary recommendations, or follow-up schedule..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Digital Prescription Items Table */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Digital Prescription (Rx Items)
                  </span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Drug
                  </button>
                </div>

                <div className="space-y-2">
                  {prescriptionItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Medicine (e.g. Paracetamol 650mg)"
                          value={item.medicineName}
                          onChange={(e) => updateItem(idx, 'medicineName', e.target.value)}
                          className="w-full border rounded p-1.5 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Dosage"
                          value={item.dosage}
                          onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                          className="w-full border rounded p-1.5 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="1-0-1"
                          value={item.frequency}
                          onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                          className="w-full border rounded p-1.5 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full border rounded p-1.5 bg-white font-mono"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        {prescriptionItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inpatient Hospital Admission Recommendation */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-950">
                  <input
                    type="checkbox"
                    checked={recommendAdmission}
                    onChange={(e) => setRecommendAdmission(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-indigo-700" /> Recommend Inpatient Hospital Admission
                  </span>
                </label>
                {recommendAdmission && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    Will create admission request for bed allocation
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={handlePreviewDraft}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-200"
                >
                  <Eye className="w-4 h-4 text-slate-600" /> Preview / Print Draft
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
                >
                  <Send className="w-4 h-4" /> Save Prescription & Complete Consultation
                </button>
              </div>
            </form>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-slate-400 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">Doctor Cabin Ready</p>
                <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                  Click "Call Next Eligible Patient" at the top to admit the highest priority waiting patient.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Prescription Modal */}
      {selectedPrintRx && (
        <PrescriptionPrintModal
          prescription={selectedPrintRx}
          onClose={() => setSelectedPrintRx(null)}
        />
      )}
    </div>
  );
}

