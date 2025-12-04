import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, RefreshCw, AlertCircle, Calculator, Truck, Route, MapPin, TrendingUp, Table, ExternalLink, Timer, AlertTriangle, Box, X, BarChart2, Layout, Layers, ArrowRight, Database } from 'lucide-react';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface DropBreakupItem {
  reason_code: string;
  reason_label: string;
  dropped_count: number;
  pct_of_dropped: number;
  pct_of_planned: number;
}

interface WebhookResponseItem {
  success: boolean;
  request_id: string;
  hub_code: string;
  summary: {
    total_trips: number;
    total_distance_km: number;
    avg_trip_distance_km: number;
    total_trip_hours: number;
    avg_trip_hours: number;
    total_consignments_planned: number;
    total_consignments_served: number;
    total_consignments_dropped: number;
    avg_stops_per_trip: number;
  };
  trip_matrix: any[];
  drop_breakup: DropBreakupItem[];
}

interface DetailedMetrics {
  id: string;
  hub: string;
  
  totalTrips: number;
  avgDistance: number; 
  avgDistanceStr: string;
  totalStops: number; 
  avgConsignments: number; 
  avgConsignmentsStr: string;
  avgTripTimeStr: string; // formatted HH:MM
  
  totalDrops: number;
  dropSplit: number;
  dropSplitStr: string; // percentage
  dropReasons: { reason: string; count: number }[];
  
  isMock?: boolean;
}

type AnalysisMode = 'SINGLE' | 'COMPARE';

interface AnalysisPageProps {
  initialScenario?: string;
}

// ----------------------------------------------------------------------
// Mock Data (Fallback for CORS issues)
// ----------------------------------------------------------------------


export const AnalysisPage: React.FC<AnalysisPageProps> = ({ initialScenario }) => {
  const [mode, setMode] = useState<AnalysisMode>('SINGLE');
  
  // Inputs - initialize with prop if available
  const [searchInput, setSearchInput] = useState(initialScenario || ''); 
  const [searchTags, setSearchTags] = useState<string[]>([]); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [metricsData, setMetricsData] = useState<DetailedMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Helper to format hours
  const formatHoursToHHMM = (decimalHours: number) => {
    if (isNaN(decimalHours)) return "0h 0m";
    const hrs = Math.floor(decimalHours);
    const mins = Math.round((decimalHours - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  // Core Fetch Logic
const fetchScenarioData = async (scenarioName: string): Promise<DetailedMetrics | null> => {
  let item: WebhookResponseItem | undefined;
  let isMock = false;

  try {
    // Attempt to fetch from real webhook (Production URL)
    const response = await fetch('https://wbdemo.shipsy.io/webhook/RPO', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ request_id: scenarioName }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const jsonResponse: any = await response.json();

    // Handle multiple server shapes:
    // 1) An array of items: [ { ... } ]
    // 2) A wrapper object with data array: { data: [ { ... } ] }
    // 3) A single object: { ... }
    let candidate: any = null;
    if (Array.isArray(jsonResponse)) {
      candidate = jsonResponse.length > 0 ? jsonResponse[0] : undefined;
    } else if (jsonResponse && Array.isArray(jsonResponse.data)) {
      candidate = jsonResponse.data.length > 0 ? jsonResponse.data[0] : undefined;
    } else {
      candidate = jsonResponse;
    }

    item = candidate;

  } catch (error) {
    // Gracefully handle CORS/Network errors by using simulation data
    console.info(`[Info] Network request blocked or failed for ${scenarioName}. Switching to Simulation Mode.`, error);

    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 600));

    // Use the hardcoded response but override ID to match request for UI consistency
    if (typeof (global as any).MOCK_RESPONSE_DATA !== 'undefined') {
      item = {
        ...(global as any).MOCK_RESPONSE_DATA,
        request_id: scenarioName,
      };
      isMock = true;
    } else {
      // If MOCK_RESPONSE_DATA isn't defined, return null (and allow upstream error handling)
      console.warn('[Info] MOCK_RESPONSE_DATA not defined; cannot fallback to mock.');
      return null;
    }
  }

  if (!item) return null;

  // If successful=false comes from the API (not mock), ignore it so we can error out
  if (item.success === false && !isMock) {
    console.warn(`API returned success: false for ${scenarioName}`);
    return null;
  }

  const summary = item.summary;
  if (!summary) return null;

  const totalPlanned = summary.total_consignments_planned || 1;
  const dropSplit = (summary.total_consignments_dropped || 0) / totalPlanned * 100;

  return {
    id: item.request_id || scenarioName,
    hub: item.hub_code || 'N/A',
    totalTrips: summary.total_trips || 0,
    avgDistance: summary.avg_trip_distance_km || 0,
    avgDistanceStr: (summary.avg_trip_distance_km || 0).toFixed(2),
    totalStops: summary.total_consignments_served || 0,
    avgConsignments: summary.avg_stops_per_trip || 0,
    avgConsignmentsStr: (summary.avg_stops_per_trip || 0).toFixed(1),
    avgTripTimeStr: formatHoursToHHMM(summary.avg_trip_hours || 0),

    totalDrops: summary.total_consignments_dropped || 0,
    dropSplit: dropSplit,
    dropSplitStr: dropSplit.toFixed(1),
    dropReasons: (item.drop_breakup || []).map((d: any) => ({
      reason: d.reason_label || d.reason_code,
      count: d.dropped_count || 0
    })).sort((a: any, b: any) => b.count - a.count),

    isMock
  };
};

  // Execution Logic (separated from event handler)
  const executeSearch = useCallback(async (scenarios: string[]) => {
    if (scenarios.length === 0) return;

    setIsLoading(true);
    setError(null);
    setMetricsData([]);
    setHasSearched(true);

    try {
      const promises = scenarios.map(name => fetchScenarioData(name));
      const results = await Promise.all(promises);
      const validResults = results.filter(Boolean) as DetailedMetrics[];
      
      if (validResults.length === 0) {
        throw new Error("Could not retrieve data. Please check Scenario Name.");
      }

      setMetricsData(validResults);

      if (mode === 'COMPARE') {
        setSearchInput('');
      }

    } catch (err: any) {
      setError(err.message || "Failed to fetch analysis data.");
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  const handleFetchData = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    let scenariosToFetch: string[] = [];
    if (mode === 'SINGLE') {
      if (!searchInput.trim()) return;
      scenariosToFetch = [searchInput.trim()];
    } else {
      const currentInput = searchInput.trim();
      scenariosToFetch = [...searchTags];
      if (currentInput && !scenariosToFetch.includes(currentInput)) {
        scenariosToFetch.push(currentInput);
        handleAddTag();
      }
    }
    
    executeSearch(scenariosToFetch);
  };

  // Auto-Fetch on Mount if initialScenario is present
  useEffect(() => {
    if (initialScenario && !hasSearched) {
      setSearchInput(initialScenario);
      executeSearch([initialScenario]);
    }
  }, [initialScenario, executeSearch, hasSearched]);

  const handleAddTag = () => {
    if (searchInput.trim() && !searchTags.includes(searchInput.trim())) {
      setSearchTags([...searchTags, searchInput.trim()]);
      setSearchInput('');
    }
  };

  const removeTag = (tag: string) => {
    setSearchTags(searchTags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (mode === 'COMPARE') {
        handleAddTag();
      } else {
        handleFetchData();
      }
    }
  };

  const bestMetrics = useMemo(() => {
    if (metricsData.length < 2 || mode !== 'COMPARE') return null;
    return {
      minDistance: Math.min(...metricsData.map(d => d.avgDistance)),
      minDrops: Math.min(...metricsData.map(d => d.totalDrops)),
      minTrips: Math.min(...metricsData.map(d => d.totalTrips)),
      maxConsignments: Math.max(...metricsData.map(d => d.avgConsignments))
    };
  }, [metricsData, mode]);

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Analysis & Comparison</h1>
        <p className="text-slate-500">Analyze a single run or benchmark multiple scenarios to find the best strategy.</p>
      </div>

      {/* Config Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        
        {/* Mode Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => { setMode('SINGLE'); setSearchInput(''); setMetricsData([]); setHasSearched(false); }}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${mode === 'SINGLE' ? 'bg-white text-indigo-600 border-b-2 border-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Layout className="w-4 h-4" />
            Single Scenario
          </button>
          <button
            onClick={() => { setMode('COMPARE'); setSearchInput(''); setMetricsData([]); setHasSearched(false); }}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${mode === 'COMPARE' ? 'bg-white text-indigo-600 border-b-2 border-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Layers className="w-4 h-4" />
            Compare Scenarios
          </button>
        </div>

        <div className="p-8">
          <div className="max-w-3xl mx-auto">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {mode === 'SINGLE' ? 'Scenario Name' : 'Scenario Names (Add Multiple)'}
            </label>
            
            <div className="relative group">
              {mode === 'SINGLE' ? (
                // Single Mode Input
                <div className="relative">
                   <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. IDBtest3"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all group-hover:bg-white"
                  />
                  <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
              ) : (
                // Compare Mode Tag Input
                <div className="flex flex-wrap items-center gap-2 w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[48px] focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  
                  {searchTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-sm font-medium">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleAddTag}
                    placeholder={searchTags.length === 0 ? "Type scenario & Press Enter..." : "Add another..."}
                    className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 min-w-[150px]"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={(e) => handleFetchData(e)}
                disabled={isLoading || (mode === 'COMPARE' && searchTags.length === 0 && !searchInput) || (mode === 'SINGLE' && !searchInput)}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (mode === 'COMPARE' ? <BarChart2 className="w-4 h-4" /> : <Search className="w-4 h-4" />)}
                {isLoading ? 'Fetching Analysis...' : (mode === 'COMPARE' ? 'Compare Scenarios' : 'Analyze Scenario')}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in max-w-3xl mx-auto">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* No Results State */}
      {hasSearched && !isLoading && metricsData.length === 0 && !error && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-500 animate-in fade-in">
          <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No Scenarios Found</h3>
          <p className="text-sm">We couldn't retrieve data for the requested scenario(s).</p>
        </div>
      )}

      {/* SINGLE SCENARIO DASHBOARD */}
      {mode === 'SINGLE' && metricsData.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
           <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg border-b border-slate-200 pb-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            Scenario Overview: <span className="text-indigo-600 ml-2 font-mono">{metricsData[0].id}</span>
            <span className="text-xs text-slate-400 ml-auto font-mono bg-slate-100 px-2 py-1 rounded">{metricsData[0].hub}</span>
            {metricsData[0].isMock && (
               <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                 <Database className="w-3 h-3" /> Simulated Data
               </span>
            )}
          </div>

          <div className="grid gap-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <Route className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">No. of Trips</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{metricsData[0].totalTrips}</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Avg Distance</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{metricsData[0].avgDistanceStr} <span className="text-sm text-slate-400 font-normal">km</span></div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Stops Served</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{metricsData[0].totalStops}</div>
              </div>

               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <Box className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Avg Stops / Trip</span>
                </div>
                <div className="text-3xl font-bold text-emerald-600">{metricsData[0].avgConsignmentsStr}</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                 <div className="flex items-center gap-2 mb-4 text-slate-500">
                  <Timer className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase">Avg Trip Time</span>
                </div>
                <div className="text-4xl font-bold text-slate-800">{metricsData[0].avgTripTimeStr}</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-slate-500">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase">Drop Analytics</span>
                  </div>
                  <div className="text-xs font-mono bg-red-50 text-red-600 px-2 py-1 rounded">
                    Split: {metricsData[0].dropSplitStr}%
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Total Dropped</div>
                    <div className="text-3xl font-bold text-red-600">{metricsData[0].totalDrops}</div>
                  </div>
                  
                  <div className="h-12 w-px bg-slate-100"></div>

                  <div className="flex-1">
                     <div className="text-sm text-slate-500 mb-2">Top Drop Reasons</div>
                     <div className="space-y-2">
                       {metricsData[0].dropReasons.slice(0, 3).map((dr, idx) => (
                         <div key={idx} className="flex items-center justify-between text-sm">
                           <span className="text-slate-700 truncate max-w-[200px]" title={dr.reason}>{dr.reason}</span>
                           <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 rounded">{dr.count}</span>
                         </div>
                       ))}
                       {metricsData[0].dropReasons.length === 0 && (
                         <span className="text-sm text-slate-400 italic">No drops recorded.</span>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {metricsData[0].dropReasons.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Full Drop Reason Breakdown
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="text-slate-500 bg-white border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 font-medium">Reason</th>
                      <th className="px-6 py-3 font-medium text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricsData[0].dropReasons.map((dr, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-6 py-3 text-slate-700">{dr.reason}</td>
                        <td className="px-6 py-3 text-right font-mono text-slate-900">{dr.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPARISON MATRIX */}
      {mode === 'COMPARE' && metricsData.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
          
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg border-b border-slate-200 pb-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            Scenario Comparison Matrix
            {metricsData.some(m => m.isMock) && (
               <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                 <Database className="w-3 h-3" /> Includes Simulated Data
               </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm text-left bg-white">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Metric</th>
                  {metricsData.map((scenario, idx) => (
                    <th key={scenario.id} className="px-6 py-4 min-w-[200px]">
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${idx === 0 ? 'text-indigo-600' : 'text-slate-800'}`}>
                          {scenario.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-1">{scenario.hub}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                
                {/* Trips */}
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <Route className="w-4 h-4 text-slate-400" /> Total Trips
                  </td>
                  {metricsData.map(s => (
                    <td key={s.id} className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{s.totalTrips}</span>
                        {bestMetrics && s.totalTrips === bestMetrics.minTrips && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded font-bold">LOWEST</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Distance */}
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-400" /> Avg Distance
                  </td>
                  {metricsData.map(s => (
                    <td key={s.id} className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{s.avgDistanceStr} <span className="text-sm font-normal text-slate-400">km</span></span>
                        {bestMetrics && s.avgDistance === bestMetrics.minDistance && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded font-bold">BEST</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Avg Consignments */}
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <Box className="w-4 h-4 text-slate-400" /> Avg Stops / Trip
                  </td>
                  {metricsData.map(s => (
                    <td key={s.id} className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{s.avgConsignmentsStr}</span>
                        {bestMetrics && s.avgConsignments === bestMetrics.maxConsignments && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded font-bold">HIGHEST</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Trip Time */}
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <Timer className="w-4 h-4 text-slate-400" /> Avg Trip Time
                  </td>
                  {metricsData.map(s => (
                    <td key={s.id} className="px-6 py-4 font-mono text-slate-600">
                      {s.avgTripTimeStr}
                    </td>
                  ))}
                </tr>

                {/* Drops */}
                <tr className="hover:bg-slate-50/50 bg-red-50/30">
                  <td className="px-6 py-4 font-medium flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Total Drops
                  </td>
                  {metricsData.map(s => (
                    <td key={s.id} className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${s.totalDrops > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {s.totalDrops}
                        </span>
                        <span className="text-xs text-slate-500">({s.dropSplitStr}%)</span>
                         {bestMetrics && s.totalDrops === bestMetrics.minDrops && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded font-bold">LOWEST</span>
                        )}
                      </div>
                      {s.dropReasons.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {s.dropReasons.slice(0, 2).map((dr, i) => (
                            <div key={i} className="text-[10px] flex justify-between text-slate-500">
                              <span className="truncate max-w-[120px]" title={dr.reason}>{dr.reason}</span>
                              <span className="font-semibold">{dr.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
