'use client';

import React, { useEffect, useState } from 'react';
import { SourceMetadata } from '../../../../packages/shared/types';
import { BookOpen, ShieldCheck, X, AlertCircle, Database, Lock } from 'lucide-react';

interface SourcesModalProps {
  onClose: () => void;
}

export default function SourcesModal({ onClose }: SourcesModalProps) {
  const [sources, setSources] = useState<SourceMetadata[]>([]);
  const [methodology, setMethodology] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'sources' | 'methodology'>('sources');

  useEffect(() => {
    fetch('/api/v1/sources')
      .then((res) => res.json())
      .then((data) => setSources(data))
      .catch(() => {});

    fetch('/api/v1/methodology')
      .then((res) => res.json())
      .then((data) => setMethodology(data))
      .catch(() => {});
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synthetic_demo':
        return <span className="civic-badge bg-blue-100 text-blue-800">Synthetic Demo Fixture</span>;
      case 'active_pilot':
        return <span className="civic-badge bg-emerald-100 text-emerald-800">Active Pilot Verified</span>;
      case 'unconfigured':
        return <span className="civic-badge bg-amber-100 text-amber-800">Not Yet Connected (Pending Legal Review)</span>;
      case 'disabled':
        return <span className="civic-badge bg-civic-100 text-civic-600">Disabled</span>;
      default:
        return <span className="civic-badge bg-civic-100 text-civic-700">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-civic-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-civic-200 bg-civic-50">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-bengal-primary" />
            <h3 className="text-sm font-bold text-civic-900">Sources Registry & Methodology</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-civic-400 hover:text-civic-700" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-civic-200 bg-civic-100/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('sources')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'sources'
                ? 'border-bengal-primary text-bengal-primary'
                : 'border-transparent text-civic-500 hover:text-civic-800'
            }`}
          >
            Source Registry ({sources.length})
          </button>
          <button
            onClick={() => setActiveTab('methodology')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'methodology'
                ? 'border-bengal-primary text-bengal-primary'
                : 'border-transparent text-civic-500 hover:text-civic-800'
            }`}
          >
            Methodology & Ethical Safeguards
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'sources' ? (
            <div className="space-y-4">
              <p className="text-xs text-civic-600">
                Transparent registry of all active and prospective data sources. To preserve integrity, prospective
                official feeds are explicitly labeled &quot;Not Yet Connected&quot; until legal terms, API permissions, and
                privacy redactions are certified.
              </p>

              <div className="space-y-3">
                {sources.map((src) => (
                  <div key={src.id} className="border border-civic-200 rounded-lg p-4 bg-civic-50/50 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-civic-900">{src.name}</h4>
                      {getStatusBadge(src.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-civic-600 pt-1 border-t border-civic-100">
                      <div>
                        <span className="font-semibold text-civic-700">Organization:</span> {src.organization}
                      </div>
                      <div>
                        <span className="font-semibold text-civic-700">Jurisdiction:</span> {src.coverage_jurisdiction}
                      </div>
                      <div>
                        <span className="font-semibold text-civic-700">License / Terms:</span> {src.license_terms}
                      </div>
                      <div>
                        <span className="font-semibold text-civic-700">Verification:</span> {src.verification_status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-xs text-civic-700 leading-relaxed">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 space-y-1.5">
                <span className="font-bold text-blue-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Descriptive Civic Tool Guarantee</span>
                </span>
                <p className="text-blue-800 text-[11px]">
                  Bengal Safety Map produces purely descriptive aggregate patterns. It strictly prohibits risk scores,
                  danger rankings, predictive crime forecasting, or traveler advice.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-civic-900 mb-1">Small-Cell Privacy Suppression (k-Anonymity)</h4>
                <p>
                  Any spatial grid cell or ward polygon containing fewer than <strong>5 documented records</strong> is
                  masked and displayed as <code className="bg-civic-100 px-1 py-0.5 rounded">&lt;5</code>. This
                  prevents bad actors from isolating sensitive individual complaints through subtraction or cross-referencing.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-civic-900 mb-1">Zero PII Policy & Coordinate Generalization</h4>
                <p>
                  Complainants, victims, and accused names are completely stripped at ingestion. High-risk offenses
                  (sexual violence, domestic abuse, POCSO) are strictly coordinate-suppressed (zero map pins published).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-civic-900 mb-1">Night-Time Temporal Lens Definition</h4>
                <p>
                  Night-time is defined as <strong>20:00:00 to 04:59:59 IST</strong> based strictly on documented event
                  occurrence timestamps. Incomplete records (date-only) are reported as &quot;unknown occurrence time&quot;
                  and never guessed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-civic-200 bg-civic-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-civic-200 hover:bg-civic-300 text-civic-800 text-xs font-semibold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
