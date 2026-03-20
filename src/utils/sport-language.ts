import { SupportedSport } from "../types/goalie-v11";

export interface SportTerminology {
  goal: string;
  area: string;
  surface: string;
  saveMetric: string;
  averageMetric: string;
  shutoutMetric: string;
  advancedMetric: string;
  positions?: string[];
}

const termMap: Record<SupportedSport, SportTerminology> = {
  hockey: {
    goal: "Net",
    area: "Crease",
    surface: "Rink",
    saveMetric: "Save %",
    averageMetric: "GAA",
    shutoutMetric: "SO",
    advancedMetric: "HD Save %",
    positions: ["Butterfly", "T-Push", "Post-to-Post"]
  },
  soccer: {
    goal: "Goal",
    area: "Box",
    surface: "Pitch",
    saveMetric: "Saves",
    averageMetric: "Goals Against",
    shutoutMetric: "Clean Sheets",
    advancedMetric: "xG Saved",
    positions: ["Near Post", "Far Post", "Distribution"]
  },
  "lacrosse-boys": {
    goal: "Goal",
    area: "Crease",
    surface: "Field",
    saveMetric: "Save %",
    averageMetric: "GAA",
    shutoutMetric: "Shutouts",
    advancedMetric: "HD Save %"
  },
  "lacrosse-girls": {
    goal: "Goal",
    area: "8m Arc",
    surface: "Field",
    saveMetric: "Save %",
    averageMetric: "GAA",
    shutoutMetric: "Shutouts",
    advancedMetric: "HD Save %"
  },
  "lacrosse-box": {
    goal: "Goal",
    area: "Crease",
    surface: "Floor",
    saveMetric: "Save %",
    averageMetric: "GAA",
    shutoutMetric: "Shutouts",
    advancedMetric: "HD Save %"
  }
};

export const getSportTerms = (sport: SupportedSport): SportTerminology => {
  return termMap[sport] || termMap.hockey;
};
