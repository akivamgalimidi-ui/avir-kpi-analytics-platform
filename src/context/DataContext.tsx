import React, { createContext, useContext, useState, useEffect } from 'react';
import type { WorkbookParseResult, ParsedFacility, ParsedMetric, ParsedEmployee } from '../utils/parseWorkbook';

export interface SelectedFilters {
  facility: string | null;
  region: string | null;
  group: string | null;
  payPeriod: string | null;
}

export interface DataState {
  uploadBatchId: string | null;
  filename: string | null;
  fileSize: number | null;
  parsedAt: string | null;
  sheetsDetected: string[];
  sheetRowCounts: Record<string, number>;
  facilities: ParsedFacility[];
  regions: string[];
  groups: string[];
  payPeriods: string[];
  metrics: ParsedMetric[];
  employees: ParsedEmployee[];
  warnings: string[];
  filters: SelectedFilters;
}

interface DataContextType {
  data: DataState;
  setFromParseResult: (result: WorkbookParseResult) => void;
  resetData: () => void;
  updateFilters: (f: Partial<SelectedFilters>) => void;
  filteredMetrics: ParsedMetric[];
}

const DEFAULT_STATE: DataState = {
  uploadBatchId: null,
  filename: null,
  fileSize: null,
  parsedAt: null,
  sheetsDetected: [],
  sheetRowCounts: {},
  facilities: [],
  regions: [],
  groups: [],
  payPeriods: [],
  metrics: [],
  employees: [],
  warnings: [],
  filters: { facility: null, region: null, group: null, payPeriod: null }
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'avir_analytics_v2';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setInternalData] = useState<DataState>(DEFAULT_STATE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if we have real data
        if (parsed.facilities?.length > 0 || parsed.metrics?.length > 0) {
          setInternalData(parsed);
        }
      }
    } catch (e) { /* ignore corrupt storage */ }
  }, []);

  const setFromParseResult = (result: WorkbookParseResult) => {
    const newState: DataState = {
      ...DEFAULT_STATE,
      uploadBatchId: `batch_${Date.now()}`,
      filename: result.filename,
      fileSize: result.fileSize,
      parsedAt: result.parsedAt,
      sheetsDetected: result.sheetsDetected,
      sheetRowCounts: result.sheetRowCounts,
      facilities: result.facilities,
      regions: result.regions,
      groups: result.groups,
      payPeriods: result.payPeriods,
      metrics: result.metrics,
      employees: result.employees,
      warnings: result.warnings,
      filters: DEFAULT_STATE.filters
    };
    setInternalData(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) { /* storage full */ }
  };

  const resetData = () => {
    setInternalData(DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateFilters = (f: Partial<SelectedFilters>) => {
    setInternalData(prev => ({
      ...prev,
      filters: { ...prev.filters, ...f }
    }));
  };

  // Derived: filtered metrics applying current filter state
  const filteredMetrics = data.metrics.filter(m => {
    if (data.filters.facility && m.facility !== data.filters.facility) return false;
    if (data.filters.region && m.region !== data.filters.region) return false;
    if (data.filters.group && m.group !== data.filters.group) return false;
    if (data.filters.payPeriod && m.payPeriod !== data.filters.payPeriod) return false;
    return true;
  });

  return (
    <DataContext.Provider value={{ data, setFromParseResult, resetData, updateFilters, filteredMetrics }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
