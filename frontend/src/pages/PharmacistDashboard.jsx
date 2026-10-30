import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Pill, CheckCircle2, AlertTriangle, Package, RefreshCw, Clock, ArrowRight, Plus, Edit2, X, Printer } from 'lucide-react';
import PrescriptionPrintModal from '../components/PrescriptionPrintModal';

export default function PharmacistDashboard() {
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [printRx, setPrintRx] = useState(null);

  // Inventory Management State
  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [medForm, setMedForm] = useState({
    name: '',
    strengthForm: '500mg Tablet',
    stockQuantity: 100,
    reorderThreshold: 25,
    batchNumber: '',
    expiryDate: '2027-12-31',
    unitPrice: 10.00
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [rxRes, invRes, alertRes] = await Promise.all([
        api.get('/pharmacy/pending'),
        api.get('/pharmacy/inventory'),
        api.get('/pharmacy/alerts')
      ]);
      setPendingPrescriptions(rxRes.data);
      setInventory(invRes.data);
      setAlerts(alertRes.data);
      if (rxRes.data.length > 0 && !selectedRx) {
        setSelectedRx(rxRes.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispense = async (prescriptionId) => {
    setLoading(true);
    try {
      const res = await api.post(`/pharmacy/dispense/${prescriptionId}`);
      alert(`Prescription #${prescriptionId} dispensed! Medicine inventory automatically updated.`);
      setSelectedRx(null);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispense prescription');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMed(null);
    setMedForm({
      name: '',
      strengthForm: '500mg Tablet',
      stockQuantity: 100,
      reorderThreshold: 25,
      batchNumber: 'BT-' + Math.floor(1000 + Math.random() * 9000),
      expiryDate: '2027-12-31',
      unitPrice: 10.00
    });
    setShowMedModal(true);
  };

  const openEditModal = (med) => {
    setEditingMed(med);
    setMedForm({
      name: med.name || '',
      strengthForm: med.strengthForm || '',
      stockQuantity: med.stockQuantity ?? 0,
      reorderThreshold: med.reorderThreshold ?? 20,
      batchNumber: med.batchNumber || '',
      expiryDate: med.expiryDate || '',
      unitPrice: med.unitPrice ?? 0
    });
    setShowMedModal(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    try {
      if (editingMed) {
        await api.put(`/pharmacy/medicines/${editingMed.medicineId}`, medForm);
        alert(`Medicine '${medForm.name}' updated successfully!`);
      } else {
        await api.post('/pharmacy/medicines', medForm);
        alert(`Medicine '${medForm.name}' added to inventory!`);
      }
      setShowMedModal(false);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save medicine');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Pill className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Pharmacy Dispensary & Stock Control</h1>
            <p className="text-xs text-slate-500">Dispense digital prescriptions and monitor real-time drug inventory levels.</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2 border rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Low Stock Warning Banner if any */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Inventory Low-Stock Warning:</span> The following medicines are below their reorder threshold:
            <span className="font-semibold ml-1">
              {alerts.map((a) => `${a.name} (${a.stockQuantity} remaining)`).join(', ')}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Incoming Prescription Queue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pending Prescriptions ({pendingPrescriptions.length})
            </h2>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">Live</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {pendingPrescriptions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No prescriptions waiting to be dispensed.</p>
            ) : (
              pendingPrescriptions.map((rx) => (
                <div
                  key={rx.prescriptionId}
                  onClick={() => setSelectedRx(rx)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedRx?.prescriptionId === rx.prescriptionId
                      ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-100'
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-xs text-slate-900">Rx #{rx.prescriptionId}</span>
                      <p className="text-xs font-semibold text-purple-900 mt-0.5">{rx.patient?.fullName}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded uppercase">
                        Pending
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintRx(rx);
                        }}
                        title="Print or export prescription PDF"
                        className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-100/60 rounded transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                    <span>Prescribed by {rx.doctor?.fullName}</span>
                    <span>{rx.items?.length || 0} drugs</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Selected Prescription Details & Dispense Action */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b">
            Prescription Dispensing Review
          </h2>

          {selectedRx ? (
            <div className="space-y-4 text-xs">
              <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-purple-950">{selectedRx.patient?.fullName}</h3>
                    <p className="text-purple-700 mt-0.5">Doctor: {selectedRx.doctor?.fullName}</p>
                  </div>
                  <span className="font-mono text-purple-800 font-bold">Rx #{selectedRx.prescriptionId}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-2">Prescribed Medicines:</span>
                <div className="space-y-2">
                  {selectedRx.items?.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800">{item.medicine?.name}</p>
                        <p className="text-[10px] text-slate-500">{item.dosage} • {item.frequency} • {item.duration}</p>
                        {item.specialInstructions && (
                          <p className="text-[10px] text-indigo-600 italic mt-0.5">Note: {item.specialInstructions}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-slate-900">{item.quantityPrescribed} units</span>
                        <span className="block text-[10px] text-slate-400">In Stock: {item.medicine?.stockQuantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPrintRx(selectedRx)}
                  className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-purple-200 transition"
                >
                  <Printer className="w-4 h-4 text-purple-600" /> Print / PDF Slip
                </button>
                <button
                  onClick={() => handleDispense(selectedRx.prescriptionId)}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Dispense
                </button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
              <Pill className="w-8 h-8 mb-2 text-slate-300" />
              <p>Select a pending prescription from the left to review and dispense.</p>
            </div>
          )}
        </div>

        {/* Right: Master Medicine Inventory List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-purple-600" /> Pharmacy Inventory
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">{inventory.length} items</span>
              <button
                onClick={openAddModal}
                className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Drug
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto text-xs">
            {inventory.map((m) => (
              <div
                key={m.medicineId}
                className={`p-2.5 rounded-xl border flex justify-between items-center ${
                  m.stockQuantity <= m.reorderThreshold ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <p className="font-bold text-slate-800">{m.name}</p>
                  <p className="text-[10px] text-slate-400">{m.strengthForm} • Batch: {m.batchNumber || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm ${
                        m.stockQuantity <= m.reorderThreshold ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {m.stockQuantity}
                    </span>
                    <span className="block text-[9px] text-slate-400">Threshold: {m.reorderThreshold}</span>
                  </div>
                  <button
                    onClick={() => openEditModal(m)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                    title="Edit Medicine"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add / Edit Medicine Modal */}
      {showMedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-600" />
                {editingMed ? `Edit Medicine — ${editingMed.name}` : 'Add New Medicine to Stock'}
              </h3>
              <button
                onClick={() => setShowMedModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ibuprofen"
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Strength & Form *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 400mg Tablet"
                    value={medForm.strengthForm}
                    onChange={(e) => setMedForm({ ...medForm, strengthForm: e.target.value })}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={medForm.stockQuantity}
                    onChange={(e) => setMedForm({ ...medForm, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Reorder Alert Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={medForm.reorderThreshold}
                    onChange={(e) => setMedForm({ ...medForm, reorderThreshold: parseInt(e.target.value) || 20 })}
                    className="w-full border rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={medForm.unitPrice}
                    onChange={(e) => setMedForm({ ...medForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BT-908"
                    value={medForm.batchNumber}
                    onChange={(e) => setMedForm({ ...medForm, batchNumber: e.target.value })}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={medForm.expiryDate}
                    onChange={(e) => setMedForm({ ...medForm, expiryDate: e.target.value })}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowMedModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
                >
                  {editingMed ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Print / PDF Modal */}
      {printRx && (
        <PrescriptionPrintModal
          prescription={printRx}
          onClose={() => setPrintRx(null)}
        />
      )}
    </div>
  );
}

