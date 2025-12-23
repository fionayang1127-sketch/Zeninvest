
export enum TradeStatus {
  PLANNED = 'PLANNED',
  EXECUTED = 'EXECUTED',
  CLOSED = 'CLOSED'
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
  psychologicalState: string; // 情绪状态：冷静、兴奋、焦虑、恐惧
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
