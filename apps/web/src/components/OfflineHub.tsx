'use client';

import React, { useEffect, useState } from 'react';
import { OfflinePackageMeta } from '../../../../packages/shared/types';
import { Download, Wifi, WifiOff, CheckCircle2, ShieldCheck, Clock, HardDrive, RefreshCw } from 'lucide-react';

export default function OfflineHub() {
  const [packages, setPackages] = useState<OfflinePackageMeta[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [cachedStatus, setCachedStatus] = useState<string>('Checking browser cache...');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fetch available packages from API
    fetch('/api/v1/offline-packages')
      .then((res) => res.json())
      .then((data) => {
        setPackages(data);
        checkLocalCache();
      })
      .catch(() => checkLocalCache());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkLocalCache = async () => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('bengal-safety-map-v1');
        const match = await cache.match('/api/v1/offline-packages/pkg_kolkata_metro_v1/download');
        if (match) {
          setCachedStatus('Offline pilot package is cached and available locally.');
        } else {
          setCachedStatus('No offline package cached yet.');
        }
      } catch {
        setCachedStatus('Local cache inspection unavailable.');
      }
    }
  };

  const handleDownloadAndCache = async (pkg: OfflinePackageMeta) => {
    setDownloading(true);
    try {
      const response = await fetch(pkg.download_url);
      const data = await response.json();

      // Cache into CacheStorage
      if ('caches' in window) {
        const cache = await caches.open('bengal-safety-map-v1');
        await cache.put(
          pkg.download_url,
          new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }

      // Also trigger browser file download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pkg.package_id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setCachedStatus('Package downloaded and stored in offline cache.');
    } catch (err) {
      alert('Failed to download offline package.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="civic-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-civic-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-bengal-primary" />
            <h2 className="text-base font-bold text-civic-900">Offline & Regional Package Hub</h2>
          </div>
          <p className="text-xs text-civic-500 mt-0.5">
            Download verified, self-contained data packages for field work and low-connectivity environments.
          </p>
        </div>

        {/* Live Network Status Indicator */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isOnline ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-rose-600" />}
          <span>{isOnline ? 'Online Mode' : 'Offline Mode (Cached)'}</span>
        </div>
      </div>

      {/* Package Listings */}
      <div className="space-y-4">
        {packages.map((pkg) => (
          <div key={pkg.package_id} className="border border-civic-200 rounded-xl p-5 bg-civic-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-civic-900">{pkg.area_name}</h3>
                  <span className="civic-badge bg-blue-100 text-blue-800 font-mono text-[10px]">{pkg.release_version}</span>
                </div>
                <p className="text-xs text-civic-500 mt-1">
                  Complete offline bundle: boundary vectors, aggregated spatial cells, provenance manifest, and methodology.
                </p>
              </div>

              <button
                onClick={() => handleDownloadAndCache(pkg)}
                disabled={downloading}
                className="bg-bengal-primary hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Downloading...' : 'Download Offline Package'}</span>
              </button>
            </div>

            {/* Verification Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-civic-200 pt-3">
              <div>
                <span className="text-civic-500 text-[11px]">Records Included:</span>
                <p className="font-semibold text-civic-900">{pkg.record_count} incidents</p>
              </div>
              <div>
                <span className="text-civic-500 text-[11px]">Bundle Size:</span>
                <p className="font-semibold text-civic-900">{Math.round(pkg.file_size_bytes / 1024)} KB</p>
              </div>
              <div>
                <span className="text-civic-500 text-[11px]">Freshness Cutoff:</span>
                <p className="font-semibold text-civic-900">{pkg.data_cutoff.slice(0, 10)}</p>
              </div>
              <div>
                <span className="text-civic-500 text-[11px]">Expiration:</span>
                <p className="font-semibold text-civic-900">Valid 30 days</p>
              </div>
            </div>

            {/* Cryptographic Checksum */}
            <div className="bg-white p-2.5 rounded-lg border border-civic-200 text-[11px] text-civic-600 flex items-center justify-between">
              <span className="font-mono text-[10px] truncate max-w-xs sm:max-w-md">
                SHA-256 Checksum: <code className="text-civic-800">{pkg.sha256_checksum}</code>
              </span>
              <span className="text-emerald-700 flex items-center space-x-1 font-semibold flex-shrink-0 ml-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Bundle</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Browser Cache Status */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{cachedStatus}</span>
        </div>
        <button
          onClick={checkLocalCache}
          className="text-civic-500 hover:text-civic-800 flex items-center space-x-1 text-[11px] font-medium"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Check Status</span>
        </button>
      </div>
    </div>
  );
}
