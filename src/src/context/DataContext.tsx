import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ParsedData, OTRow, BonusRow, PPDRow } from '../utils/parseWorkbook';

interface Filters {
  subgroup: string;
  region: string;
  facility: string;
  payPeriod: string;
  payCycle: string;
}

interface DataContextType {
  data: ParsedData | null;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  setFromParseResult: (result: ParsedData) => void;
  
  // Memoized Filtered Facts
  filteredOT: OTRow[];
  filteredBonus: BonusRow[];
  filteredPPD: PPDRow[];
  
  // Drilldown / Context
  resetFilters: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ParsedData | null>(null);
  const [filters, setFilters] = useState<Filters>({
    subgroup: '', region: '', facility: '', payPeriod: '', payCycle: ''
  });

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('avir_kpi_dataset');
    if (saved) {
      try { setData(JSON.parse(saved)); } catch (e) { console.error('Failed to load saved dataset'); }
    }
  }, []);

  const setFromParseResult = (result: ParsedData) => {
    setData(result);
    localStorage.setItem('avir_kpi_dataset', JSON.stringify(result));
    // Reset filters on new upload
    setFilters({ subgroup: '', region: '', facility: '', payPeriod: '', payCycle: '' });
  };

  const resetFilters = () => {
    setFilters({ subgroup: '', region: '', facility: '', payPeriod: '', payCycle: '' });
  };

  // Cascading Logic: If subgroup changes, and facility isn't in that subgroup, clear it.
  // (In a real app, we'd trigger this on change, but for now we'll handle it in the UI selectors)

  const filteredOT = useMemo(() => {
    if (!data) return [];
    return data.facts.otRows.filter(r => {
      if (filters.subgroup && r.subgroup !== filters.subgroup) return false;
      if (filters.region && r.region !== filters.region) return false;
      if (filters.facility && r.facility !== filters.facility) return false;
      if (filters.payPeriod && r.payPeriod !== filters.payPeriod) return false;
      if (filters.payCycle && r.payCycle !== filters.payCycle) return false;
      return true;
    });
  }, [data, filters]);

  const filteredBonus = useMemo(() => {
    if (!data) return [];
    return data.facts.bonusRows.filter(r => {
      if (filters.subgroup && r.subgroup !== filters.subgroup) return false;
      if (filters.region && r.region !== filters.region) return false;
      if (filters.facility && r.facility !== filters.facility) return false;
      if (filters.payPeriod && r.payPeriod !== filters.payPeriod) return false;
      if (filters.payCycle && r.payCycle !== filters.payCycle) return false;
      return true;
    });
  }, [data, filters]);

  const filteredPPD = useMemo(() => {
    if (!data) return [];
    return data.facts.ppdRows.filter(r => {
      if (filters.subgroup && r.subgroup !== filters.subgroup) return false;
      if (filters.region && r.region !== filters.region) return false;
      if (filters.facility && r.facility !== filters.facility) return false;
      if (filters.payPeriod && r.payPeriod !== filters.payPeriod) return false;
      if (filters.payCycle && r.payCycle !== filters.payCycle) return false;
      return true;
    });
  }, [data, filters]);

  const value = {
    data, filters, setFilters, setFromParseResult,
    filteredOT, filteredBonus, filteredPPD, resetFilters
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}
