import React, { useState } from 'react';
import { PocForm } from './components/PocForm';
import { RunTripForm } from './components/RunTripForm';
import { OutputDashboard } from './components/OutputDashboard';
import { MappingPage } from './components/MappingPage'; // Import new component

import { AnalysisPage } from './components/AnalysisPage';
import { RagGenerator } from './components/RagGenerator';
import { Check, Loader2, CheckCircle2, XCircle, LayoutDashboard, PlusCircle, Settings2 } from 'lucide-react';
import { IntakeStatus } from './types';

type WorkflowStep = 'STEP_1_POC' | 'STEP_2_RUN_TRIP';
type AppView = 'WIZARD' | 'ANALYSIS' | 'MAPPING'; // Add MAPPING type

const App: React.FC = () => {
  // To enable RAG Generator, set this to true manually. Currently hidden as per requirement.
  const SHOW_RAG_GENERATOR = false; 

  const [view, setView] = useState<AppView>('WIZARD');
  const [step, setStep] = useState<WorkflowStep>('STEP_1_POC');
  const [workflowData, setWorkflowData] = useState<{ scenarioName?: string }>({});
  
  // Background Intake Process State
  const [intakeStatus, setIntakeStatus] = useState<IntakeStatus>('IDLE');
  const [intakeStage, setIntakeStage] = useState<string>('');

  // ----------------------------------------------------------------------
  // Background Intake Logic (Lifted from PocForm)
  // ----------------------------------------------------------------------

  const runWebhookStep = async (url: string, payload: any, stageName: string, isJson: boolean = true) => {
    setIntakeStage(stageName);
    
    const options: RequestInit = {
      method: "POST",
      body: isJson ? JSON.stringify(payload) : payload,
    };

    if (isJson) {
      options.headers = {
        'Content-Type': 'application/json',
      };
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Step '${stageName}' failed: ${response.status} ${response.statusText}`);
    }
    
    return response;
  };

  const runDelay = async (seconds: number, nextStepLabel: string) => {
    for (let i = seconds; i > 0; i--) {
      setIntakeStage(`Waiting for ${nextStepLabel}... ${i}s`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const startIntakeProcess = async (formData: FormData, scenarioName: string) => {
    // 1. Update Global State
    setWorkflowData({ scenarioName });
    setIntakeStatus('RUNNING');
    
    // 2. Immediate Navigation to Step 2
    setStep('STEP_2_RUN_TRIP');

    // 3. Start Background Chain (Fire & Forget)
    try {
      // Step A: Upload
      await runWebhookStep(
        "https://wbdemo.shipsy.io/webhook/poc-scenario-intake", 
        formData, 
        "Uploading Files...", 
        false
      );

      await runDelay(30, "Mappings");

      // Step B: Mapping
      await runWebhookStep(
        "https://wbdemo.shipsy.io/webhook/mapping", 
        { scenario_name: scenarioName }, 
        "Generating Mappings..."
      );

      await runDelay(30, "Vehicle Normalization");

      // Step C: Normalize VH
      await runWebhookStep(
        "https://wbdemo.shipsy.io/webhook/normalizevh", 
        { scenario_name: scenarioName }, 
        "Normalizing Vehicles..."
      );

      await runDelay(30, "Consignment Normalization");

      // Step D: Normalize CN
      await runWebhookStep(
        "https://wbdemo.shipsy.io/webhook/normalizecn", 
        { scenario_name: scenarioName }, 
        "Normalizing Consignments..."
      );

      setIntakeStatus('COMPLETED');
      setIntakeStage('All data processed successfully.');

    } catch (err: any) {
      console.error("Intake Workflow Error:", err);
      setIntakeStatus('ERROR');
      setIntakeStage(`Error: ${err.message}`);
    }
  };


  // ----------------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------------

  if (SHOW_RAG_GENERATOR) {
    return <RagGenerator />;
  }

  const steps = [
    { id: 'STEP_1_POC', label: 'Scenario Intake' },
    { id: 'STEP_2_RUN_TRIP', label: 'Run Optimization' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 overflow-x-hidden relative">
      {/* Background Ambience - Light Mode */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-200/40 rounded-full blur-[120px]" />
      </div>

      {/* Global Intake Status Toast (Floating) */}
      {intakeStatus !== 'IDLE' && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-6 fade-in duration-500">
          <div className={`
            flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md
            ${intakeStatus === 'RUNNING' ? 'bg-white/90 border-sky-200' : ''}
            ${intakeStatus === 'COMPLETED' ? 'bg-emerald-50/90 border-emerald-200' : ''}
            ${intakeStatus === 'ERROR' ? 'bg-red-50/90 border-red-200' : ''}
          `}>
            {intakeStatus === 'RUNNING' && <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />}
            {intakeStatus === 'COMPLETED' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            {intakeStatus === 'ERROR' && <XCircle className="w-5 h-5 text-red-500" />}
            
            <div className="flex flex-col">
              <span className={`text-xs font-bold uppercase tracking-wide
                ${intakeStatus === 'RUNNING' ? 'text-sky-600' : ''}
                ${intakeStatus === 'COMPLETED' ? 'text-emerald-600' : ''}
                ${intakeStatus === 'ERROR' ? 'text-red-600' : ''}
              `}>
                {intakeStatus === 'RUNNING' ? 'Background Process' : 'Process Finished'}
              </span>
              <span className="text-sm font-medium text-slate-700 max-w-[200px] truncate">
                {intakeStage}
              </span>
            </div>
            
            {intakeStatus === 'RUNNING' && (
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse ml-2" />
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        
        {/* Top Header & Navigation */}
        <div className="mb-12 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6 px-4 py-1.5 bg-white/80 border border-slate-200 rounded-md shadow-sm backdrop-blur-md">
             <img src="https://shipsy-public-assets.s3.amazonaws.com/generic/file-d5928432-b9a1-48fd-bf79-0bca84663c45.jpeg" alt="Shipsy" className="h-8 rounded-md" />
            <span className="w-1 h-1 rounded-md bg-slate-300" />
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Route Optimizer POC</span>
          </div>

          <div className="bg-slate-200/50 p-1 rounded-xl flex items-center gap-1 shadow-inner">
            <button
              onClick={() => setView('WIZARD')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'WIZARD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <PlusCircle className="w-4 h-4" />
              Create Scenario
            </button>
            <button
              onClick={() => setView('MAPPING')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'MAPPING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Settings2 className="w-4 h-4" />
              Field Mapping
            </button>            
            <button
              onClick={() => setView('ANALYSIS')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'ANALYSIS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Analysis Dashboard
            </button>
          </div>
        </div>

        {/* Wizard Stepper (Only visible in Wizard Mode) */}
        {view === 'WIZARD' && (
          <div className="mb-10 flex items-center justify-center gap-4 text-sm font-medium animate-in fade-in slide-in-from-top-4">
            {steps.map((s, idx) => {
              const isActive = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 transition-colors duration-300 ${isActive ? 'text-slate-900' : isCompleted ? 'text-slate-500' : 'text-slate-400'}`}>
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 shadow-sm
                      ${isActive 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-200 scale-110' 
                        : isCompleted 
                          ? 'bg-white border-slate-200 text-emerald-500' 
                          : 'bg-white border-slate-200 text-slate-400'}
                    `}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <span>{idx + 1}</span>}
                    </div>
                    <span className={`${isActive ? 'opacity-100 font-semibold' : 'opacity-70'} hidden sm:block`}>{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-8 sm:w-16 h-[2px] rounded-full transition-colors duration-500 ${idx < currentStepIndex ? 'bg-indigo-500/30' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Content Area */}
        <div className="transition-all duration-500 ease-in-out min-h-[500px]">
          {view === 'WIZARD' && (
            <>
              {step === 'STEP_1_POC' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <PocForm 
                    onStartProcess={startIntakeProcess} 
                    onSkipToOptimization={() => setStep('STEP_2_RUN_TRIP')}
                  />
                </div>
              )}

              {step === 'STEP_2_RUN_TRIP' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <RunTripForm 
                    initialScenarioName={workflowData.scenarioName}
                    intakeStatus={intakeStatus}
                    onNext={() => setView('ANALYSIS')}
                    onBack={() => setStep('STEP_1_POC')}
                  />
                </div>
              )}
            </>
          )}

          {view === 'MAPPING' && (
            <MappingPage />
          )}
          {view === 'ANALYSIS' && (
            <AnalysisPage initialScenario={workflowData.scenarioName} />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
