import React, { useState } from 'react';
import { Search, Save, RefreshCw, AlertCircle, Database, Truck, Box, ArrowRight, Check, Plus, X, ChevronDown } from 'lucide-react';

// ----------------------------------------------------------------------
// ALL AVAILABLE SYSTEM FIELDS
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
const URL_SAVE_MAPPING = "https://shipsy-subs.app.n8n.cloud/webhook-test/webhook-path";

type MappingData = Record<string, string>;

interface MappingResponse {
  success?: boolean;
  scenario_name?: string;
  vehicle_mapping?: MappingData;
  consignment_mapping?: MappingData;
}

// Mock data (fallback)
const MOCK_VEHICLE_MAP: MappingData = { "Vehicle ID": "worker_code", "Max Weight": "weight" };
const MOCK_CONSIGNMENT_MAP: MappingData = { "Order No": "reference_number", "Customer Name": "destination_details_name" };

export const MappingPage: React.FC = () => {
  const [scenarioName, setScenarioName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [vehicleMapping, setVehicleMapping] = useState<MappingData>({});
  const [consignmentMapping, setConsignmentMapping] = useState<MappingData>({});
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  // Add new field states
  const [addVehicleField, setAddVehicleField] = useState('');
  const [addVehicleHeader, setAddVehicleHeader] = useState('');
  const [addConsignmentField, setAddConsignmentField] = useState('');
  const [addConsignmentHeader, setAddConsignmentHeader] = useState('');

  // ----------------------------------------------------------------------
  // Fetch & Save (unchanged logic)
  // ----------------------------------------------------------------------
  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;
    setIsLoading(true); setError(null); setSuccessMsg(null); setHasSearched(true); setIsMock(false);
    try {
      const res = await fetch(URL_GET_MAPPING, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_name: scenarioName })
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data: MappingResponse = await res.json();
      setVehicleMapping(data.vehicle_mapping || {});
      setConsignmentMapping(data.consignment_mapping || {});
    } catch (err) {
      setIsMock(true);
      setVehicleMapping(MOCK_VEHICLE_MAP);
      setConsignmentMapping(MOCK_CONSIGNMENT_MAP);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true); setError(null); setSuccessMsg(null);
    try {
      if (isMock) { await new Promise(r => setTimeout(r, 800)); setSuccessMsg("Saved (Mock)"); return; }
      await fetch(URL_SAVE_MAPPING, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_name: scenarioName, vehicle_mapping: vehicleMapping, consignment_mapping: consignmentMapping })
      });
      setSuccessMsg("All mappings saved successfully!");
    } catch { setError("Save failed"); } finally { setIsSaving(false); }
  };

  // ----------------------------------------------------------------------
  // Mapping Helpers
  // ----------------------------------------------------------------------
  const updateExcelHeader = (type: 'vehicle' | 'consignment', oldHeader: string, newHeader: string) => {
    if (!newHeader.trim() || newHeader === oldHeader) return;
    const map = type === 'vehicle' ? vehicleMapping : consignmentMapping;
    const systemField = map[oldHeader];
    if (!systemField) return;
    const updated = { ...map };
    delete updated[oldHeader];
    updated[newHeader.trim()] = systemField;
    type === 'vehicle' ? setVehicleMapping(updated) : setConsignmentMapping(updated);
  };

  const removeMapping = (type: 'vehicle' | 'consignment', excelHeader: string) => {
    const updated = { ...(type === 'vehicle' ? vehicleMapping : consignmentMapping) };
    delete updated[excelHeader];
    type === 'vehicle' ? setVehicleMapping(updated) : setConsignmentMapping(updated);
  };

  const addNewMapping = (type: 'vehicle' | 'consignment') => {
    const systemField = type === 'vehicle' ? addVehicleField : addConsignmentField;
    const excelHeader = (type === 'vehicle' ? addVehicleHeader : addConsignmentHeader).trim();
    if (!systemField || !excelHeader) return;

    const current = type === 'vehicle' ? vehicleMapping : consignmentMapping;
    if (Object.values(current).includes(systemField)) {
      setError(`Field ${systemField} is already mapped`);
      return;
    }

    const updated = { ...current, [excelHeader]: systemField };
    if (type === 'vehicle') {
      setVehicleMapping(updated);
      setAddVehicleField('');
      setAddVehicleHeader('');
    } else {
      setConsignmentMapping(updated);
      setAddConsignmentField('');
      setAddConsignmentHeader('');
    }
  };

  const getAvailableFields = (type: 'vehicle' | 'consignment') => {
    const used = Object.values(type === 'vehicle' ? vehicleMapping : consignmentMapping);
    const all = type === 'vehicle' ? AVAILABLE_VEHICLE_FIELDS : AVAILABLE_CONSIGNMENT_FIELDS;
    return all.filter(f => !used.includes(f));
  };

  // ----------------------------------------------------------------------
  // Render Section - Same Beautiful Table UI as Before
  // ----------------------------------------------------------------------
  const renderMappingSection = (title: string, icon: React.ReactNode, data: MappingData, type: 'vehicle' | 'consignment') => {
    const entries = Object.entries(data);
    const available = getAvailableFields(type);
    const newField = type === 'vehicle' ? addVehicleField : addConsignmentField;
    const newHeader = type === 'vehicle' ? addVehicleHeader : addConsignmentHeader;

    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <span className="ml-auto text-xs font-mono text-slate-500 bg-white px-3 py-1 rounded-full border">
            {entries.length} mapped
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium uppercase tracking-wider text-xs sticky top-0 z-10 border-b">
              <tr>
                <th className="px-6 py-4 text-left">Mapped System Field</th>
                <th className="px-6 py-4 text-left border-l border-slate-200">Excel Header (Input)</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map(([excelHeader, systemField]) => (
                <tr key={systemField} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <code className="font-mono text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded border border-slate-300">
                      {systemField}
                    </code>
                  </td>
                  <td className="px-6 py-4 border-l border-slate-100">
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        defaultValue={excelHeader}
                        onBlur={(e) => updateExcelHeader(type, excelHeader, e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-3 py-2 text-slate-800 font-medium transition-all"
                        placeholder="Required column name"
                      />
                    </div>
                  </td>
                  <td className="px-3">
                    <button
                      onClick={() => removeMapping(type, excelHeader)}
                      className="opacity-0 group-hover:opacity-100 transition p-2 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Add New Row */}
              {available.length > 0 && (
                <tr className="bg-indigo-50/30 border-t-2 border-dashed border-indigo-200">
                  <td className="px-6 py-4">
                    <select
                      value={newField}
                      onChange={(e) => type === 'vehicle' ? setAddVehicleField(e.target.value) : setAddConsignmentField(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">Choose field to map...</option>
                      {available.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 border-l border-slate-100">
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-4 h-4 text-indigo-500" />
                      <input
                        type="text"
                        value={newHeader}
                        onChange={(e) => type === 'vehicle' ? setAddVehicleHeader(e.target.value) : setAddConsignmentHeader(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addNewMapping(type)}
                        placeholder="Type Excel column name..."
                        className="w-full bg-white border border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/30 rounded-lg px-3 py-2 font-medium text-indigo-900 placeholder-indigo-400"
                      />
                    </div>
                  </td>
                  <td className="px-3">
                    <button
                      onClick={() => addNewMapping(type)}
                      disabled={!newField || !newHeader.trim()}
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {available.length === 0 && entries.length > 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              All available system fields are already mapped
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-40">
      {/* Header */}
      <div className="text-center mb-10 pt-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Field Mapping Editor</h1>
        <p className="text-lg text-slate-600">Map your Excel columns to Shipsy system fields</p>
      </div>

      {/* Search Form */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 mb-10">
        <form onSubmit={handleFetch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Scenario Name</label>
            <div className="relative">
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g. LUX_POST_Jun15"
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              />
              <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading || !scenarioName.trim()}
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center gap-3 shadow-lg shadow-indigo-500/30"
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
              {isLoading ? 'Fetching...' : 'Load Mapping'}
            </button>
          </div>
        </form>

        {isMock && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>Simulation Mode: Using mock data</span>
          </div>
        )}
      </div>

      {/* Mapping Tables */}
      {hasSearched && !isLoading && (
        <div className="space-y-10">
          <div className="grid lg:grid-cols-2 gap-10">
            {renderMappingSection("Vehicle Fields", <Truck className="w-6 h-6 text-indigo-600" />, vehicleMapping, 'vehicle')}
            {renderMappingSection("Consignment Fields", <Box className="w-6 h-6 text-emerald-600" />, consignmentMapping, 'consignment')}
          </div>

          {/* Save */}
          <div className="flex justify-end items-center gap-6 pt-8 border-t border-slate-200">
            <p className="text-slate-600">Ready to save your changes?</p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center gap-3 shadow-lg shadow-emerald-500/30"
            >
              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Saving...' : 'Save All Mappings'}
            </button>
          </div>

          {successMsg && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-4 text-emerald-800">
              <div className="p-2 bg-emerald-100 rounded-full"><Check className="w-5 h-5" /></div>
              <span className="font-medium">{successMsg}</span>
            </div>
          )}
          {error && (
            <div className="p-5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
