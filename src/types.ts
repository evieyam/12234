export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface InsuranceTypeInfo {
  id: string;
  name: string;
  engName: string;
  icon: string;
  description: string;
  detailedDescription: string;
  keyConcepts: string[];
  purchaseTips: string[];
  claimTips: string[];
  mustKnows: string[];
}

export interface GapCalculatorInput {
  age: number;
  monthlyIncome: number;
  dependents: number;
  monthlyExpenses: number;
  mortgageDebt: number;
  currentLifeCoverage: number;
  currentMedicalCoverage: number;
  hasCriticalIllness: boolean;
}

export interface GapCalculatorResult {
  suggestedLifeCoverage: number;
  lifeGap: number;
  hospitalRecommendation: string;
  criticalIllnessRecommendation: string;
  actionPlans: string[];
}

export interface AIAnalysisResult {
  evaluation: string;
  gapsRisk: string[];
  productSuggestions: {
    type: string;
    reason: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }[];
  educationalTakeaway: string;
}
