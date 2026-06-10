import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Database, 
  AlertOctagon, 
  HelpCircle, 
  Shuffle, 
  AlertTriangle,
  Play, 
  Upload,
  Calendar,
  CheckCircle,
  FileText
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const SEVERITY_COLORS = {
  Critical: '#EF4444', // Red
  High: '#F97316',     // Orange
  Medium: '#EAB308',   // Yellow
  Low: '#3B82F6',      // Blue
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      setStats(res.data);
      setError('');
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError('Failed to fetch dashboard intelligence. Please upload some files first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const triggerReconciliation = async () => {
    setReconciling(true);
    setToast('Agent pipeline active: reconciling Intended vs Live assets...');
    try {
      const latestPending = stats?.recent_uploads?.find(u => u.status === 'pending');
      const uploadId = latestPending ? latestPending.id : (stats?.recent_uploads?.[0]?.id || null);
      
      await axios.post('/api/reconcile', { upload_id: uploadId });
      setToast('Success! Reconciliation analysis completed.');
      await fetchStats();
    } catch (err) {
      console.error("Reconciliation error:", err);
      setToast('Error: Reconciliation process failed.');
    } finally {
      setReconciling(false);
      setTimeout(() => setToast(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="border-4 border-slate-800 border-t-violet-500 h-12 w-12 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Parsing system telemetry...</p>
      </div>
    );
  }

  // Formatting charts data
  const severityData = stats ? Object.entries(stats.severity_distribution)
    .filter(([_, val]) => val > 0)
    .map(([key, val]) => ({ name: key, value: val })) : [];

  const issueData = stats ? Object.entries(stats.issue_type_distribution).map(([key, val]) => ({
    name: key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    count: val
  })) : [];

  return (
    <div className="space-y-8 select-none">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-lg border border-violet-500/20 glass text-violet-400 text-sm font-semibold flex items-center space-x-3 glow-brand animate-bounce">
          <span className="border-2 border-violet-500/30 border-t-violet-400 h-4 w-4 rounded-full animate-spin"></span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">System Reconciliation Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Cross-reconciliation engine parsing cloud state telemetry.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/upload"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Upload New CSV</span>
          </Link>
          <button
            onClick={triggerReconciliation}
            disabled={reconciling || !stats?.recent_uploads?.length}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 border border-violet-500/20 transition-all duration-200 shadow-md hover:shadow-violet-600/10"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>{reconciling ? 'Running Sync Agents...' : 'Sync Reconciliation'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-8 glass rounded-2xl border border-dashed border-slate-800/80 text-center space-y-4">
          <AlertOctagon className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No telemetry parsed yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Before we can reconcile data, you must upload an intended inventory CSV spreadsheet and trigger reconciliation.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-bold text-white transition-all border border-violet-500/20"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Inventory File</span>
          </Link>
        </div>
      )}

      {stats && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Total assets */}
            <div className="glass p-5 rounded-2xl border border-slate-800/80 flex items-start space-x-4">
              <div className="p-3 bg-slate-800 rounded-xl text-slate-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Assets</p>
                <h2 className="text-3xl font-extrabold text-slate-200 mt-1">{stats.total_assets}</h2>
              </div>
            </div>

            {/* Missing Assets */}
            <div className="glass p-5 rounded-2xl border border-slate-800/80 flex items-start space-x-4">
              <div className="p-3 bg-red-950/20 text-red-400 rounded-xl border border-red-500/10">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missing Assets</p>
                <h2 className="text-3xl font-extrabold text-slate-200 mt-1">{stats.missing_assets}</h2>
              </div>
            </div>

            {/* Unexpected Assets */}
            <div className="glass p-5 rounded-2xl border border-slate-800/80 flex items-start space-x-4">
              <div className="p-3 bg-orange-950/20 text-orange-400 rounded-xl border border-orange-500/10">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unexpected Assets</p>
                <h2 className="text-3xl font-extrabold text-slate-200 mt-1">{stats.unexpected_assets}</h2>
              </div>
            </div>

            {/* Mismatches */}
            <div className="glass p-5 rounded-2xl border border-slate-800/80 flex items-start space-x-4">
              <div className="p-3 bg-yellow-950/20 text-yellow-400 rounded-xl border border-yellow-500/10">
                <Shuffle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Config Mismatches</p>
                <h2 className="text-3xl font-extrabold text-slate-200 mt-1">{stats.mismatches}</h2>
              </div>
            </div>

            {/* Critical Issues */}
            <div className="glass p-5 rounded-2xl border border-slate-800/80 flex items-start space-x-4 glow-rose">
              <div className="p-3 bg-red-900/10 text-red-500 rounded-xl border border-red-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Issues</p>
                <h2 className="text-3xl font-extrabold text-slate-200 mt-1">{stats.critical_issues}</h2>
              </div>
            </div>
          </div>

          {/* Charts Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bar Chart */}
            <div className="lg:col-span-7 glass p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-200">Reconciliation Discrepancy Matrix</h3>
                <p className="text-xs text-slate-500">Categorization of drift types parsed across assets</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={issueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px' }} 
                      labelStyle={{ color: '#F1F5F9', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="lg:col-span-5 glass p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-200">Severity Distribution</h3>
                <p className="text-xs text-slate-500">Reconciled findings weighted by operations risk</p>
              </div>
              <div className="h-64 w-full relative">
                {severityData.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xs text-slate-600">No anomalies detected to classify</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#334155'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px' }} 
                        itemStyle={{ color: '#F1F5F9' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        iconType="circle"
                        formatter={(value) => <span className="text-xs font-semibold text-slate-400">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Bottom upload history and direct results link */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Upload history */}
            <div className="lg:col-span-12 glass p-6 rounded-2xl border border-slate-800/80">
              <h3 className="text-base font-bold text-slate-200 mb-4">Upload History & Telemetry Runs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Filename</th>
                      <th className="py-3 px-4">Upload Date</th>
                      <th className="py-3 px-4">State Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {stats.recent_uploads.map((upload) => (
                      <tr key={upload.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-300 flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-violet-500" />
                          <span>{upload.filename}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-slate-600" />
                          <span>{new Date(upload.uploaded_at).toLocaleString()}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            upload.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                              : upload.status === 'failed'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/10'
                          }`}>
                            {upload.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            <span>{upload.status.toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={upload.status === 'completed' ? "/results" : "#"}
                            className={`text-xs font-bold ${
                              upload.status === 'completed' 
                                ? 'text-violet-400 hover:text-violet-300' 
                                : 'text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            Review Anomalies
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
