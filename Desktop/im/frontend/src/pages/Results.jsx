import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertOctagon, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  AlertTriangle, 
  Info,
  Server,
  Terminal,
  Clock,
  Settings
} from 'lucide-react';

const SEVERITY_BADGES = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const Results = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAsset, setExpandedAsset] = useState(null);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchResults = async () => {
    try {
      const res = await axios.get('/api/results');
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve reconciliation dataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const toggleExpand = (id) => {
    if (expandedAsset === id) {
      setExpandedAsset(null);
    } else {
      setExpandedAsset(id);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="border-4 border-slate-800 border-t-violet-500 h-12 w-12 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Aggregating discrepancy records...</p>
      </div>
    );
  }

  // Filter list
  const filteredResults = results.filter(r => {
    const matchesSev = severityFilter === 'ALL' || r.severity === severityFilter;
    const matchesType = typeFilter === 'ALL' || r.issue_type === typeFilter;
    return matchesSev && matchesType;
  });

  return (
    <div className="space-y-8 select-none">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Reconciliation Anomaly Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">Telemetry audit showing discrepancies, state drifts, and AI remediation guidance.</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {results.length === 0 ? (
        <div className="p-12 glass rounded-2xl border border-dashed border-slate-800/80 text-center space-y-4">
          <AlertOctagon className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No anomalies detected</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Your live hardware is fully aligned with the active golden intended inventory upload. No action required.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="glass p-4 rounded-xl border border-slate-800/80 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 text-slate-400 text-sm">
              <Filter className="h-4 w-4" />
              <span className="font-semibold">Filters:</span>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Severity</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg p-1.5 focus:outline-none focus:border-violet-500"
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Drift Type Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Drift Category</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg p-1.5 focus:outline-none focus:border-violet-500"
              >
                <option value="ALL">All Drift Types</option>
                <option value="missing_asset">Missing Asset</option>
                <option value="unauthorized_asset">Unauthorized Asset</option>
                <option value="hostname_mismatch">Hostname Mismatch</option>
                <option value="owner_mismatch">Owner Mismatch</option>
                <option value="environment_drift">Environment Drift</option>
                <option value="configuration_drift">Configuration Drift</option>
              </select>
            </div>

            <div className="ml-auto text-xs text-slate-500">
              Showing <span className="text-slate-300 font-semibold">{filteredResults.length}</span> of <span className="text-slate-300 font-semibold">{results.length}</span> issues
            </div>
          </div>

          {/* Results Table */}
          <div className="glass rounded-xl border border-slate-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-6">Asset Tag</th>
                    <th className="py-3 px-6">Classification</th>
                    <th className="py-3 px-6">Severity</th>
                    <th className="py-3 px-6">Drift Vector</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredResults.map((item) => {
                    const isExpanded = expandedAsset === item.id;
                    const details = item.details ? JSON.parse(item.details) : {};
                    
                    return (
                      <React.Fragment key={item.id}>
                        {/* Summary Row */}
                        <tr 
                          onClick={() => toggleExpand(item.id)}
                          className="hover:bg-slate-900/20 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6 font-bold text-slate-300">{item.asset_tag}</td>
                          <td className="py-4 px-6 text-slate-400 font-medium">
                            {item.classification || item.issue_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${SEVERITY_BADGES[item.severity] || 'bg-slate-800 text-slate-400'}`}>
                              {item.severity}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-mono text-xs text-slate-500">
                              {item.issue_type}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-slate-400">
                            {isExpanded ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                          </td>
                        </tr>

                        {/* Detail Row */}
                        {isExpanded && (
                          <tr className="bg-slate-900/40 border-t border-slate-800/40">
                            <td colSpan={5} className="py-6 px-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Configuration State Comparison */}
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                                    <Server className="h-3.5 w-3.5 text-violet-400" />
                                    <span>Comparison State Matrix</span>
                                  </h4>
                                  
                                  <div className="bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden text-xs">
                                    <div className="grid grid-cols-3 border-b border-slate-800 p-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                                      <div>Metric</div>
                                      <div>Intended (CSV)</div>
                                      <div>Live State (API)</div>
                                    </div>
                                    
                                    {/* Map metrics */}
                                    {['hostname', 'owner', 'environment', 'cpu', 'ram', 'storage'].map(key => {
                                      const intendedVal = details.intended?.[key];
                                      const liveVal = details.live?.[key];
                                      const isConfigVal = ['cpu', 'ram', 'storage'].includes(key);
                                      const hasDiff = intendedVal !== liveVal;
                                      
                                      return (
                                        <div 
                                          key={key} 
                                          className={`grid grid-cols-3 p-2 border-b border-slate-900/50 ${hasDiff ? 'bg-violet-950/15' : ''}`}
                                        >
                                          <div className={`font-semibold ${hasDiff ? 'text-violet-400' : 'text-slate-500'}`}>
                                            {key.toUpperCase()}
                                          </div>
                                          <div className="text-slate-300 truncate">
                                            {intendedVal !== undefined && intendedVal !== null 
                                              ? `${intendedVal}${isConfigVal && key === 'ram' ? ' GB' : isConfigVal && key === 'storage' ? ' GB' : ''}` 
                                              : '—'}
                                          </div>
                                          <div className={`font-medium truncate ${hasDiff ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                                            {liveVal !== undefined && liveVal !== null 
                                              ? `${liveVal}${isConfigVal && key === 'ram' ? ' GB' : isConfigVal && key === 'storage' ? ' GB' : ''}` 
                                              : '—'}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* AI Recommendation section */}
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>AI Agent Remediation Recommendations</span>
                                  </h4>
                                  
                                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 h-full">
                                    <div className="flex items-start space-x-2.5">
                                      <Info className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                        {item.recommendation || 'AI recommendation could not be processed.'}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-1 text-[10px] text-slate-600 border-t border-slate-900/60 pt-3">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>Generated by Gemini 2.5 Flash</span>
                                      <span className="mx-2">•</span>
                                      <Settings className="h-3.5 w-3.5" />
                                      <span>Audit compliant workflow</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
