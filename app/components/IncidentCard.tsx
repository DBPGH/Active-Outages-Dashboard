'use client';

import { useState } from 'react';
import { Incident, SEVERITY_CONFIG } from '@/lib/types';

interface Props {
  incident: Incident;
}

function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const STATUS_LABELS: Record<string, string> = {
  investigating:    'Investigating',
  identified:       'Identified',
  monitoring:       'Monitoring',
  resolved:         'Resolved',
  postmortem:       'Post-Mortem',
  'service disruption': 'Service Disruption',
  'service degradation': 'Service Degradation',
};

function humanStatus(s: string) {
  return STATUS_LABELS[s?.toLowerCase()] ?? s ?? 'Active';
}

export default function IncidentCard({ incident }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[incident.impact];

  return (
    <div className={`rounded-xl border ${cfg.borderColor} bg-gray-900/60 overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotColor} ${incident.impact !== 'operational' ? 'animate-pulse' : ''}`} />
            <div className="min-w-0">
              <h3 className="text-white font-medium text-sm leading-snug">{incident.name}</h3>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badgeBg} ${cfg.textColor} border ${cfg.borderColor}`}>
                  {cfg.label}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-300 border border-gray-700/50">
                  {humanStatus(incident.status)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-gray-500 text-xs mt-0.5">
            {expanded ? '▲' : '▼'}
          </div>
        </div>

        {/* Affected services */}
        {incident.affectedServices.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 ml-5">
            {incident.affectedServices.slice(0, 5).map(s => (
              <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-gray-800/80 text-gray-400 border border-gray-700/40">
                {s}
              </span>
            ))}
            {incident.affectedServices.length > 5 && (
              <span className="px-1.5 py-0.5 rounded text-xs text-gray-500">
                +{incident.affectedServices.length - 5} more
              </span>
            )}
          </div>
        )}

        <div className="flex gap-4 mt-2 ml-5 text-xs text-gray-500">
          <span>Started: {formatDate(incident.createdAt)}</span>
          {incident.updatedAt !== incident.createdAt && (
            <span>Updated: {formatDate(incident.updatedAt)}</span>
          )}
        </div>
      </button>

      {/* Expanded: update timeline */}
      {expanded && incident.updates.length > 0 && (
        <div className="px-4 pb-4 border-t border-gray-700/40">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">
            Update Timeline
          </h4>
          <div className="space-y-3">
            {incident.updates.map((update, idx) => (
              <div key={update.id || idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${idx === 0 ? cfg.dotColor : 'bg-gray-600'}`} />
                  {idx < incident.updates.length - 1 && (
                    <div className="w-px flex-1 bg-gray-700/50 mt-1" />
                  )}
                </div>
                <div className="pb-2 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-300">{humanStatus(update.status)}</span>
                    <span className="text-xs text-gray-500">{formatDate(update.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{update.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && incident.updates.length === 0 && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-700/40">
          <p className="text-sm text-gray-500">No update details available.</p>
        </div>
      )}

      {incident.url && (
        <div className={`px-4 py-2 border-t border-gray-700/40 ${cfg.bgColor}`}>
          <a
            href={incident.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs ${cfg.textColor} hover:underline`}
            onClick={e => e.stopPropagation()}
          >
            View on official status page ↗
          </a>
        </div>
      )}
    </div>
  );
}
