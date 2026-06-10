import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, Database, HelpCircle } from 'lucide-react';

const UploadInventory = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [uploads, setUploads] = useState([]);
  const [reconciling, setReconciling] = useState(false);
  const navigate = useNavigate();

  const fetchUploads = async () => {
    try {
      const res = await axios.get('/api/uploads');
      setUploads(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleFileChange = (e) => {
    setError('');
    setSuccess(null);
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Only CSV files are accepted.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(res.data);
      setFile(null);
      fetchUploads();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'File upload failed. Verify structure.');
    } finally {
      setUploading(false);
    }
  };

  const startReconciliation = async (uploadId) => {
    setReconciling(true);
    try {
      await axios.post('/api/reconcile', { upload_id: uploadId });
      navigate('/results');
    } catch (err) {
      console.error(err);
      setError('Sync failed. Please verify API configuration.');
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto select-none">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">CMDB Intended Inventory Upload</h1>
        <p className="text-slate-400 text-sm mt-1">Upload the golden state registry spreadsheet representing target hardware alignments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload box */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass p-6 rounded-2xl border border-slate-800/80">
            <h3 className="text-base font-bold text-slate-200 mb-4">Ingest CSV Spreadsheet</h3>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="relative border-2 border-dashed border-slate-800 hover:border-violet-600/40 rounded-xl p-8 transition-colors flex flex-col items-center justify-center cursor-pointer bg-slate-900/10">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="h-10 w-10 text-slate-500 mb-2" />
                <span className="text-sm font-semibold text-slate-300">
                  {file ? file.name : 'Select or drag CSV file'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Maximum size 10MB</span>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="font-semibold">Upload Complete: {success.filename}</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    File registers {success.filename} into inventory records. Reconcile this registry now to test against live hosts.
                  </p>
                  <button
                    type="button"
                    onClick={() => startReconciliation(success.id)}
                    disabled={reconciling}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold py-2 px-3 rounded-lg border border-emerald-500/10 text-xs transition-colors flex items-center justify-center"
                  >
                    {reconciling ? 'Running AI Agents...' : 'Trigger Multi-Agent Reconciliation'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl transition-all border border-violet-500/20 text-sm"
              >
                {uploading ? 'Parsing CSV Columns...' : 'Upload Configuration Registry'}
              </button>
            </form>
          </div>
        </div>

        {/* Requirements guidelines */}
        <div className="lg:col-span-5">
          <div className="glass p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center space-x-2">
              <Database className="h-4 w-4 text-violet-400" />
              <span>CSV File Specifications</span>
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              To guarantee correct inventory correlation, check that your CSV spreadsheet strictly maintains the following headers and definitions:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-2">
              <p className="text-violet-400 font-bold">// Required Schema Columns</p>
              <p><span className="text-slate-200">asset_tag</span>: unique server code (e.g., SVR001)</p>
              <p><span className="text-slate-200">hostname</span>: internal resolve name (e.g., node-db-01)</p>
              <p><span className="text-slate-200">owner</span>: department code (e.g., security, engineering)</p>
              <p><span className="text-slate-200">environment</span>: network tier (production, staging, development)</p>
              <p><span className="text-slate-200">cpu</span>: CPU cores counts (integer)</p>
              <p><span className="text-slate-200">ram</span>: RAM allocation size GB (integer)</p>
              <p><span className="text-slate-200">storage</span>: Disk space GB (integer)</p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-900/40 p-3 rounded-lg">
              <HelpCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span>Rows with parsing drifts or syntax faults will raise structural errors.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadInventory;
