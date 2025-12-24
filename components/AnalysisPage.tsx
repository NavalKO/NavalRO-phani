import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, AlertCircle, Calculator, Truck, Route, MapPin, TrendingUp, Table, ExternalLink, Timer, AlertTriangle, Box, X, BarChart2, Layout, Layers, ArrowRight, Database, Terminal, ChevronDown, ChevronUp, PieChart, Info, Activity } from 'lucide-react';

// ----------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------

const API_ENDPOINT = "https://wbdemo.shipsy.io/webhook/RPO";

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
  success?: boolean;
  message?: string;
  request_id?: string;
  hub_code?: string;
  summary?: {
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
  trip_matrix?: any[];
  drop_breakup?: DropBreakupItem[];
  analysis_metrics?: {
    vehicles: {
      used_vehicles: number | null;
      total_vehicles: number | null;
      used_vehicle_ratio: number | null;
      vehicles_doing_multi_trips: number | null;
    };
    trips: {
      total_trips: number | null;
      avg_trip_duration_hours: number | null;
      min_trip_duration_hours: number | null;
      max_trip_duration_hours: number | null;
      avg_trip_distance_km: number | null;
      min_trip_distance_km: number | null;
      max_trip_distance_km: number | null;
    };
    consignments_and_stops: {
      avg_cn_count: number | null;
      min_cn_count: number | null;
      max_cn_count: number | null;
      avg_stop_count: number | null;
      min_stop_count: number | null;
      max_stop_count: number | null;
    };
    utilisation: {
      overall_weight_util_pct: number | null;
      overall_vol_util_pct: number | null;
      min_weight_util_pct: number | null;
      max_weight_util_pct: number | null;
      min_vol_util_pct: number | null;
      max_vol_util_pct: number | null;
    };
    product_value: {
      avg_product_value: number | null;
      min_product_value: number | null;
      max_product_value: number | null;
    };
    data_gaps: string[];
  };
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
  avgTripTimeStr: string;
  
  totalDrops: number;
  dropSplit: number;
  dropSplitStr: string;
  dropReasons: { reason: string; count: number }[];

  // Extended Analysis Metrics
  usedVehicles: number | null;
  totalVehicles: number | null;
  usedVehicleRatio: number | null;
  multiTripVehicles: number | null;
  weightUtilPct: number | null;
  volUtilPct: number | null;
  dataGaps: string[];
  
  isMock?: boolean;
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
}

type AnalysisMode = 'SINGLE' | 'COMPARE';

interface AnalysisPageProps {
  initialScenario?: string;
}

// ----------------------------------------------------------------------
// Mock Data (Updated to match new structure)
// ----------------------------------------------------------------------
const MOCK_RESPONSE_DATA: WebhookResponseItem = {
  "success": true,
  "request_id": "IDBtest3",
  "hub_code": "PALAK",
  "summary": {
    "total_trips": 1,
    "total_distance_km": 0.06,
    "avg_trip_distance_km": 0.06,
    "total_trip_hours": 2.11,
    "avg_trip_hours": 2.11,
    "total_consignments_planned": 13,
    "total_consignments_served": 10,
    "total_consignments_dropped": 3,
    "avg_stops_per_trip": 10
  },
  "analysis_metrics": {
    "vehicles": { "used_vehicles": 1, "total_vehicles": 5, "used_vehicle_ratio": 0.2, "vehicles_doing_multi_trips": 0 },
    "trips": { "total_trips": 1, "avg_trip_duration_hours": 2.11, "min_trip_duration_hours": 2.11, "max_trip_duration_hours": 2.11, "avg_trip_distance_km": 0.06, "min_trip_distance_km": 0.06, "max_trip_distance_km": 0.06 },
    "consignments_and_stops": { "avg_cn_count": 10, "min_cn_count": 10, "max_cn_count": 10, "avg_stop_count": 10, "min_stop_count": 10, "max_stop_count": 10 },
    "utilisation": { "overall_weight_util_pct": 45.5, "overall_vol_util_pct": 32.1, "min_weight_util_pct": 45.5, "max_weight_util_pct": 45.5, "min_vol_util_pct": 32.1, "max_vol_util_pct": 32.1 },
    "product_value": { "avg_product_value": null, "min_product_value": null, "max_product_value": null },
    "data_gaps": ["Capacity data missing from file upload.", "Product value field not provided."]
  }
};

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ initialScenario }) => {
  const [mode, setMode] = useState<AnalysisMode>('SINGLE');
  const [searchInput, setSearchInput] = useState(initialScenario || ''); 
  const [searchTags, setSearchTags] = useState<string[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [metricsData, setMetricsData] = useState<DetailedMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    }]);
  };

  const formatHoursToHHMM = (decimalHours: number | null) => {
    if (decimalHours === null || isNaN(decimalHours)) return "0h 0m";
    const hrs = Math.floor(decimalHours);
    const mins = Math.round((decimalHours - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  const fetchScenarioData = async (scenarioName: string): Promise<DetailedMetrics | null> => {
    let item: WebhookResponseItem | undefined;
    let isMock = false;

    addLog('info', `Fetching: ${scenarioName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); 

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ request_id: scenarioName }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        let jsonResponse;
        const textResponse = await response.text();
        
        try {
          jsonResponse = JSON.parse(textResponse);
        } catch (e) {
          addLog('error', `Response is not valid JSON for ${scenarioName}`);
          throw new Error("Invalid JSON response");
        }

        addLog('success', `HTTP 200 OK for ${scenarioName}`);
        
        if (Array.isArray(jsonResponse)) {
          item = jsonResponse[0];
        } else {
          item = jsonResponse;
        }

        if (!item || item.success === false) {
           throw new Error(item?.message || "Scenario not found");
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      addLog('warning', `${scenarioName}: ${error.message}. Using fallback.`);
      item = { ...MOCK_RESPONSE_DATA, request_id: scenarioName };
      isMock = true;
    }

    if (!item || !item.summary) return null;

    const summary = item.summary;
    const analysis = item.analysis_metrics;
    const totalPlanned = summary.total_consignments_planned || 1;
    const dropSplit = (summary.total_consignments_dropped / totalPlanned) * 100;

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
      dropReasons: (item.drop_breakup || []).map(d => ({
        reason: d.reason_label || d.reason_code,
        count: d.dropped_count
      })).sort((a, b) => b.count - a.count),
      
      // Extended analysis metrics
      usedVehicles: analysis?.vehicles.used_vehicles ?? null,
      totalVehicles: analysis?.vehicles.total_vehicles ?? null,
      usedVehicleRatio: analysis?.vehicles.used_vehicle_ratio ?? null,
      multiTripVehicles: analysis?.vehicles.vehicles_doing_multi_trips ?? null,
      weightUtilPct: analysis?.utilisation.overall_weight_util_pct ?? null,
      volUtilPct: analysis?.utilisation.overall_vol_util_pct ?? null,
      dataGaps: analysis?.data_gaps || [],
      
      isMock
    };
  };

  const executeSearch = useCallback(async (scenarios: string[]) => {
    if (scenarios.length === 0) return;

    setIsLoading(true);
    setError(null);
    setMetricsData([]);
    setHasSearched(true);
    setLogs([]); 
    addLog('info', `Starting analysis for: ${scenarios.join(', ')}`);

    try {
      const results = await Promise.all(scenarios.map(name => fetchScenarioData(name)));
      if (!isMounted.current) return;

      const validResults = results.filter(Boolean) as DetailedMetrics[];
      if (validResults.length === 0) {
        setError("Could not retrieve scenario data.");
      } else {
        setMetricsData(validResults);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [mode]);

  const handleFetchData = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let scenariosToFetch = mode === 'SINGLE' ? [searchInput.trim()] : [...searchTags];
    if (mode === 'SINGLE' && !searchInput.trim()) return;
    executeSearch(scenariosToFetch);
  };

  const handleAddTag = () => {
    if (searchInput.trim() && !searchTags.includes(searchInput.trim())) {
      setSearchTags([...searchTags, searchInput.trim()]);
      setSearchInput('');
    }
  };

  const removeTag = (tag: string) => setSearchTags(searchTags.filter(t => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (mode === 'COMPARE') handleAddTag();
      else handleFetchData();
    }
  };

  const bestMetrics = useMemo(() => {
    if (metricsData.length < 2 || mode !== 'COMPARE') return null;
    return {
      minDistance: Math.min(...metricsData.map(d => d.avgDistance)),
      minDrops: Math.min(...metricsData.map(d => d.totalDrops)),
      minTrips: Math.min(...metricsData.map(d => d.totalTrips)),
      maxConsignments: Math.max(...metricsData.map(d => d.avgConsignments)),
      maxWeightUtil: Math.max(...metricsData.filter(d => d.weightUtilPct !== null).map(d => d.weightUtilPct!))
    };
  }, [metricsData, mode]);

  return (
    <div className="w-full max-w-7xl mx-auto pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Analysis & Comparison</h1>
        <p className="text-slate-500">Benchmark scenarios and analyze optimization efficiency metrics.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button onClick={() => setMode('SINGLE')} className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${mode === 'SINGLE' ? 'bg-white text-indigo-600 border-b-2 border-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Layout className="w-4 h-4" /> Single Scenario
          </button>
          <button onClick={() => setMode('COMPARE')} className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${mode === 'COMPARE' ? 'bg-white text-indigo-600 border-b-2 border-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Layers className="w-4 h-4" /> Compare Scenarios
          </button>
        </div>

        <div className="p-8">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <input
                type="text" value={searchInput} onKeyDown={handleKeyDown}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={mode === 'SINGLE' ? "Scenario Request ID..." : "Add Request ID & Press Enter..."}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <button onClick={() => handleFetchData()} disabled={isLoading} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2 justify-center shadow-lg shadow-indigo-600/20 disabled:opacity-50 min-w-[160px]">
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              {isLoading ? 'Running Analysis...' : 'Fetch Data'}
            </button>
          </div>
          {mode === 'COMPARE' && searchTags.length > 0 && (
             <div className="max-w-3xl mx-auto mt-4 flex flex-wrap gap-2">
               {searchTags.map(tag => (
                 <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100 animate-in zoom-in-50">
                   {tag} <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                 </span>
               ))}
             </div>
          )}
        </div>
      </div>

      {hasSearched && !isLoading && metricsData.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
          
          {/* SINGLE VIEW */}
          {mode === 'SINGLE' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Trips Created", value: metricsData[0].totalTrips, icon: Route, color: "indigo" },
                  { label: "Avg Distance", value: `${metricsData[0].avgDistanceStr} km`, icon: TrendingUp, color: "blue" },
                  { label: "Avg Stops/Trip", value: metricsData[0].avgConsignmentsStr, icon: Box, color: "emerald" },
                  { label: "Stops Served", value: metricsData[0].totalStops, icon: MapPin, color: "sky" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                      <stat.icon className={`w-4 h-4 text-${stat.color}-500`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Efficiency & Util */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-indigo-500" /> Efficiency & Utilisation
                    </h3>
                    <div className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">Metrics Analysis</div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-tight">
                          <span>Weight Utilisation</span>
                          <span className="text-indigo-600">{metricsData[0].weightUtilPct ? `${metricsData[0].weightUtilPct}%` : 'N/A'}</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${metricsData[0].weightUtilPct || 0}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-tight">
                          <span>Volume Utilisation</span>
                          <span className="text-emerald-600">{metricsData[0].volUtilPct ? `${metricsData[0].volUtilPct}%` : 'N/A'}</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${metricsData[0].volUtilPct || 0}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4">
                        <Truck className="w-5 h-5 text-indigo-500" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Used Vehicle Ratio</div>
                          <div className="text-xl font-bold text-slate-900">
                            {metricsData[0].usedVehicles} / {metricsData[0].totalVehicles || 'N/A'}
                            {metricsData[0].usedVehicleRatio && <span className="text-sm font-medium text-slate-400 ml-2">({(metricsData[0].usedVehicleRatio * 100).toFixed(0)}%)</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Route className="w-5 h-5 text-emerald-500" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Multi-Trip Vehicles</div>
                          <div className="text-xl font-bold text-slate-900">{metricsData[0].multiTripVehicles ?? '0'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drop Reasons */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2 mb-6 text-red-600 border-b border-red-50 pb-4">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold text-slate-800">Dropped Orders</span>
                  </div>
                  <div className="mb-6 flex items-center justify-between">
                    <div className="text-4xl font-black text-red-500">{metricsData[0].totalDrops}</div>
                    <div className="text-right">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Planned Failure Split</div>
                       <div className="text-lg font-bold text-slate-700 font-mono">{metricsData[0].dropSplitStr}%</div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {metricsData[0].dropReasons.length > 0 ? metricsData[0].dropReasons.map((dr, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 truncate max-w-[140px]" title={dr.reason}>{dr.reason}</span>
                        <span className="bg-white px-2 py-1 rounded font-bold text-red-600 border border-red-100">{dr.count}</span>
                      </div>
                    )) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-slate-400 text-sm">No drop data available</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Gaps & Logic Notes */}
              {metricsData[0].dataGaps.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Info className="w-4 h-4" /> System Observation & Data Gaps
                  </h4>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {metricsData[0].dataGaps.map((gap, i) => (
                      <li key={i} className="flex gap-3 text-xs text-amber-700/80 leading-relaxed bg-white/50 p-3 rounded-xl border border-amber-100/50">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* COMPARE VIEW */}
          {mode === 'COMPARE' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b">
                  <tr>
                    <th className="px-6 py-5 sticky left-0 bg-slate-50 z-10">Metric Analysis</th>
                    {metricsData.map(s => (
                      <th key={s.id} className="px-6 py-5 min-w-[180px]">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-bold text-xs truncate max-w-[150px]" title={s.id}>{s.id}</span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">{s.hub}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-tighter sticky left-0 bg-white z-10">Efficiency Summary</td>
                    {metricsData.map(s => (
                      <td key={s.id} className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3 h-3 text-indigo-400" />
                            <span className="font-bold text-slate-800">{s.totalTrips} Trips</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Box className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs font-semibold">{s.avgConsignmentsStr} Stops/Trip</span>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-tighter sticky left-0 bg-white z-10">Distance Metrics</td>
                    {metricsData.map(s => (
                      <td key={s.id} className="px-6 py-4">
                         <div className="flex items-baseline gap-1">
                           <span className="text-lg font-black text-slate-800">{s.avgDistanceStr}</span>
                           <span className="text-[10px] text-slate-400 font-bold">km (avg)</span>
                         </div>
                         {bestMetrics && s.avgDistance === bestMetrics.minDistance && (
                           <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-1.5 rounded">Optimal</span>
                         )}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-tighter sticky left-0 bg-white z-10">Utilisation (%)</td>
                    {metricsData.map(s => (
                      <td key={s.id} className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-400">Weight</span>
                            <span className="font-black text-indigo-600">{s.weightUtilPct || '-'}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border">
                            <div className="h-full bg-indigo-500" style={{ width: `${s.weightUtilPct || 0}%` }} />
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-red-50/30">
                    <td className="px-6 py-4 font-bold text-red-700 text-[10px] uppercase tracking-tighter sticky left-0 bg-red-50/30 z-10">Reliability / Drops</td>
                    {metricsData.map(s => (
                      <td key={s.id} className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className={`text-xl font-black ${s.totalDrops > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{s.totalDrops}</span>
                           <span className="text-[10px] font-bold text-slate-400">({s.dropSplitStr}% loss)</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SYSTEM LOGS MODAL-LIKE DRAWER */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.1)] overflow-hidden">
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="w-full bg-slate-900 text-slate-400 px-6 py-3 flex items-center justify-between hover:text-white transition-colors border-t border-slate-800"
          >
            <div className="flex items-center gap-3 text-xs font-mono font-bold uppercase tracking-widest">
              <Terminal className="w-4 h-4 text-indigo-400" /> System Debug Console ({logs.length})
            </div>
            {showLogs ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          
          {showLogs && (
            <div className="h-64 bg-slate-900 p-6 overflow-y-auto font-mono text-[10px] leading-relaxed space-y-1 border-t border-slate-800">
              {logs.length === 0 && <div className="text-slate-600 italic">No events recorded. Waiting for fetch operation...</div>}
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-4 border-b border-slate-800/30 pb-1 mb-1">
                  <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className={`
                    ${log.type === 'error' ? 'text-red-400' : ''}
                    ${log.type === 'warning' ? 'text-amber-400' : ''}
                    ${log.type === 'success' ? 'text-emerald-400' : ''}
                    ${log.type === 'info' ? 'text-indigo-400' : ''}
                  `}>
                    <span className="font-bold opacity-70 uppercase mr-2 tracking-tighter">{log.type}:</span>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
