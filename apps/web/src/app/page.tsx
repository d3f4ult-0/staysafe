'use client';

import React, { useEffect, useState } from 'react';
import {
  Map as MapIcon,
  Moon,
  Building2,
  HardDrive,
  BookOpen,
  MessageSquare,
  Search,
  Filter,
  Shield,
  Clock,
  Layers,
} from 'lucide-react';

import MapComponent from '../components/MapComponent';
import NightLensView from '../components/NightLensView';
import AreaSummaryView from '../components/AreaSummaryView';
import OfflineHub from '../components/OfflineHub';
import CaseDetailModal from '../components/CaseDetailModal';
import SourcesModal from '../components/SourcesModal';
import FeedbackModal from '../components/FeedbackModal';

import { PublicIncident } from '../../../../packages/shared/types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'map' | 'night' | 'summary' | 'offline'>('map');
  const [timeFilter, setTimeFilter] = useState<'all' | 'night' | 'day'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [incidents, setIncidents] = useState<PublicIncident[]>([]);
  const [aggregates, setAggregates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ward_kmc_central');

  // Fetch incidents & aggregates based on filters
  useEffect(() => {
    setLoading(true);
    let url = `/api/v1/incidents?page_size=50&time_filter=${timeFilter}`;
    if (categoryFilter !== 'all') {
      url += `&category=${categoryFilter}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setIncidents(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    let aggUrl = `/api/v1/map/aggregates?time_filter=${timeFilter}`;
    if (categoryFilter !== 'all') {
      aggUrl += `&category=${categoryFilter}`;
    }

    fetch(aggUrl)
      .then((res) => res.json())
      .then((data) => {
        setAggregates(data.features || []);
      })
      .catch(() => {});
  }, [timeFilter, categoryFilter]);

  // Filter incidents locally by search query if present
  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.category_name.toLowerCase().includes(q) ||
      inc.administrative_area_name.toLowerCase().includes(q) ||
      inc.public_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Primary Navigation & Control Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-civic-200 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-bengal-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
              BS
            </div>
            <div>
              <h1 className="text-xl font-bold text-civic-900 tracking-tight">Bengal Safety Map</h1>
              <span className="text-xs text-civic-500 font-medium">Public Civic Transparency & Night-Time Lens</span>
            </div>
            <span className="civic-badge bg-blue-50 text-blue-800 border border-blue-200 text-[11px] ml-2">
              Pilot: Greater Kolkata
            </span>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSourcesModal(true)}
            className="px-3 py-1.5 rounded-lg border border-civic-200 bg-white hover:bg-civic-50 text-civic-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-civic-500" />
            <span>Sources & Methodology</span>
          </button>
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="px-3 py-1.5 rounded-lg border border-civic-200 bg-white hover:bg-civic-50 text-civic-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5 text-civic-500" />
            <span>Report Correction</span>
          </button>
        </div>
      </header>

      {/* Screen View Mode Selector Tabs */}
      <nav className="flex flex-wrap items-center gap-2 border-b border-civic-200 pb-2">
        <button
          onClick={() => {
            setActiveTab('map');
            setTimeFilter('all');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'map'
              ? 'bg-bengal-primary text-white shadow-sm'
              : 'text-civic-600 hover:text-civic-900 hover:bg-civic-100'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Explore Map</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('night');
            setTimeFilter('night');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'night'
              ? 'bg-slate-900 text-amber-300 shadow-sm border border-slate-800'
              : 'text-civic-600 hover:text-civic-900 hover:bg-civic-100'
          }`}
        >
          <Moon className="w-4 h-4 text-amber-400" />
          <span>Night-Time Lens</span>
          <span className="text-[10px] bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-300">20:00 - 05:00</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'summary'
              ? 'bg-bengal-primary text-white shadow-sm'
              : 'text-civic-600 hover:text-civic-900 hover:bg-civic-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Area Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('offline')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'offline'
              ? 'bg-bengal-primary text-white shadow-sm'
              : 'text-civic-600 hover:text-civic-900 hover:bg-civic-100'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Offline Packages</span>
        </button>
      </nav>

      {/* Filter and Search Bar (Active for Map & Night Lens) */}
      {(activeTab === 'map' || activeTab === 'night') && (
        <div className="bg-white p-3.5 rounded-xl border border-civic-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-civic-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ward, place, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-civic-300 rounded-lg text-xs text-civic-800 focus:outline-none focus:ring-2 focus:ring-bengal-primary bg-civic-50/50"
              />
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-civic-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-civic-300 rounded-lg px-2.5 py-1.5 bg-white text-civic-800 font-medium"
              >
                <option value="all">All Controlled Categories</option>
                <option value="property_theft">Property Theft</option>
                <option value="traffic_road_safety">Road & Traffic Safety</option>
                <option value="assault_physical_violence">Physical Assault</option>
                <option value="public_disturbance">Public Disturbance</option>
                <option value="substance_narcotics">Substance Offense</option>
                <option value="financial_fraud_cyber">Cyber & Financial Fraud</option>
                <option value="sexual_offenses_harassment">Sexual Harassment (Suppressed Pins)</option>
                <option value="domestic_violence_family">Domestic Violence (Suppressed Pins)</option>
                <option value="offenses_against_minors">Offenses Against Children (Suppressed)</option>
              </select>
            </div>
          </div>

          {/* Time Window Buttons (When on Map tab) */}
          {activeTab === 'map' && (
            <div className="flex items-center space-x-1 bg-civic-100 p-1 rounded-lg self-start md:self-auto">
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  timeFilter === 'all' ? 'bg-white text-civic-900 shadow-sm' : 'text-civic-600 hover:text-civic-900'
                }`}
              >
                All Times
              </button>
              <button
                onClick={() => setTimeFilter('night')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-all ${
                  timeFilter === 'night'
                    ? 'bg-slate-900 text-amber-300 shadow-sm'
                    : 'text-civic-600 hover:text-civic-900'
                }`}
              >
                <Moon className="w-3 h-3 text-amber-400" />
                <span>Night (20-05)</span>
              </button>
              <button
                onClick={() => setTimeFilter('day')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  timeFilter === 'day' ? 'bg-white text-civic-900 shadow-sm' : 'text-civic-600 hover:text-civic-900'
                }`}
              >
                Day (05-20)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main View Screen Content */}
      <main className="space-y-6">
        {activeTab === 'map' && (
          <MapComponent
            incidents={filteredIncidents}
            aggregates={aggregates}
            center={[22.5726, 88.3639]}
            zoom={12}
            onSelectCase={(caseId) => setSelectedCaseId(caseId)}
            isNightLensActive={false}
          />
        )}

        {activeTab === 'night' && (
          <div className="space-y-6">
            <NightLensView incidents={filteredIncidents} />
            <MapComponent
              incidents={filteredIncidents}
              aggregates={aggregates}
              center={[22.5726, 88.3639]}
              zoom={12}
              onSelectCase={(caseId) => setSelectedCaseId(caseId)}
              isNightLensActive={true}
            />
          </div>
        )}

        {activeTab === 'summary' && (
          <AreaSummaryView
            selectedAreaId={selectedAreaId}
            onSelectArea={(areaId) => setSelectedAreaId(areaId)}
          />
        )}

        {activeTab === 'offline' && <OfflineHub />}
      </main>

      {/* Interactive Modals */}
      {selectedCaseId && (
        <CaseDetailModal casePublicId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />
      )}
      {showSourcesModal && <SourcesModal onClose={() => setShowSourcesModal(false)} />}
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
    </div>
  );
}
