'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PublicIncident, SpatialAggregateCell } from '../../../../packages/shared/types';
import { MapPin, EyeOff, Scale, Info, Layers, List } from 'lucide-react';

interface MapComponentProps {
  incidents: PublicIncident[];
  aggregates: any[];
  center: [number, number];
  zoom: number;
  onSelectCase: (casePublicId: string) => void;
  isNightLensActive: boolean;
}

export default function MapComponent({
  incidents,
  aggregates,
  center,
  zoom,
  onSelectCase,
  isNightLensActive,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<PublicIncident | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');

  // Filter out suppressed incidents for map points
  const plottableIncidents = incidents.filter(
    (inc) => inc.latitude !== null && inc.longitude !== null
  );
  const suppressedIncidents = incidents.filter(
    (inc) => inc.latitude === null || inc.longitude === null
  );

  return (
    <div className="relative w-full h-[620px] rounded-xl overflow-hidden border border-civic-200 bg-civic-100 flex flex-col">
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-civic-200 text-xs flex items-center space-x-2">
          <span className="font-semibold text-civic-800">Spatial View:</span>
          <span className="text-civic-600">Greater Kolkata Pilot (500m Generalized Grids)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>

        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'table' : 'map')}
            className="bg-white/95 hover:bg-civic-50 text-civic-700 px-3 py-1.5 rounded-lg shadow-sm border border-civic-200 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            aria-label="Toggle between map and accessible table view"
          >
            {viewMode === 'map' ? (
              <>
                <List className="w-3.5 h-3.5 text-civic-500" />
                <span>Accessible Table View</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-civic-500" />
                <span>Interactive Map View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="relative w-full h-full flex flex-col justify-between">
          {/* Mock Vector Canvas Map Container with Interactive Spatial Points */}
          <div
            ref={mapContainerRef}
            className={`w-full h-full relative transition-colors duration-500 ${
              isNightLensActive ? 'bg-slate-900' : 'bg-slate-100'
            }`}
            style={{
              backgroundImage: isNightLensActive
                ? 'radial-gradient(#334155 1px, transparent 1px)'
                : 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            {/* Base Geographic Water / River Axis representation (Hooghly River) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 220 0 Q 240 200 210 380 T 190 620"
                fill="none"
                stroke={isNightLensActive ? '#1e293b' : '#93c5fd'}
                strokeWidth="42"
                strokeLinecap="round"
              />
              <text x="140" y="300" fill={isNightLensActive ? '#475569' : '#60a5fa'} fontSize="11" fontWeight="600" className="select-none">
                Hooghly River (Ganga)
              </text>
            </svg>

            {/* Render Ward Aggregate Hubs */}
            {aggregates.map((agg, idx) => {
              const [lon, lat] = agg.geometry?.coordinates || [88.36, 22.57];
              // Normalize relative to pilot bounding box
              const xPct = Math.min(Math.max(((lon - 88.25) / (88.52 - 88.25)) * 100, 10), 90);
              const yPct = Math.min(Math.max((1 - (lat - 22.45) / (22.68 - 22.45)) * 100, 10), 90);

              const isSupp = agg.properties?.is_suppressed;
              const countVal = agg.properties?.total_count;

              return (
                <div
                  key={agg.id || idx}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                  onClick={() => {
                    const match = incidents.find(
                      (i) => i.administrative_area_name.includes(agg.id.replace('agg_', ''))
                    );
                    if (match) setSelectedIncident(match);
                  }}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-transform group-hover:scale-110 border ${
                      isSupp
                        ? 'bg-civic-200 text-civic-600 border-civic-300'
                        : isNightLensActive
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-bengal-primary text-white border-blue-400'
                    }`}
                    title={`Zone: ${agg.id} | Reported: ${countVal} records`}
                  >
                    {countVal}
                  </div>
                  <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] whitespace-nowrap bg-white/90 px-1.5 py-0.5 rounded shadow text-civic-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {agg.id.replace('agg_', '').replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              );
            })}

            {/* Generalized Incident Coordinates */}
            {plottableIncidents.map((inc) => {
              const xPct = Math.min(Math.max(((inc.longitude! - 88.25) / (88.52 - 88.25)) * 100, 15), 85);
              const yPct = Math.min(Math.max((1 - (inc.latitude! - 22.45) / (22.68 - 22.45)) * 100, 15), 85);

              return (
                <button
                  key={inc.public_id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-150 z-30 ${
                    inc.is_night ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                  title={`${inc.category_name} (${inc.is_night ? 'Night' : 'Day'})`}
                  aria-label={`Incident ${inc.public_id}: ${inc.category_name}`}
                />
              );
            })}
          </div>

          {/* Bottom Disclaimer Banner */}
          <div className="bg-white/95 border-t border-civic-200 px-4 py-2.5 text-xs text-civic-600 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-civic-500 flex-shrink-0" />
              <span>
                Points represent reported public records generalized to ~500m cells. This tool provides historical
                reporting data only and does <strong>not</strong> predict danger or rate any location as unsafe.
              </span>
            </div>
            {suppressedIncidents.length > 0 && (
              <div className="flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 ml-4 flex-shrink-0">
                <EyeOff className="w-3.5 h-3.5" />
                <span>{suppressedIncidents.length} sensitive records coordinate-suppressed</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Accessible Alternative Table View */
        <div className="w-full h-full bg-white overflow-auto p-4 text-civic-800">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-civic-900">Accessible Incident Records Table</h3>
            <p className="text-xs text-civic-500">
              Complete tabular listing of public incidents for screen readers and keyboard navigation.
            </p>
          </div>
          <table className="w-full text-xs text-left border border-civic-200 rounded-lg overflow-hidden">
            <thead className="bg-civic-100 text-civic-700 uppercase font-semibold">
              <tr>
                <th className="p-2 border-b">Public ID</th>
                <th className="p-2 border-b">Category</th>
                <th className="p-2 border-b">Area / Zone</th>
                <th className="p-2 border-b">Time Window</th>
                <th className="p-2 border-b">Spatial Precision</th>
                <th className="p-2 border-b">Legal Timeline</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.public_id} className="border-b hover:bg-civic-50 transition-colors">
                  <td className="p-2 font-mono font-medium">{inc.public_id}</td>
                  <td className="p-2 font-medium">{inc.category_name}</td>
                  <td className="p-2">{inc.administrative_area_name}</td>
                  <td className="p-2">
                    {inc.is_night === true ? (
                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">Night (20:00-05:00)</span>
                    ) : inc.is_night === false ? (
                      <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">Day (05:00-20:00)</span>
                    ) : (
                      <span className="text-civic-500 bg-civic-100 px-1.5 py-0.5 rounded">Unknown Time</span>
                    )}
                  </td>
                  <td className="p-2 text-civic-500 font-mono text-[11px]">
                    {inc.spatial_precision === 'exact_suppressed' ? (
                      <span className="text-red-700 font-medium">Strictly Suppressed</span>
                    ) : (
                      inc.spatial_precision
                    )}
                  </td>
                  <td className="p-2">
                    {inc.has_case_timeline && inc.case_public_id ? (
                      <button
                        onClick={() => onSelectCase(inc.case_public_id!)}
                        className="text-bengal-primary hover:underline font-semibold flex items-center space-x-1"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>View Timeline</span>
                      </button>
                    ) : (
                      <span className="text-civic-400">No linked case</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Incident Drawer Popup */}
      {selectedIncident && (
        <div className="absolute bottom-14 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white p-4 rounded-xl shadow-xl border border-civic-200 z-40 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="civic-badge bg-civic-100 text-civic-700 mb-1">{selectedIncident.public_id}</span>
              <h4 className="font-semibold text-civic-900 text-sm">{selectedIncident.category_name}</h4>
              <p className="text-xs text-civic-500">{selectedIncident.administrative_area_name}, {selectedIncident.district_name}</p>
            </div>
            <button
              onClick={() => setSelectedIncident(null)}
              className="text-civic-400 hover:text-civic-700 text-sm font-bold"
              aria-label="Close details"
            >
              ×
            </button>
          </div>

          <div className="mt-3 text-xs space-y-1.5 text-civic-600 border-t border-civic-100 pt-2.5">
            <div className="flex justify-between">
              <span>Time Window:</span>
              <span className="font-medium">
                {selectedIncident.is_night === true ? 'Night-time (20:00-05:00 IST)' : selectedIncident.is_night === false ? 'Day-time' : 'Unknown incident time'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Spatial Privacy:</span>
              <span className="font-mono text-civic-700 font-medium">
                {selectedIncident.spatial_precision === 'exact_suppressed'
                  ? 'Zero coordinate pins (Suppressed)'
                  : '~500m Generalized Cell'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Source Citation:</span>
              <span className="text-bengal-primary underline truncate max-w-[180px]">{selectedIncident.source_name}</span>
            </div>
          </div>

          {selectedIncident.has_case_timeline && selectedIncident.case_public_id && (
            <div className="mt-3 pt-2.5 border-t border-civic-100">
              <button
                onClick={() => {
                  onSelectCase(selectedIncident.case_public_id!);
                  setSelectedIncident(null);
                }}
                className="w-full bg-bengal-primary hover:bg-blue-800 text-white py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>View Procedural Case Status Timeline</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
