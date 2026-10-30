import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Printer,
  Download,
  X,
  Activity,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  Droplet,
  FileText,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

export default function PrescriptionPrintModal({ prescription, onClose }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!prescription) return null;

  const {
    prescriptionId,
    patient,
    doctor,
    consultation,
    items = [],
    prescriptionStatus,
    createdAt
  } = prescription;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-IN');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Prescription-RX-${prescriptionId}-${patient?.fullName?.replace(/\s+/g, '_') || 'Patient'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Error generating PDF file. You can also use the "Print" button to Save as PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Print-specific style overrides to print only the prescription */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-prescription, #printable-prescription * {
            visibility: visible;
          }
          #printable-prescription {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Action Header (Hidden in Print) */}
        <div className="no-print bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Digital Prescription Preview</h3>
              <p className="text-[11px] text-slate-500">Official medical slip • Ready for print or PDF download</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
              title="Download PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? 'Exporting PDF...' : 'Download PDF'}
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              title="Print via Browser"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="p-6 overflow-y-auto flex justify-center bg-slate-100">
          {/* Printable Prescription Slip (A4 Styled Paper) */}
          <div
            id="printable-prescription"
            ref={printRef}
            className="bg-white w-full max-w-[210mm] min-h-[260mm] p-8 sm:p-12 rounded-2xl shadow-md border border-slate-200 text-slate-800 flex flex-col justify-between"
          >
            {/* 1. Hospital Header */}
            <div>
              <div className="border-b-2 border-blue-600 pb-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm">
                      <Activity className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                        CLINICIFY MULTISPECIALTY HOSPITAL
                      </h1>
                      <p className="text-xs font-semibold text-blue-600 tracking-wider uppercase">
                        Center for Advanced Healthcare & Research
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        NABH Accredited • Reg No: MH-THN-MED-2026-8841 • Tel: +91 22 6988 5500
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                      Outpatient Slip
                    </span>
                    <span className="text-lg font-mono font-black text-blue-700 block">
                      RX-{prescriptionId || '0000'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 block">
                      {formattedDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Patient & Consultant Grid */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                {/* Patient Information */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Patient Details
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name:</span>
                    <span className="font-bold text-slate-900">{patient?.fullName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Patient ID:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      #{patient?.patientId || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gender / Blood:</span>
                    <span className="font-semibold text-slate-800">
                      {patient?.gender || '—'} • {patient?.bloodGroup || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact:</span>
                    <span className="font-mono text-slate-700">{patient?.phone || '—'}</span>
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Consulting Doctor
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Doctor:</span>
                    <span className="font-bold text-slate-900">Dr. {doctor?.fullName || 'Physician'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-semibold text-slate-800">General Outpatient (OPD)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Medical Reg:</span>
                    <span className="font-mono text-slate-700">MCI-2019-77491</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 uppercase">
                      {prescriptionStatus || 'ISSUED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Clinical Findings / Diagnosis */}
              {(consultation?.symptoms || consultation?.diagnosis || consultation?.clinicalNotes) && (
                <div className="py-3 border-b border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-start gap-4">
                    {consultation.symptoms && (
                      <div className="flex-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Presenting Symptoms
                        </span>
                        <p className="text-slate-800 font-medium mt-0.5">{consultation.symptoms}</p>
                      </div>
                    )}
                    {consultation.diagnosis && (
                      <div className="flex-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Clinical Diagnosis
                        </span>
                        <p className="text-blue-900 font-bold bg-blue-50/70 p-1.5 rounded-lg border border-blue-100 inline-block mt-0.5">
                          {consultation.diagnosis}
                        </p>
                      </div>
                    )}
                  </div>
                  {consultation.clinicalNotes && (
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Clinical Remarks
                      </span>
                      <p className="text-slate-600 italic text-[11px]">{consultation.clinicalNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Inpatient Admission Alert if recommended */}
              {consultation?.recommendedAdmission && (
                <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center gap-2 text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold">Inpatient Admission Recommended:</span> Doctor has advised immediate ward hospitalization. Please contact the Inpatient Desk.
                  </div>
                </div>
              )}

              {/* 4. Rx Medication Table */}
              <div className="py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-blue-700 font-serif leading-none">℞</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Prescribed Medication & Regimen
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">#</th>
                        <th className="py-2.5 px-3 font-bold">Drug Name & Strength</th>
                        <th className="py-2.5 px-3 font-bold">Dosage</th>
                        <th className="py-2.5 px-3 font-bold">Frequency</th>
                        <th className="py-2.5 px-3 font-bold">Duration</th>
                        <th className="py-2.5 px-3 font-bold text-center">Qty</th>
                        <th className="py-2.5 px-3 font-bold">Special Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-4 text-center text-slate-400">
                            No medications prescribed for this visit.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {item.medicine?.name || item.medicineName || 'Medicine'}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">
                              {item.dosage || '1 unit'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {item.frequency || '1-0-1'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{item.duration || '5 Days'}</td>
                            <td className="py-2.5 px-3 font-mono text-center font-bold text-slate-900">
                              {item.quantityPrescribed || item.quantity || 1}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                              {item.specialInstructions || item.instructions || 'After food'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 5. Doctor Signature & Verification Footer */}
            <div className="pt-8 border-t border-slate-200 mt-8 space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1 text-[11px] text-slate-500 max-w-sm">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" /> Digitally Authenticated EMR Record
                  </div>
                  <p>Valid for dispensary across all hospital pharmacy counters and registered chemists.</p>
                  <p className="text-[10px] text-slate-400">Emergency Casualty Ward available 24x7.</p>
                </div>

                <div className="text-center">
                  <div className="w-40 border-b border-dashed border-slate-400 pb-1 mb-1">
                    <span className="font-serif italic text-blue-900 font-bold text-sm block">
                      Dr. {doctor?.fullName || 'Physician'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">
                    Authorized Medical Signature
                  </span>
                  <span className="text-[9px] text-slate-400 block font-mono">
                    Stamp / Digital Key Verified
                  </span>
                </div>
              </div>

              {/* Bottom Copyright and Legal Bar */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center text-[9px] text-slate-400">
                <span>Clinicify Hospital Information Management System • v2.0</span>
                <span>Generated: {new Date().toISOString()} • Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

