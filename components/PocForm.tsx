import React, { useState } from 'react';
import { Upload, Calendar, MapPin, FileText, ArrowRight, User, Target, FileSpreadsheet, CheckCircle2, ChevronRight } from 'lucide-react';

interface PocFormProps {
  onStartProcess: (formData: FormData, scenarioName: string) => void;
  onSkipToOptimization: () => void;
}

export const PocForm: React.FC<PocFormProps> = ({ onStartProcess, onSkipToOptimization }) => {
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  const [consignmentFile, setConsignmentFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const scenarioName = formData.get('scenario_name') as string;

    // Validate
    if (!scenarioName || !vehicleFile || !consignmentFile) {
      alert("Please fill in all required fields and upload files.");
      return;
    }

    // Trigger background process in parent and navigate immediately
    onStartProcess(formData, scenarioName);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">New POC Scenario</h1>
        <p className="text-slate-500">Upload customer data once · standardize · optimize later.</p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-white/60 ring-1 ring-slate-900/5 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-sky-500" />
            <span className="font-semibold text-slate-700 text-sm">Scenario & Inputs</span>
          </div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Step 1 · Capture Data</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 lg:p-10">
          <div className="grid lg:grid-cols-12 gap-10">
            
            {/* Left Column: Scenario Details */}
            <div className="lg:col-span-7 space-y-7">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Scenario Details</h3>
                  <p className="text-xs text-slate-500">Define the who, when, and where</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="group">
                  <label htmlFor="scenario_name" className="block text-xs font-semibold text-slate-500 mb-1.5 group-focus-within:text-indigo-600 transition-colors">Scenario name *</label>
                  <div className="relative">
                    <input
                      id="scenario_name"
                      name="scenario_name"
                      type="text"
                      required
                      placeholder="e.g. LUX_POST_Jun15_Baseline"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
                    />
                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="customer_name" className="block text-xs font-semibold text-slate-500 mb-1.5 group-focus-within:text-indigo-600 transition-colors">Customer name *</label>
                  <div className="relative">
                    <input
                      id="customer_name"
                      name="customer_name"
                      type="text"
                      required
                      placeholder="e.g. LUX POST"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
                    />
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="date_of_operations" className="block text-xs font-semibold text-slate-500 mb-1.5 group-focus-within:text-indigo-600 transition-colors">Date of operations *</label>
                  <div className="relative">
                    <input
                      id="date_of_operations"
                      name="date_of_operations"
                      type="date"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
                    />
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 group-focus-within:text-indigo-600 transition-colors">Hub location (lat / lng) *</label>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <input
                        name="hub_lat"
                        type="number"
                        step="any"
                        required
                        placeholder="Latitude"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
                      />
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <div className="relative flex-1">
                      <input
                        name="hub_lng"
                        type="number"
                        step="any"
                        required
                        placeholder="Longitude"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
                      />
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="business_objective" className="block text-xs font-semibold text-slate-500 mb-1.5 group-focus-within:text-indigo-600 transition-colors">Business objective (optional)</label>
                  <textarea
                    id="business_objective"
                    name="business_objective"
                    rows={3}
                    placeholder="e.g. Minimize vehicles while keeping trips under 8 hours..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Right Column: Files */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Customer Files</h3>
                    <p className="text-xs text-slate-500">Raw input · any format</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Vehicle File Input */}
                  <div className="group">
                    <label htmlFor="vehicle_file" className="block text-xs font-semibold text-slate-500 mb-2 group-hover:text-sky-600 transition-colors">Vehicle file *</label>
                    <div 
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer overflow-hidden
                        ${vehicleFile 
                          ? 'border-emerald-400 bg-emerald-50/50' 
                          : 'border-slate-300 hover:border-sky-400 bg-white hover:bg-sky-50/30'
                        }`}
                    >
                      <input
                        id="vehicle_file"
                        name="vehicle_file"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        required
                        onChange={(e) => handleFileChange(e, setVehicleFile)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      />
                      <div className="flex flex-col items-center justify-center text-center relative z-10 pointer-events-none">
                        {vehicleFile ? (
                          <>
                            <div className="bg-white p-2 rounded-full shadow-sm mb-2 relative">
                               <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                               <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-white">
                                 <CheckCircle2 className="w-3 h-3 text-white" />
                               </div>
                            </div>
                            <span className="text-sm font-semibold text-emerald-900 break-all px-2 line-clamp-1">{vehicleFile.name}</span>
                            <span className="text-xs text-emerald-600 mt-0.5 font-mono">{formatFileSize(vehicleFile.size)}</span>
                            <span className="text-[10px] text-emerald-500/70 mt-2 uppercase tracking-widest font-bold">Click to Replace</span>
                          </>
                        ) : (
                          <>
                            <div className="bg-slate-100 p-2 rounded-full mb-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                              <Upload className="w-6 h-6 text-slate-400 group-hover:text-sky-500 transition-colors" />
                            </div>
                            <span className="text-xs text-slate-600 group-hover:text-slate-900 font-medium">Click to upload vehicles</span>
                            <span className="text-[10px] text-slate-400 mt-1">.xlsx, .xls, .csv</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Consignment File Input */}
                  <div className="group">
                    <label htmlFor="consignment_file" className="block text-xs font-semibold text-slate-500 mb-2 group-hover:text-sky-600 transition-colors">Consignment file *</label>
                    <div 
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer overflow-hidden
                        ${consignmentFile 
                          ? 'border-emerald-400 bg-emerald-50/50' 
                          : 'border-slate-300 hover:border-sky-400 bg-white hover:bg-sky-50/30'
                        }`}
                    >
                      <input
                        id="consignment_file"
                        name="consignment_file"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        required
                        onChange={(e) => handleFileChange(e, setConsignmentFile)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      />
                      <div className="flex flex-col items-center justify-center text-center relative z-10 pointer-events-none">
                        {consignmentFile ? (
                          <>
                            <div className="bg-white p-2 rounded-full shadow-sm mb-2 relative">
                               <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                               <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-white">
                                 <CheckCircle2 className="w-3 h-3 text-white" />
                               </div>
                            </div>
                            <span className="text-sm font-semibold text-emerald-900 break-all px-2 line-clamp-1">{consignmentFile.name}</span>
                            <span className="text-xs text-emerald-600 mt-0.5 font-mono">{formatFileSize(consignmentFile.size)}</span>
                            <span className="text-[10px] text-emerald-500/70 mt-2 uppercase tracking-widest font-bold">Click to Replace</span>
                          </>
                        ) : (
                          <>
                             <div className="bg-slate-100 p-2 rounded-full mb-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                              <Upload className="w-6 h-6 text-slate-400 group-hover:text-sky-500 transition-colors" />
                            </div>
                            <span className="text-xs text-slate-600 group-hover:text-slate-900 font-medium">Click to upload orders</span>
                            <span className="text-[10px] text-slate-400 mt-1">.xlsx, .xls, .csv</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="bg-sky-50 border border-sky-100 rounded-lg p-3.5">
                    <p className="text-xs text-sky-800 leading-relaxed">
                      <strong>Process:</strong> We will automatically Upload, Map, and Normalize your data in background while you continue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium order-2 sm:order-1">Step 1 of 3 · Capture & store scenario inputs.</span>
            
            <div className="flex items-center gap-4 order-1 sm:order-2">
              <button 
                type="button"
                onClick={onSkipToOptimization}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:underline underline-offset-2 transition-all"
              >
                Already have a scenario? Skip
              </button>

              <button
                type="submit"
                className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-full text-white text-sm font-semibold shadow-lg shadow-slate-900/20 active:translate-y-px transition-all overflow-hidden"
              >
                <div className="flex items-center gap-2 relative z-10">
                  <span className="relative">Upload & Start Process</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};