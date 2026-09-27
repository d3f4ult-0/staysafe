'use client';

import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [subjectType, setSubjectType] = useState('incident');
  const [referenceId, setReferenceId] = useState('');
  const [reportText, setReportText] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_type: subjectType,
          reference_id: referenceId || null,
          report_text: reportText,
          contact_email: contactEmail || null,
        }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-civic-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-civic-200 bg-civic-50">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-bengal-primary" />
            <h3 className="text-sm font-bold text-civic-900">Dataset Correction & Privacy Report</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-civic-400 hover:text-civic-700" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Operational Scope Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <span className="font-semibold text-amber-800">Operational Data Governance Notice</span>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                This channel is strictly for data provenance corrections, broken links, and privacy review. It is{' '}
                <strong>never</strong> used to publish unmoderated crowd-sourced crime reports. In an emergency, dial{' '}
                <strong>112</strong> immediately.
              </p>
            </div>
          </div>

          {status === 'success' ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-civic-900">Report Successfully Queued</h4>
              <p className="text-xs text-civic-500 max-w-sm mx-auto">
                Thank you for contributing to public data accuracy. Your report has been stored in the operational review
                queue for operator verification.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-bengal-primary text-white text-xs font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-civic-700 mb-1">Subject Type</label>
                <select
                  value={subjectType}
                  onChange={(e) => setSubjectType(e.target.value)}
                  className="w-full border border-civic-300 rounded-lg px-3 py-1.5 bg-white text-civic-800"
                >
                  <option value="incident">Incident Record Correction</option>
                  <option value="case">Legal Case Status Update</option>
                  <option value="source">Source Integrity / Broken Link</option>
                  <option value="boundary">Administrative Boundary Issue</option>
                  <option value="general">Privacy Concern / Takedown Request</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-civic-700 mb-1">Record ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. INC-2026-101 or CASE-2026-002"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full border border-civic-300 rounded-lg px-3 py-1.5 text-civic-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-civic-700 mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the discrepancy, official reference URL, or privacy issue..."
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="w-full border border-civic-300 rounded-lg p-2.5 text-civic-800"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-civic-700 mb-1">Contact Email (Optional)</label>
                <input
                  type="email"
                  placeholder="name@example.org (For verification follow-up)"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full border border-civic-300 rounded-lg px-3 py-1.5 text-civic-800"
                />
              </div>

              {status === 'error' && (
                <div className="text-rose-600 text-xs font-medium">Failed to submit report. Please try again.</div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-civic-300 rounded-lg text-civic-600 hover:bg-civic-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="px-4 py-1.5 bg-bengal-primary hover:bg-blue-800 text-white rounded-lg font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
