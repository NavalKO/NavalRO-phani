import React, { useState, useMemo, useEffect } from 'react';
import { Activity, ExternalLink, FileSpreadsheet, RefreshCw, Table, Calculator, AlertCircle, TrendingUp, BarChart3, Truck, MapPin, Route, Clock, CheckCircle2, Loader2 } from 'lucide-react';

interface SheetRow {
  [key: string]: string;
}

interface OutputDashboardProps {
  currentScenarioName?: string;
}

interface ScenarioMetrics {
  id: string;
  hub: string;
  totalVehicles: number;
  totalTrips: number;
  avgStops: string;
  avgDistance: string;
  isCurrent: boolean;
}

export const OutputDashboard: React.FC<OutputDashboardProps> = ({ currentScenarioName }) => {
  // Persist Sheet ID in local storage for convenience across reloads
  const [sheetId, setSheetId] = useState(localStorage.getItem('shipsy_sheet_id') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SheetRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Save Sheet ID when changed
  useEffect(() => {
    if (sheetId) {
      localStorage.setItem('shipsy_sheet_id', sheetId);
    }
  }, [sheetId]);

  // ----------------------------------------------------------------------
  // CSV Parsing & Fetching Logic
  // ----------------------------------------------------------------------
  
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Simple CSV parser handling quotes
    const parseLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(val => val.replace(/^"|"$/g, '').trim()); // Clean quotes
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(line => {
      const values = parseLine(line);
      const row: SheetRow = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      return row;
    });

    return { headers, rows };
  };

  const fetchSheetData = async () => {
    if (!sheetId) return;
    
    setIsLoading(true);
    setError(null);
    setData([]);

    // Extract ID if full URL is pasted
    let cleanId = sheetId;
    const urlMatch = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) cleanId = urlMatch[1];

    try {
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv`);
      
      if (!response.ok) {
        if (response.status === 404) throw new Error("Sheet not found. Check the ID.");
        if (response.status === 401 || response.status === 403) throw new Error("Permission denied. Ensure the Sheet is 'Anyone with the link can view'.");
        throw new Error("Failed to fetch sheet data.");
      }

      const csvText = await response.text();
      const { headers, rows } = parseCSV(csvText);
      
      setHeaders(headers);
      setData(rows);
      setLastUpdated(new Date());

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // Metric Calculation Logic
  // ----------------------------------------------------------------------
  
  const scenarioMetrics = useMemo<ScenarioMetrics[] | null>(() => {
    if (data.length === 0) return null;

    // 1. Group by request_id (Scenario)
    const scenarios: Record<string, SheetRow[]> = {};
    
    data.forEach(row => {
      // Keys might be case sensitive depending on CSV export, we try standard snake_case from prompt
      // Columns: hub_code, request_id, vehicle_code, type, travel_distance_km
      const reqId = row['request_id'] || row['Request_Id'] || 'Unknown';
      if (!scenarios[reqId]) scenarios[reqId] = [];
      scenarios[reqId].push(row);
    });

    // 2. Calculate metrics per scenario
    const results = Object.keys(scenarios).map(id => {
      const rows = scenarios[id];
      const hubCode = rows[0]['hub_code'] || rows[0]['Hub_Code'] || 'N/A';
      
      // Group by vehicle to calculate per-vehicle stats
      const vehicles: Record<string, { distance: number, stops: number }> = {};
      
      rows.forEach(r => {
        const vCode = r['vehicle_code'] || r['Vehicle_Code'];
        if (!vCode) return;
        
        if (!vehicles[vCode]) vehicles[vCode] = { distance: 0, stops: 0 };
        
        // Sum Distance
        const distStr = (r['travel_distance_km'] || r['Travel_Distance_Km'] || '0').replace(/[^0-9.-]+/g,"");
        const dist = parseFloat(distStr);
        if (!isNaN(dist)) vehicles[vCode].distance += dist;
        
        // Count Stops (type = delivery/pickup)
        const type = (r['type'] || r['Type'] || '').toLowerCase();
        if (type.includes('delivery') || type.includes('pickup') || type.includes('visit')) {
          vehicles[vCode].stops += 1;
        }
      });

      const uniqueVehicles = Object.keys(vehicles);
      const totalVehicles = uniqueVehicles.length;
      
      // Calculate averages
      let totalStopsAll = 0;
      let totalDistAll = 0;
      
      uniqueVehicles.forEach(v => {
        totalStopsAll += vehicles[v].stops;
        totalDistAll += vehicles[v].distance;
      });

      const avgStops = totalVehicles > 0 ? (totalStopsAll / totalVehicles).toFixed(1) : "0";
      const avgDist = totalVehicles > 0 ? (totalDistAll / totalVehicles).toFixed(2) : "0";

      return {
        id,
        hub: hubCode,
        totalVehicles,
        totalTrips: totalVehicles, // Assuming 1 Trip per Vehicle for this metric
        avgStops,
        avgDistance: avgDist,
        isCurrent: currentScenarioName ? id.toLowerCase() === currentScenarioName.toLowerCase() : false
      };
    });

    // Sort: Current scenario first, then new to old
    return results.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return 0; 
    });
  }, [data, currentScenarioName]);

  const currentScenarioFound = useMemo(() => {
    return scenarioMetrics?.some(s => s.isCurrent);
  }, [scenarioMetrics]);

  // ----------------------------------------------------------------------
  // UI Rendering
  // ----------------------------------------------------------------------

  return (
    <div className="w-full max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-50 border border-emerald-100 rounded-full mb-4">
          <Activity className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Optimization Results</h1>
        <p className="text-slate-500">Connect to the Master Sheet to view real-time results.</p>
      </div>

      {/* Connection Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 ring-1 ring-slate-900/5 rounded-2xl shadow-xl shadow-slate-200/50 p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Master Google Sheet ID / URL</label>
            <div className="relative">
              <input
                type="text"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                placeholder="Paste the Sheet ID here..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
              <FileSpreadsheet className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              <strong>How to link in backend:</strong> Use this Sheet ID in your n8n workflow's Google Sheets node. Ensure "Anyone with the link" has Viewer permission.
            </p>
          </div>
          <button
            onClick={fetchSheetData}
            disabled={isLoading || !sheetId}
            className="w-full md:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[160px]"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isLoading ? 'Fetching...' : 'Refresh Data'}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {lastUpdated && !isLoading && (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 justify-end">
             <Clock className="w-3 h-3" />
             Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Current Scenario Status (Waiting State) */}
      {currentScenarioName && !currentScenarioFound && sheetId && data.length > 0 && (
         <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 mb-8 flex items-start gap-4 animate-in fade-in">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin shrink-0" />
            <div>
              <h3 className="text-amber-900 font-semibold mb-1">Waiting for Scenario: {currentScenarioName}</h3>
              <p className="text-sm text-amber-700">
                The optimization is still processing. The results have not appeared in the Master Sheet yet. 
                <br/>Please wait a moment and click <strong>Refresh Data</strong>.
              </p>
            </div>
         </div>
      )}

      {/* Results Dashboard */}
      {scenarioMetrics && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg border-b border-slate-200 pb-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            Scenario Metrics
          </div>

          <div className="grid gap-6">
            {scenarioMetrics.map((scenario) => (
              <div 
                key={scenario.id} 
                className={`
                  bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all
                  ${scenario.isCurrent ? 'border-indigo-500 ring-4 ring-indigo-500/5 shadow-indigo-100' : 'border-slate-200'}
                `}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                     {scenario.isCurrent && (
                       <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Current</span>
                     )}
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scenario ID</div>
                      <div className="text-lg font-bold text-slate-900 font-mono">{scenario.id}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 text-right md:text-left">Hub Code</div>
                    <div className="text-lg font-medium text-slate-700 font-mono text-right md:text-left">{scenario.hub}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                      <Truck className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase">Vehicles Utilized</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">{scenario.totalVehicles}</div>
                  </div>

                   <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                      <Route className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase">Total Trips</span>
                    </div>
                    <div className="text-2xl font-bold text-sky-600">{scenario.totalTrips}</div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase">Avg Stops / Vehicle</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{scenario.avgStops}</div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase">Avg Distance / Vehicle</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{scenario.avgDistance} <span className="text-sm font-medium text-amber-500/70">km</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Raw Data Table */}
          <div className="space-y-4 pt-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
               <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
                <Table className="w-5 h-5 text-indigo-500" />
                Raw Data Preview
              </div>
              <a 
                href={sheetId.includes('http') ? sheetId : `https://docs.google.com/spreadsheets/d/${sheetId}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
              >
                Open in Sheets <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="px-6 py-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        {headers.map((h, i) => (
                          <td key={i} className="px-6 py-4 whitespace-nowrap">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.length > 10 && (
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 text-center">
                  Showing first 10 of {data.length} rows
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};