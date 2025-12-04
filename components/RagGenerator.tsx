import React, { useState, useEffect } from 'react';
import { JsonDisplay } from './JsonDisplay';
import { generateRoutingJson } from '../services/geminiService';
import { RagContext, AppState } from '../types';
import { Bot, FileJson, LayoutTemplate, Play, RefreshCw, AlertCircle, Database, CheckCircle2 } from 'lucide-react';
import { HARDCODED_TRANSCRIPT, HARDCODED_SCHEMA, HARDCODED_TEMPLATE } from '../data/hardcodedData';

export const RagGenerator: React.FC = () => {
  const [context, setContext] = useState<RagContext>({
    transcript: null,
    schema: null,
    template: null
  });
  
  const [useCase, setUseCase] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load hardcoded data on mount
    setContext({
      transcript: HARDCODED_TRANSCRIPT,
      schema: HARDCODED_SCHEMA,
      template: HARDCODED_TEMPLATE
    });
  }, []);

  const canGenerate = context.transcript && context.schema && context.template && useCase.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setAppState(AppState.PROCESSING);
    setError(null);
    setResult(null);

    try {
      const jsonResult = await generateRoutingJson(context, useCase);
      setResult(jsonResult);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      setAppState(AppState.ERROR);
      setError(err.message || "An unexpected error occurred while generating the JSON.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8">
        
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 border border-indigo-100 rounded-2xl mb-4">
            <Bot className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            RAG Routing Generator
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            RAG System initialized with Shipment Transcript, Schema Definitions, and Routing Templates.
          </p>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Context Status & Input */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Context Status Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" />
                Knowledge Base Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-emerald-900 font-medium">Meeting Transcript</span>
                  </div>
                  <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-emerald-900 font-medium">Schema Definition</span>
                  </div>
                  <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-emerald-900 font-medium">Output Template</span>
                  </div>
                  <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded">Active</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
               <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-indigo-500" />
                User Scenario
              </h2>
              <textarea
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                placeholder="e.g., I need to optimize for a distribution scenario where we want to equalize vehicle usage based on time..."
                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400"
              />
              
              <div className="mt-6">
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || appState === AppState.PROCESSING}
                  className={`w-full py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                    ${canGenerate 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-200' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                    }`}
                >
                  {appState === AppState.PROCESSING ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Analyzing & Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      Generate JSON
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full min-h-[600px] flex flex-col shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <FileJson className="w-5 h-5 text-emerald-500" />
                Generated Output
              </h2>

              <div className="flex-1">
                {appState === AppState.IDLE && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Bot className="w-16 h-16 opacity-20" />
                    <p>Enter a use case to generate the configuration...</p>
                  </div>
                )}

                {appState === AppState.PROCESSING && (
                  <div className="h-full flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-indigo-600 font-medium text-lg">Consulting Knowledge Base</h3>
                      <p className="text-slate-500 text-sm">Searching transcript for matching rules...</p>
                    </div>
                  </div>
                )}

                {appState === AppState.ERROR && (
                  <div className="h-full flex flex-col items-center justify-center text-red-500 space-y-4 bg-red-50 border border-red-100 rounded-xl p-8">
                    <AlertCircle className="w-12 h-12" />
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-2">Generation Failed</h3>
                      <p className="text-sm text-red-400 max-w-md">{error}</p>
                    </div>
                  </div>
                )}

                {appState === AppState.SUCCESS && result && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                    <div className="flex-1 overflow-auto max-h-[500px]">
                       <JsonDisplay data={result} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};