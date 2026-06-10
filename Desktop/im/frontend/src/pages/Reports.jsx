import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  BarChart, 
  AlertTriangle,
  Server
} from 'lucide-react';

const Reports = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      const res = await axios.get('/api/report/summary');
      setSummaryData(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Please complete at least one reconciliation run first to generate reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const triggerDownload = async (format) => {
    setDownloading(format);
    try {
      const res = await axios.get(`/api/report?format=${format}`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reconciliation_audit_report_${summaryData?.upload_id || 'latest'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="border-4 border-slate-800 border-t-violet-500 h-12 w-12 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Drafting executive briefing...</p>
      </div>
    );
  }

  const stats = summaryData?.statistics || {};

  return (
    <div className="space-y-8 max-w-5xl mx-auto select-none">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Audit & Executive Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Download signed PDF audits, structured spreadsheet exports, or review AI executive briefings.</p>
      </div>

      {error ? (
        <div className="p-8 glass rounded-2xl border border-dashed border-slate-800/80 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No reports generated</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            You must run reconciliation matching first to generate executive summaries and PDF reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Executive Briefing Summary */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass p-6 rounded-2xl border border-slate-800/80 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                <Sparkles className="h-44 w-44 text-violet-400" />
              </div>
              
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/60">
                <Sparkles className="h-5 w-5 text-violet-400" />
                <h3 className="text-base font-bold text-slate-200">AI-Generated Executive Briefing</h3>
              </div>

              {/* Simple parser for markdown paragraphs */}
              <div className="text-slate-300 text-sm leading-relaxed space-y-4 font-normal">
                {summaryData.executive_summary ? (
                  summaryData.executive_summary.split('\n\n').map((para, i) => (
                    <p key={i}>{para.replace(/[\*#_]/g, '')}</p>
                  ))
                ) : (
                  <p>Generating briefing notes...</p>
                )}
              </div>
            </div>
          </div>

          {/* Export Sidebar Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-6 rounded-2xl border border-slate-800/80 space-y-6">
              <h3 className="text-base font-bold text-slate-200">Download Assets</h3>
              
              <div className="space-y-3">
                {/* PDF download */}
                <button
                  onClick={() => triggerDownload('pdf')}
                  disabled={downloading !== null}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 text-white font-semibold py-3 px-4 rounded-xl transition-all border border-violet-500/20 text-sm flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{downloading === 'pdf' ? 'Formatting PDF...' : 'Download PDF Audit'}</span>
                </button>

                {/* CSV download */}
                <button
                  onClick={() => triggerDownload('csv')}
                  disabled={downloading !== null}
                  className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-3 px-4 rounded-xl transition-colors text-sm flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{downloading === 'csv' ? 'Compiling CSV...' : 'Download CSV Dataset'}</span>
                </button>
              </div>
            </div>

            {/* Run summary parameters */}
            <div className="glass p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Run Statistics</h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center space-x-2.5">
                  <Server className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">TOTAL ASSETS</p>
                    <p className="text-slate-300 mt-0.5">{stats.total_assets || 0}</p>
                  </div>
                </div>
                
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center space-x-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">MISMATCHES</p>
                    <p className="text-slate-300 mt-0.5">{stats.mismatches || 0}</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center space-x-2.5 col-span-2">
                  <ShieldCheck className="h-4 w-4 text-violet-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">COMPLIANCE RATING</p>
                    <p className="text-violet-400 mt-0.5">
                      {stats.total_assets 
                        ? `${Math.max(0, 100 - Math.round(((stats.missing_assets + stats.unexpected_assets + stats.mismatches) / stats.total_assets) * 100))}% Standard Match`
                        : '0% Match'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
