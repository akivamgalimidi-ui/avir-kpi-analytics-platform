import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ParsedData, OTRow, BonusRow, PPDRow } from '../utils/parseWorkbook';

export interface Filters {
  subgroup: string | null;
  region: string | null;
  facility: string | null;
  department: string | null;
  position: string | null;
  payPeriod: string | null;
  payCycle: string | null;
}

interface DataContextType {
  data: ParsedData | null;
  filters: Filters;
  setFromParseResult: (r: ParsedData) => void;
  resetData: () => void;
  updateFilter: (key: keyof Filters, val: string | null) => void;
  clearFilters: () => void;
  filteredOT: OTRow[];
  filteredBonus: BonusRow[];
  filteredPPD: PPDRow[];
}

const DEFAULT_FILTERS: Filters = {
  subgroup: null, region: null, facility: null,
  department: null, position: null, payPeriod: null, payCycle: null
};

const DataContext = createContext<DataContextType | undefined>(undefined);
const STORAGE_KEY = 'avir_v3';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ParsedData | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Restore from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const d = JSON.parse(s);
        if (d?.facilities?.length > 0) setData(d);
      }
    } catch { /* ignore */ }
  }, []);

  const setFromParseResult = (r: ParsedData) => {
    setData(r);
    setFilters(DEFAULT_FILTERS);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch { /* storage full */ }
  };

  const resetData = () => { setData(null); setFilters(DEFAULT_FILTERS); localStorage.removeItem(STORAGE_KEY); };

  const updateFilter = (key: keyof Filters, val: string | null) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  // Derived filtered facts
  const facilitySet = useMemo(() => {
    if (!data) return new Set<string>();
    let facs = data.facilities;
    if (filters.subgroup) facs = facs.filter(f => f.subgroup === filters.subgroup);
    if (filters.region) facs = facs.filter(f => f.region === filters.region);
    if (filters.payCycle) facs = facs.filter(f => f.payCycle === filters.payCycle);
    if (filters.facility) facs = facs.filter(f => f.name === filters.facility);
    return new Set(facs.map(f => f.name));
  }, [data, filters]);

  const filteredOT = useMemo(() => {
    if (!data) return [];
    return data.otRows.filter(r => {
      if (facilitySet.size > 0 && !facilitySet.has(r.facility)) return false;
      if (filters.department && r.department !== filters.department) return false;
      if (filters.position && r.position !== filters.position) return false;
      if (filters.payPeriod && r.payPeriod !== filters.payPeriod) return false;
      return true;
    });
  }, [data, filters, facilitySet]);

  const filteredBonus = useMemo(() => {
    if (!data) return [];
    return data.bonusRows.filter(r => {
      if (facilitySet.size > 0 && !facilitySet.has(r.facility)) return false;
      if (filters.position && r.position !== filters.position) return false;
      if (filters.payPeriod && r.payPeriod !== filters.payPeriod) return false;
      return true;
    });
  }, [data, filters, facilitySet]);

  const filteredPPD = useMemo(() => {
    if (!data) return [];
    return data.ppdRows.filter(r => {
      if (facilitySet.size > 0 && !facilitySet.has(r.facility)) return false;
      if (filters.payPeriod && r.payPeriod !== filters.payPeriod) return false;
      return true;
    });
  }, [data, filters, facilitySet]);

  return (
    <DataContext.Provider value={{ data, filters, setFromParseResult, resetData, updateFilter, clearFilters, filteredOT, filteredBonus, filteredPPD }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
};
