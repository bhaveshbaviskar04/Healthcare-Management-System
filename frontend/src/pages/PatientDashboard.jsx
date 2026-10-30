import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Ticket, Clock, CheckCircle2, Pill, Activity, AlertCircle, Calendar, Plus, User, Phone, Droplet, Printer } from 'lucide-react';
import PrescriptionPrintModal from '../components/PrescriptionPrintModal';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [patientProfile, setPatientProfile] = useState(null);
  const [myToken, setMyToken] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingDepartment, setBookingDepartment] = useState('General Medicine');
  const [isBooking, setIsBooking] = useState(false);
  const [selectedPrintRx, setSelectedPrintRx] = useState(null);

  useEffect(() => {
    loadPatientData();
    const interval = setInterval(loadPatientData, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadPatientData = async () => {
    try {
      // 1. Fetch patient profile
      let currentPatient = patientProfile;
      try {
        const meRes = await api.get('/patients/me');
        if (meRes.data) {
          currentPatient = meRes.data;
          setPatientProfile(meRes.data);
        }
      } catch (e) {
        // Fallback search by name if /patients/me not yet linked
        if (!currentPatient && user?.fullName) {
          const sRes = await api.get(`/patients/search?query=${encodeURIComponent(user.fullName)}`);
          if (sRes.data && sRes.data.length > 0) {
            currentPatient = sRes.data[0];
            setPatientProfile(sRes.data[0]);
          }
        }
      }

      // 2. Fetch today's queue to locate active token
      const qRes = await api.get('/queue/today');
      const found = qRes.data.find(
        (t) =>
          t.visit?.patient?.user?.userId === user?.userId ||
          t.visit?.patient?.fullName === user?.fullName ||
          (currentPatient && t.visit?.patient?.patientId === currentPatient.patientId)
      );
      setMyToken(found);

      // 3. Load prescriptions whenever patient ID is resolved
      const patientId = currentPatient?.patientId || found?.visit?.patient?.patientId;
      if (patientId) {
        const rxRes = await api.get(`/clinical/patient/${patientId}/prescriptions`);
        setPrescriptions(rxRes.data || []);
      }
    } catch (err) {
      console.error('Error loading patient portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookToken = async (e) => {
    e.preventDefault();
    if (!patientProfile?.patientId) {
      alert('Unable to identify patient profile. Please contact the reception desk.');
      return;
    }
    setIsBooking(true);
    try {
      const res = await api.post('/queue/generate', {
        patientId: patientProfile.patientId,
        department: bookingDepartment,
        priority: false
      });
      alert(`Token #${res.data.tokenNumber} successfully issued for ${bookingDepartment}!`);
      await loadPatientData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || 'Failed to issue token.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Patient Health Portal</h1>
            <p className="text-xs text-slate-500">Welcome, {user?.fullName || 'Patient'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {patientProfile && (
            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
              PID #{patientProfile.patientId}
            </span>
          )}
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
            Live Tracker
          </span>
        </div>
      </div>

      {/* Patient Vitals & Info Card */}
      {patientProfile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Gender</span>
              <span className="font-bold text-slate-800">{patientProfile.gender}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-rose-500" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blood Group</span>
              <span className="font-bold text-slate-800">{patientProfile.bloodGroup || '—'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Phone</span>
              <span className="font-bold text-slate-800">{patientProfile.phone || '—'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Emergency</span>
              <span className="font-bold text-slate-800">{patientProfile.emergencyContact || '—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Token Tracker Card */}
      {myToken ? (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase tracking-widest text-blue-200 font-bold">Your OPD Token</span>
              <span className="text-7xl font-black tracking-tight block mt-2 font-mono">
                #{myToken.tokenNumber}
              </span>
              <p className="text-sm text-blue-100 mt-1">Department: {myToken.visit?.department}</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                {myToken.queueStatus}
              </span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <p className="text-xs text-blue-200">Estimated Waiting Time</p>
                <p className="text-2xl font-black font-mono">
                  {myToken.queueStatus === 'WAITING' ? `~${myToken.estimatedWaitingMinutes} Mins` : 'Turn Ready'}
                </p>
              </div>
            </div>

            {myToken.queueStatus === 'CALLED' && (
              <div className="bg-amber-400 text-amber-950 font-bold text-xs px-4 py-2 rounded-xl animate-bounce">
                Please proceed inside Room 102 now!
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-600" />
                Book Today's Outpatient Consultation
              </h2>
              <p className="text-xs text-slate-500">
                You do not have an active token for today. Request your queue token online below.
              </p>
            </div>
          </div>

          <form onSubmit={handleBookToken} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Department
              </label>
              <select
                value={bookingDepartment}
                onChange={(e) => setBookingDepartment(e.target.value)}
                className="w-full border rounded-xl p-2.5 bg-white text-xs text-slate-800"
              >
                <option value="General Medicine">General Medicine</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="ENT">ENT</option>
                <option value="Dermatology">Dermatology</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isBooking || !patientProfile}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isBooking ? 'Issuing...' : 'Generate My Token'}
            </button>
          </form>
        </div>
      )}

      {/* Past Prescriptions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Pill className="w-4 h-4 text-purple-600" /> Prescriptions & Medication Advice ({prescriptions.length})
        </h2>

        {prescriptions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No prescriptions found on record.</p>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div key={rx.prescriptionId} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">
                    Rx #{rx.prescriptionId} • Dr. {rx.doctor?.fullName || 'Consultant'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {rx.prescriptionStatus}
                    </span>
                    <button
                      onClick={() => setSelectedPrintRx(rx)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-bold shadow-2xs transition"
                      title="Print or Download PDF"
                    >
                      <Printer className="w-3 h-3 text-blue-600" /> Print / PDF
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  {rx.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-700">
                      <span>{item.medicine?.name} ({item.dosage})</span>
                      <span className="font-mono text-slate-500">{item.frequency} for {item.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescription Print / PDF Modal */}
      {selectedPrintRx && (
        <PrescriptionPrintModal
          prescription={selectedPrintRx}
          onClose={() => setSelectedPrintRx(null)}
        />
      )}
    </div>
  );
}
