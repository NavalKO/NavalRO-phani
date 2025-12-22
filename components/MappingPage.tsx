
import React, { useState } from 'react';
import { Search, Save, RefreshCw, AlertCircle, Database, Truck, Box, ArrowRight, Check, Plus, X, ChevronDown, ListFilter, LayoutList } from 'lucide-react';

// ----------------------------------------------------------------------
// ALL AVAILABLE SYSTEM FIELDS (Standard Shipsy Fields)
// ----------------------------------------------------------------------
const AVAILABLE_CONSIGNMENT_FIELDS = [
  "reference_number", "origin_details_name", "origin_details_phone", "origin_details_address_line_1",
  "origin_details_address_line_2", "origin_details_pincode", "origin_details_city", "origin_details_state",
  "destination_details_name", "destination_details_phone", "destination_details_address_line_1",
  "destination_details_address_line_2", "destination_details_pincode", "destination_details_city",
  "destination_details_state", "destination_details_country", "length", "width", "height",
  "dimension_unit", "weight", "weight_unit", "volume", "volume_unit", "action_type",
  "declared_value", "destination_details_lat", "destination_details_lng", "origin_details_lat",
  "origin_details_lng", "pickup_service_time", "service_time", "pickup_time_slot_start",
  "pickup_time_slot_end", "delivery_time_slot_start", "delivery_time_slot_end", "constraint_tags"
];

const AVAILABLE_VEHICLE_FIELDS = [
  "worker_code", "weight", "volume", "speed", "consignment_capacity", "constraint_tags",
  "vehicle_service_time", "priority", "task_capacity", "height", "distance",
  "delivery_time_start", "delivery_time_end", "fixed_cost", "variable_cost",
  "trip_id", "cost_dimension", "length", "width", "max_cumulative_product_value",
  "max_hub_visit_allowed", "vehicle_replicate"
];

// ----------------------------------------------------------------------
// Config & Types
// ----------------------------------------------------------------------
const URL_GET_MAPPING = "https://wbdemo.shipsy.io/webhook/get-scenario-mapping";
const URL_SAVE_MAPPING = "https://wbdemo.shipsy.io/webhook/save-mappings";
const URL_GET_HEADERS = "https://wbdemo.shipsy.io/webhook/get-scenario-raw-file-headers";

// Mapping state: { [SystemField]: ExcelHeader }
type InternalMapping = Record<string, string>;

interface MappingResponse {
  success?: boolean;
  scenario_name?: string;
  vehicle_mapping?: Record<string, string>; // Expected as ExcelHeader -> SystemField
  consignment_mapping?: Record<string, string>;
}

// Updated to match the array response format provided by the user
interface HeaderFileGroup {
  success: boolean;
  files: {
    consignments: {
      headers: string[];
    };
    vehicles: {
      headers: string[];
    };
  };
}

type HeadersResponse = HeaderFileGroup[];

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
export const MappingPage: React.FC = () => {
  const [scenarioName, setScenarioName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mappings stored internally as { [SystemField]: ExcelHeader } for easy UI rendering
  const [vehicleMapping, setVehicleMapping] = useState<InternalMapping>({});
  const [consignmentMapping, setConsignmentMapping] = useState<InternalMapping>({});
  
  // Headers fetched from the raw file headers webhook
  const [vehicleHeaders, setVehicleHeaders] = useState<string[]>([]);
  const [consignmentHeaders, setConsignmentHeaders] = useState<string[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  // State for adding a new row
  const [newRowSystemField, setNewRowSystemField] = useState({ vehicle: '', consignment: '' });
  const [newRowExcelHeader, setNewRowExcelHeader] = useState({ vehicle: '', consignment: '' });

  // Helper to reverse mapping from API format (Excel->System) to UI format (System->Excel)
  const toInternalMapping = (apiMap: Record<string, string> | undefined): InternalMapping => {
    if (!apiMap) return {};
    const internal: InternalMapping = {};
    Object.entries(apiMap).forEach(([excelHeader, systemField]) => {
      internal[systemField] = excelHeader;
    });
    return internal;
  };

  // Helper to reverse mapping from UI format (System->Excel) back to API format (Excel->System)
  const toApiMapping = (internalMap: InternalMapping): Record<string, string> => {
    const api: Record<string, string> = {};
    Object.entries(internalMap).forEach(([systemField, excelHeader]) => {
      api[excelHeader] = systemField;
    });
    return api;
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;
    setIsLoading(true); setError(null); setSuccessMsg(null); setHasSearched(true); setIsMock(false);
    
    try {
      // 1. Fetch current mappings
      const resMapping = await fetch(URL_GET_MAPPING, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_name: scenarioName })
      });
      
      // 2. Fetch raw file headers (Using user-specified sceanrio_name typo)
      const resHeaders = await fetch(URL_GET_HEADERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceanrio_name: scenarioName })
      });

      if (!resMapping.ok || !resHeaders.ok) throw new Error("Could not fetch scenario configuration.");

      const mappingData: MappingResponse = await resMapping.json();
      const headersData: HeadersResponse = await resHeaders.json();

      // Set mappings
      setVehicleMapping(toInternalMapping(mappingData.vehicle_mapping));
      setConsignmentMapping(toInternalMapping(mappingData.consignment_mapping));
      
      // Extract headers from the array response format [ { files: { ... } } ]
      if (headersData.length > 0 && headersData[0].files) {
        setVehicleHeaders(headersData[0].files.vehicles?.headers || []);
        setConsignmentHeaders(headersData[0].files.consignments?.headers || []);
      }

    } catch (err) {
      console.warn("API Error, using simulation data:", err);
      setIsMock(true);
      // Mocked fallback data
      setVehicleMapping({ "worker_code": "Vehicle ID", "weight": "Vehicle Max Weight" });
      setConsignmentMapping({ "reference_number": "Order Ref", "destination_details_address_line_1": "Target Address" });
      setVehicleHeaders(["Vehicle ID", "Vehicle Max Weight", "Driver Name", "volume", "delivery_time_start"]);
      setConsignmentHeaders(["Order Ref", "Target Address", "pincode", "city", "service_time"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true); setError(null); setSuccessMsg(null);
    try {
      if (isMock) { await new Promise(r => setTimeout(r, 800)); setSuccessMsg("Configuration saved (Simulated)"); return; }
      
      const payload = { 
        scenario_name: scenarioName, 
        vehicle_mapping: toApiMapping(vehicleMapping), 
        consignment_mapping: toApiMapping(consignmentMapping) 
      };

      const res = await fetch(URL_SAVE_MAPPING, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Save operation failed.");
      setSuccessMsg("Mappings published to the n8n workflow successfully!");
    } catch { setError("Failed to save. Check endpoint availability."); } finally { setIsSaving(false); }
  };

  const updateMappingValue = (type: 'vehicle' | 'consignment', systemField: string, newExcelHeader: string) => {
    if (type === 'vehicle') {
      setVehicleMapping(prev => ({ ...prev, [systemField]: newExcelHeader }));
    } else {
      setConsignmentMapping(prev => ({ ...prev, [systemField]: newExcelHeader }));
    }
  };

  const removeMappingRow = (type: 'vehicle' | 'consignment', systemField: string) => {
    if (type === 'vehicle') {
      const next = { ...vehicleMapping }; delete next[systemField]; setVehicleMapping(next);
    } else {
      const next = { ...consignmentMapping }; delete next[systemField]; setConsignmentMapping(next);
    }
  };

  const addNewRow = (type: 'vehicle' | 'consignment') => {
    const sysField = newRowSystemField[type];
    const excelHdr = newRowExcelHeader[type];
    if (!sysField || !excelHdr) return;
    
    updateMappingValue(type, sysField, excelHdr);
    setNewRowSystemField(p => ({ ...p, [type]: '' }));
    setNewRowExcelHeader(p => ({ ...p, [type]: '' }));
  };

  const renderSection = (title: string, icon: React.ReactNode, mapping: InternalMapping, fileHeaders: string[], availableSystemFields: string[], type: 'vehicle' | 'consignment') => {
    const entries = Object.entries(mapping);
    const unusedSystem = availableSystemFields.filter(f => !mapping[f]);
    const themeColor = type === 'vehicle' ? 'indigo' : 'emerald';

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full transition-all">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${themeColor}-100 text-${themeColor}-600`}>{icon}</div>
            <h3 className="font-bold text-slate-800">{title}</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-white border px-3 py-1 rounded-full uppercase tracking-tighter">
            {entries.length} Fields Configured
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b">
              <tr>
                <th className="px-6 py-4 text-left w-1/2">Shipsy Field</th>
                <th className="px-6 py-4 text-left border-l border-slate-200">Excel Header (Input Source)</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map(([systemField, currentExcelHeader]) => (
                <tr key={systemField} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <LayoutList className="w-3.5 h-3.5 text-slate-300" />
                      <code className={`font-mono text-xs text-${themeColor}-700 font-bold`}>{systemField}</code>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-l border-slate-100">
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                      <div className="relative flex-1">
                        <select
                          value={currentExcelHeader}
                          onChange={(e) => updateMappingValue(type, systemField, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none outline-none transition-all cursor-pointer shadow-sm"
                        >
                          {/* Populate Excel Header dropdown from Webhook data */}
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                          {!fileHeaders.includes(currentExcelHeader) && (
                            <option value={currentExcelHeader}>{currentExcelHeader} (Not Found in File)</option>
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3">
                    <button
                      onClick={() => removeMappingRow(type, systemField)}
                      className="opacity-0 group-hover:opacity-100 transition p-2 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Add New Entry Row */}
              {unusedSystem.length > 0 && (
                <tr className="bg-slate-50/30 border-t border-dashed border-slate-200">
                  <td className="px-6 py-4">
                    <div className="relative">
                      <select
                        value={newRowSystemField[type]}
                        onChange={(e) => setNewRowSystemField(p => ({ ...p, [type]: e.target.value }))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 appearance-none"
                      >
                        <option value="">+ Choose System Field</option>
                        {/* Populate System Field dropdown from hardcoded AVAILABLE_..._FIELDS */}
                        {unusedSystem.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-6 py-4 border-l border-slate-100">
                    <div className="flex items-center gap-3">
                      <ArrowRight className={`w-4 h-4 text-${themeColor}-400`} />
                      <div className="relative flex-1">
                        <select
                          value={newRowExcelHeader[type]}
                          onChange={(e) => setNewRowExcelHeader(p => ({ ...p, [type]: e.target.value }))}
                          className={`w-full bg-white border border-${themeColor}-200 rounded-lg px-3 py-2 text-xs font-bold text-${themeColor}-900 outline-none appearance-none`}
                        >
                          <option value="">Choose Raw Column...</option>
                          {/* Populate Excel Header dropdown from Webhook data */}
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <ChevronDown className={`absolute right-3 top-2 w-3.5 h-3.5 text-${themeColor}-400 pointer-events-none`} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3">
                    <button
                      onClick={() => addNewRow(type)}
                      disabled={!newRowSystemField[type] || !newRowExcelHeader[type]}
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-30 disabled:grayscale shadow-sm transition"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {entries.length === 0 && !isLoading && (
            <div className="p-12 text-center flex flex-col items-center">
              <ListFilter className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm font-medium">No mappings defined for this scenario.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-40 animate-in fade-in duration-700">
      <div className="text-center mb-10 pt-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Scenario Configuration Hub</h1>
        <p className="text-lg text-slate-500">Map internal system fields to raw file headers fetched from the data sources.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 mb-10">
        <form onSubmit={handleFetch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Scenario Context</label>
            <div className="relative">
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g. IDBtest3"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              />
              <Search className="absolute left-4 top-4.5 w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading || !scenarioName.trim()}
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-3 shadow-lg shadow-indigo-600/30"
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
              {isLoading ? 'Fetching Config...' : 'Load Mappings'}
            </button>
          </div>
        </form>
        {isMock && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Simulation Mode Active: Backend unreachable. Using sample header data.</span>
          </div>
        )}
      </div>

      {hasSearched && !isLoading && (
        <div className="space-y-10">
          <div className="grid lg:grid-cols-2 gap-10">
            {renderSection("Vehicles", <Truck className="w-6 h-6" />, vehicleMapping, vehicleHeaders, AVAILABLE_VEHICLE_FIELDS, 'vehicle')}
            {renderSection("Consignments", <Box className="w-6 h-6" />, consignmentMapping, consignmentHeaders, AVAILABLE_CONSIGNMENT_FIELDS, 'consignment')}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-10 border-t border-slate-200">
            <div className="text-slate-500 text-sm">
              <p className="font-bold text-slate-700">Commit Mapping Changes?</p>
              <p>Publishing will update the normalization engine for <span className="font-mono bg-slate-100 px-1 rounded text-indigo-600">{scenarioName}</span>.</p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-12 py-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center gap-3 shadow-2xl shadow-emerald-600/20 active:scale-95"
            >
              {isSaving ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {isSaving ? 'Synchronizing...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* Status Notifications */}
      {(successMsg || error) && (
        <div className="fixed bottom-24 right-8 z-50 animate-in slide-in-from-right-10 fade-in duration-500">
          {successMsg && (
            <div className="bg-white border-l-4 border-emerald-500 p-5 rounded-r-xl shadow-2xl flex items-center gap-4 min-w-[300px]">
              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><Check className="w-5 h-5" /></div>
              <div className="flex flex-col"><span className="font-bold text-slate-800">Published</span><span className="text-xs text-slate-500">{successMsg}</span></div>
            </div>
          )}
          {error && (
            <div className="bg-white border-l-4 border-red-500 p-5 rounded-r-xl shadow-2xl flex items-center gap-4 min-w-[300px]">
              <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertCircle className="w-5 h-5" /></div>
              <div className="flex flex-col"><span className="font-bold text-slate-800">Error</span><span className="text-xs text-slate-500">{error}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
