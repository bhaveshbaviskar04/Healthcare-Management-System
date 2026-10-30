import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { BellRing, Clock, Activity, ShieldAlert } from 'lucide-react';

export default function QueuePublicDisplay() {
  const [calledToken, setCalledToken] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [delayInfo, setDelayInfo] = useState({ hasDelay: false, delayMinutes: 0, reason: '' });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [queueRes, delayRes] = await Promise.all([
          api.get('/queue/today'),
          api.get('/queue/active-delay')
        ]);
        const called = queueRes.data.find(
          (t) => t.queueStatus === 'CALLED' || t.queueStatus === 'IN_CONSULTATION'
        );
        const waiting = queueRes.data.filter((t) => t.queueStatus === 'WAITING').slice(0, 6);
        setCalledToken(called);
        setUpcoming(waiting);
        setDelayInfo(delayRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col justify-between selection:bg-blue-600">
      {/* Header */}
      <header className="border-b border-slate-800 pb-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">CLINICIFY • OPD LIVE QUEUE</h1>
            <p className="text-xs text-slate-400">Outpatient Department Token Announcement Board</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-5 py-2.5 rounded-2xl font-mono text-2xl font-bold text-blue-400 shadow-inner">
          <Clock className="w-6 h-6 text-blue-500" />
          {time}
        </div>
      </header>

      {/* Doctor Delay Banner */}
      {delayInfo.hasDelay && (
        <div className="bg-amber-500/20 border-2 border-amber-500/60 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
          <ShieldAlert className="w-8 h-8 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-lg font-black text-amber-300 uppercase tracking-wide">
              ⚠ Doctor Delay — {delayInfo.delayMinutes} Minutes
            </p>
            <p className="text-sm text-amber-200/80">{delayInfo.reason || 'Wait times have been adjusted. We apologize for the inconvenience.'}</p>
          </div>
        </div>
      )}

      {/* Main Display Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-auto py-6">
        {/* Current Called Token Callout */}
        <div className="bg-gradient-to-br from-blue-950/80 via-slate-900 to-slate-900 border-2 border-blue-500/50 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

          <div className="flex items-center gap-2.5 text-amber-400 font-extrabold text-lg uppercase tracking-widest mb-3">
            <BellRing className="w-6 h-6 animate-bounce" /> Now Calling into Cabin
          </div>

          {calledToken ? (
            <div className="space-y-2">
              <span className="text-9xl font-black text-white tracking-tighter font-mono drop-shadow-lg block">
                #{calledToken.tokenNumber}
              </span>
              <p className="text-3xl text-blue-200 font-bold">{calledToken.visit?.patient?.fullName}</p>
              <p className="text-sm text-slate-400">Please proceed to Doctor Examination Cabin (Room 102)</p>
            </div>
          ) : (
            <div className="py-12">
              <span className="text-4xl text-slate-500 font-light block">Doctor Cabin In Session</span>
              <p className="text-xs text-slate-600 mt-2">Next token announcement shortly...</p>
            </div>
          )}
        </div>

        {/* Next 6 Upcoming Tokens */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-300 uppercase tracking-wider mb-5 flex items-center justify-between">
              <span>Upcoming in Line</span>
              <span className="text-xs font-mono text-slate-500 font-normal">Next 6 Patients</span>
            </h2>

            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-slate-500 text-center py-12">No waiting patients in queue.</p>
              ) : (
                upcoming.map((item, idx) => (
                  <div
                    key={item.tokenId}
                    className="flex justify-between items-center bg-slate-900/90 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-blue-400 font-mono">#{item.tokenNumber}</span>
                      <span className="text-base font-semibold text-slate-200">{item.visit?.patient?.fullName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.priorityFlag && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold px-2.5 py-0.5 rounded-full uppercase">
                          Priority
                        </span>
                      )}
                      <span className="text-xs px-3 py-1 bg-slate-800 text-emerald-400 rounded-xl font-mono font-bold">
                        ~{item.estimatedWaitingMinutes} mins
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="text-center text-slate-500 text-xs border-t border-slate-900 pt-4">
        Clinicify Smart OPD Queue System • Department of Computer Science & Engineering (Data Science), APSIT
      </footer>
    </div>
  );
}

