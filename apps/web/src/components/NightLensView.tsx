'use client';

import React from 'react';
import { Moon, Sun, HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PublicIncident } from '../../../../packages/shared/types';

interface NightLensViewProps {
  incidents: PublicIncident[];
}

export default function NightLensView({ incidents }: NightLensViewProps) {
  const total = incidents.length;
  const nightIncidents = incidents.filter((i) => i.is_night === true);
  const dayIncidents = incidents.filter((i) => i.is_night === false);
  const unknownTimeIncidents = incidents.filter((i) => i.is_night === null);

  const knownTotal = nightIncidents.length + dayIncidents.length;
  const nightSharePct = knownTotal > 0 ? Math.round((nightIncidents.length / knownTotal) * 100) : 0;
  const unknownPct = total > 0 ? Math.round((unknownTimeIncidents.length / total) * 100) : 0;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Policy Definition Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Moon className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Night-Time Lens Analysis</h2>
            <span className="bg-amber-400/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-mono">
              20:00 - 05:00 IST
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing temporal distribution based strictly on documented occurrence time (<code className="text-slate-300">occurred_at</code>).
          </p>
        </div>

        <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/80 text-xs text-slate-300 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Never inferred from publication or media reporting timestamps.</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Night Records */}
        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Night-Time Incidents</span>
            <Moon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{nightIncidents.length}</span>
            <span className="text-xs text-amber-400 font-medium">({nightSharePct}% of known times)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Occurred between 8:00 PM and 5:00 AM</p>
        </div>

        {/* Day Records */}
        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Day-Time Incidents</span>
            <Sun className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{dayIncidents.length}</span>
            <span className="text-xs text-sky-400 font-medium">({100 - nightSharePct}% of known times)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Occurred between 5:00 AM and 8:00 PM</p>
        </div>

        {/* Missingness Indicator */}
        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Unknown Occurrence Time</span>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{unknownTimeIncidents.length}</span>
            <span className="text-xs text-slate-400 font-medium">({unknownPct}% missingness rate)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Recorded as date-only or time omitted</p>
        </div>
      </div>

      {/* Methodological Context Warning */}
      <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-4 text-xs text-amber-200/90 space-y-2">
        <div className="flex items-center space-x-2 font-semibold text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Understanding Night-Time Data Caveats</span>
        </div>
        <p className="leading-relaxed">
          Higher or lower night-time reported numbers do <strong>not</strong> indicate that an area is intrinsically
          dangerous or safe. Observed temporal patterns are strongly influenced by commercial operating hours, shift
          schedules, transit terminal activity, police patrol deployments, and delayed reporting practices.
        </p>
      </div>
    </div>
  );
}
