import * as XLSX from 'xlsx';

export interface ParsedDimensions {
  facilities: string[];
  regions: string[];
  groups: string[];
  facilityMapping: Record<string, { region?: string; group?: string }>;
}

export function parseDimensions(workbook: XLSX.WorkBook): ParsedDimensions {
  const facilities = new Set<string>();
  const regions = new Set<string>();
  const groups = new Set<string>();
  const facilityMapping: Record<string, { region?: string; group?: string }> = {};

  const dimensionSheets = ["Analysis by Region", "Analysis by Acq Group", "Facility Summary"];

  for (const sheetName of dimensionSheets) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    // Logic for "Analysis by Region"
    if (sheetName === "Analysis by Region") {
      for (let i = 5; i < data.length; i++) {
        const row = data[i];
        const fName = row[0];
        const rName = row[1] || "Default Region";
        
        if (fName && typeof fName === 'string' && !fName.includes('Total')) {
          facilities.add(fName);
          regions.add(rName);
          facilityMapping[fName] = { ...facilityMapping[fName], region: rName };
        }
      }
    }

    // Logic for "Analysis by Acq Group"
    if (sheetName === "Analysis by Acq Group") {
      for (let i = 5; i < data.length; i++) {
        const row = data[i];
        const fName = row[0];
        const gName = row[1] || "Default Group";
        
        if (fName && typeof fName === 'string' && !fName.includes('Total')) {
          facilities.add(fName);
          groups.add(gName);
          facilityMapping[fName] = { ...facilityMapping[fName], group: gName };
        }
      }
    }
  }

  return {
    facilities: Array.from(facilities),
    regions: Array.from(regions),
    groups: Array.from(groups),
    facilityMapping
  };
}
