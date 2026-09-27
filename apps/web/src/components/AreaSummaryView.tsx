'use client';

import React, { useEffect, useState } from 'react';
import { AreaSummary } from '../../../../packages/shared/types';
import { Building2, AlertCircle, FileCheck, Calendar, Users, Info } from 'lucide-react';

interface AreaSummaryViewProps {
  selectedAreaId: string;
  onSelectArea: (areaId: string) => void;
}

const PILOT_AREAS = [
  { id: 'ward_kmc_central', name: 'Kolkata Central Commercial Core' },
  { id: 'ward_kmc_north', name: 'Kolkata North Heritage Zone' },
  { id: 'ward_kmc_south', name: 'Kolkata South Residential Hub' },
  { id: 'ward_kmc_port', name: 'Kolkata Port & Kidderpore Zone' },
  { id: 'ward_saltlake_sector5', name: 'Bidhannagar Sector V IT Hub' },
  { id: 'ward_newtown_actionarea1', name: 'New Town Action Area 1' },
  { id: 'ward_howrah_station', name: 'Howrah Station Riverfront' },
];

export default function AreaSummaryView({ selectedAreaId, onSelectArea }: AreaSummaryViewProps) {
  const [summary, setSummary] = useState<AreaSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/areas/${selectedAreaId}/summary`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedAreaId]);

  return (
    <div className="civic-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-civic-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-civic-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-bengal-primary" />
            <span>Administrative Area Descriptive Summary</span>
          </h2>
          <p className="text-xs text-civic-500 mt-0.5">
            Non-alarmist overview of publicly documented records and institutional outcomes.
          </p>
        </div>

        {/* Zone Selector */}
        <select
          value={selectedAreaId}
          onChange={(e) => onSelectArea(e.target.value)}
          className="border border-civic-300 rounded-lg px-3 py-1.5 text-xs text-civic-800 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-bengal-primary"
        >
          {PILOT_AREAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-civic-500 animate-pulse">Loading area summary...</div>
      ) : summary ? (
        <div className="space-y-6">
          {/* Main Key Figures */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-civic-50 p-3 rounded-lg border border-civic-200">
              <span className="text-[11px] text-civic-500 font-medium">Reported Records</span>
              <div className="text-xl font-bold text-civic-900 mt-1">{summary.total_records}</div>
              <span className="text-[10px] text-civic-500">Publicly filed</span>
            </div>

            <div className="bg-civic-50 p-3 rounded-lg border border-civic-200">
              <span className="text-[11px] text-civic-500 font-medium">Court-Recorded Outcomes</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">{summary.available_court_outcomes_count}</div>
              <span className="text-[10px] text-civic-500">Verdicts / dispositions</span>
            </div>

            <div className="bg-civic-50 p-3 rounded-lg border border-civic-200">
              <span className="text-[11px] text-civic-500 font-medium">Night-Time Share</span>
              <div className="text-xl font-bold text-amber-700 mt-1">
                {summary.night_time_share_pct !== null ? `${summary.night_time_share_pct}%` : 'N/A'}
              </div>
              <span className="text-[10px] text-civic-500">20:00 - 05:00 IST</span>
            </div>

            <div className="bg-civic-50 p-3 rounded-lg border border-civic-200">
              <span className="text-[11px] text-civic-500 font-medium">Data Freshness</span>
              <div className="text-xs font-semibold text-civic-800 mt-2 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-civic-500" />
                <span>Cutoff: {summary.data_cutoff_date}</span>
              </div>
              <span className="text-[10px] text-civic-500">From {summary.sources_count} active sources</span>
            </div>
          </div>

          {/* Normalization & Denominator Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-slate-800">
              <Users className="w-4 h-4 text-slate-600" />
              <span>Sourced Population Normalization</span>
            </div>
            {summary.denominator_used ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-slate-600">
                  Rate per 100,000 residents: <strong className="text-slate-900">{summary.rate_per_capita}</strong>
                </span>
                <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Denominator: {summary.denominator_used}
                </span>
              </div>
            ) : (
              <p className="text-slate-500 italic">
                Valid population or transit footfall denominator is currently unavailable for this specific zone.
                Raw counts are displayed rather than implying false comparability.
              </p>
            )}
          </div>

          {/* Caveats & Uncertainty Panel */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Uncertainty & Data-Quality Caveats</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-amber-800 text-[11px]">
              {summary.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
              {summary.uncertainty_notes.map((u, i) => (
                <li key={`u-${i}`} className="font-medium text-amber-900">
                  {u}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-civic-500">Summary unavailable</div>
      )}
    </div>
  );
}
