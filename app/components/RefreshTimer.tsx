'use client';

import { useEffect, useState } from 'react';

interface Props {
  interval: number; // seconds
  onRefresh: () => void;
  lastUpdated?: string;
}

export default function RefreshTimer({ interval, onRefresh, lastUpdated }: Props) {
  const [countdown, setCountdown] = useState(interval);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setCountdown(interval);
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          handleRefresh();
          return interval;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [interval, lastUpdated]);

  async function handleRefresh() {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  }

  const pct = ((interval - countdown) / interval) * 100;

  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <span className="text-xs text-gray-500">
          Last updated {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700/50 text-xs text-gray-300 transition-colors disabled:opacity-50"
      >
        <span className={`${refreshing ? 'animate-spin' : ''}`}>↻</span>
        <span>{refreshing ? 'Refreshing…' : `Refresh in ${countdown}s`}</span>
        {/* Progress ring */}
        <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
          <circle
            cx="7" cy="7" r="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 5}`}
            strokeDashoffset={`${2 * Math.PI * 5 * (1 - pct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 7 7)"
            className="text-blue-400"
          />
        </svg>
      </button>
    </div>
  );
}
