
export enum TradeStatus {
  PLANNED = 'PLANNED',
  EXECUTED = 'EXECUTED',
  CLOSED = 'CLOSED'
}

export interface User {
  id: string;
  name: string;
  lastLogin: number;
}

export interface InvestmentPlan {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  strategy: string;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  positionSize: string;
  psychologicalState: string;
  reasoning: string;
  createdAt: number;
  status: TradeStatus;
  
  // 复盘字段
  exitPrice?: number;
  profitAndLoss?: number;
  reviewNotes?: string;
  aiAnalysis?: string;
}

export interface UserStats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  disciplineScore: number;
}
