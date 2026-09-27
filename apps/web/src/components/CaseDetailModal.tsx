'use client';

import React, { useEffect, useState } from 'react';
import { CaseDetail, CaseEvent } from '../../../../packages/shared/types';
import { Scale, ShieldAlert, CheckCircle2, Clock, X, ExternalLink, AlertTriangle } from 'lucide-react';

interface CaseDetailModalProps {
  casePublicId: string;
  onClose: () => void;
}

export default function CaseDetailModal({ casePublicId, onClose }: CaseDetailModalProps) {
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/cases/${casePublicId}`)
      .then((res) => res.json())
      .then((data) => {
        setCaseData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [casePublicId]);

  const getStatusBadge = (status: string, isGuilt: boolean) => {
    switch (status) {
      case 'convicted':
        return <span className="civic-badge bg-rose-100 text-rose-800 border border-rose-200">Court Conviction</span>;
      case 'acquitted':
        return <span className="civic-badge bg-emerald-100 text-emerald-800 border border-emerald-200">Court Acquittal</span>;
      case 'trial':
        return <span className="civic-badge bg-purple-100 text-purple-800 border border-purple-200">Judicial Trial</span>;
      case 'chargesheet':
        return <span className="civic-badge bg-indigo-100 text-indigo-800 border border-indigo-200">Chargesheet Filed</span>;
      case 'fir_registered':
        return <span className="civic-badge bg-amber-100 text-amber-800 border border-amber-200">FIR Registered</span>;
      case 'reported':
        return <span className="civic-badge bg-blue-100 text-blue-800 border border-blue-200">Public Report</span>;
      default:
        return <span className="civic-badge bg-civic-100 text-civic-700">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-civic-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-civic-200 bg-civic-50">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-bengal-primary" />
            <div>
              <span className="text-[11px] font-mono text-civic-500 font-semibold">{casePublicId}</span>
              <h3 className="text-sm font-bold text-civic-900">Procedural Legal Case Lifecycle</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-civic-400 hover:text-civic-700 hover:bg-civic-200 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-civic-500">Loading procedural history...</div>
          ) : caseData ? (
            <>
              {/* Presumption of Innocence Legal Notice Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <span className="font-semibold text-amber-800">Constitutional Presumption of Innocence</span>
                  <p className="text-[11px] leading-relaxed text-amber-900/90">{caseData.disclaimer}</p>
                </div>
              </div>

              {/* Case Summary Card */}
              <div className="bg-civic-50 p-3.5 rounded-lg border border-civic-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-civic-500 text-[11px]">Offense Category:</span>
                  <p className="font-semibold text-civic-900">{caseData.category_name}</p>
                </div>
                <div>
                  <span className="text-civic-500 text-[11px]">Current Documented Status:</span>
                  <div className="mt-0.5">{getStatusBadge(caseData.current_status, caseData.is_guilt_proven)}</div>
                </div>
              </div>

              {/* Append-Only Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-civic-500 mb-4">
                  Chronological Milestone Timeline (Append-Only)
                </h4>
                <div className="relative border-l-2 border-civic-200 ml-4 space-y-6">
                  {caseData.timeline.map((ev, idx) => (
                    <div key={ev.id || idx} className="relative pl-6">
                      {/* Timeline Dot */}
                      <span className="absolute -left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-bengal-primary shadow-sm"></span>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(ev.status, ev.is_guilt_finding)}
                          <span className="text-xs font-semibold text-civic-800">{ev.status_label}</span>
                        </div>
                        <span className="text-[11px] text-civic-500 font-mono">
                          {new Date(ev.effective_date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {ev.source_excerpt && (
                        <p className="mt-2 text-xs text-civic-600 bg-civic-50 p-2.5 rounded border border-civic-100">
                          {ev.source_excerpt}
                        </p>
                      )}

                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-civic-500">
                        <span>Source: {ev.source_name}</span>
                        {ev.source_url && (
                          <a
                            href={ev.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-bengal-primary hover:underline flex items-center space-x-1"
                          >
                            <span>Official Reference</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-xs text-civic-500">Case details not found</div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-civic-200 bg-civic-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-civic-200 hover:bg-civic-300 text-civic-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
