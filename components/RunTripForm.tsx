import React, { useState } from 'react';
import { Play, ArrowLeft, Settings, Map, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { IntakeStatus } from '../types';

interface RunTripFormProps {
  initialScenarioName?: string;
  intakeStatus: IntakeStatus;
  onNext: () => void;
  onBack: () => void;
}

export const RunTripForm: React.FC<RunTripFormProps> = ({ initialScenarioName = '', intakeStatus, onNext, onBack }) => {
  const [scenarioName, setScenarioName] = useState(initialScenarioName);
  const [hubCode, setHubCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('scenario_name', scenarioName || '');
    formData.append('hub_code', hubCode);

    try {
      const response = await fetch('https://wbdemo.shipsy.io/webhook/runtrip-html', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onNext();
      } else {
        alert('Failed to trigger optimization trip. Please try again.');
      }
    } catch (error) {
      console.error('Error triggering optimization:', error);
      alert('An error occurred while connecting to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const isBackgroundProcessing = intakeStatus === 'RUNNING';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Run Optimization</h1>
        <p className="text-slate-500">Configure execution parameters for your trip.</p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-white/60 ring-1 ring-slate-900/5 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden relative">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-700 text-sm">Execution Parameters</span>
          </div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Step 2 · Execute Trip</span>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            <div className="group">
              <label htmlFor="scenario_name" className="block text-xs font-semibold text-slate-500 mb-1.5 group-focus-within:text-emerald-600 transition-colors">Scenario Name *</label>
              <div className="relative">
                <input
                  id="scenario_name"
                  name="scenario_name"
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  required
                  placeholder="Confirm Scenario Name"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm transition-all"
                />
                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
            </div>
            
            <div className="group">
              <label htmlFor="hub_code" className="block text-xs font-semibold text-slate-500 mb-1.5 group-focus-within:text-emerald-600 transition-colors">Hub Code *</label>
              <div className="relative">
                <input
                  id="hub_code"
                  name="hub_code"
                  type="text"
                  value={hubCode}
                  onChange={(e) => setHubCode(e.target.value)}
                  required
                  placeholder="e.g. GWC_DOHA"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm transition-all"
                />
                <Map className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between gap-4 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex flex-col items-end">
                <button
                  type="submit"
                  disabled={isLoading || isBackgroundProcessing}
                  className={`
                    group relative inline-flex items-center gap-2 px-8 py-3 
                    rounded-full text-white text-sm font-semibold shadow-lg 
                    transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    ${isBackgroundProcessing 
                      ? 'bg-slate-400 shadow-none' 
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20 hover:shadow-emerald-500/30 active:translate-y-px'
                    }
                    ${isLoading ? 'cursor-wait' : ''}
                  `}
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Triggering...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative">{isBackgroundProcessing ? 'Waiting for Data...' : 'Run Optimization'}</span>
                      {isBackgroundProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    </>
                  )}
                </button>
                
                {isBackgroundProcessing && (
                   <span className="text-[10px] text-amber-600 mt-2 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    Step 1 (Intake) is still processing. Please wait.
                   </span>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
