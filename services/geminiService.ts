
import { GoogleGenAI } from "@google/genai";
import { InvestmentPlan } from "../types";

/**
 * Uses Gemini AI to analyze a completed trade and provide insightful feedback.
 */
export async function analyzeTrade(plan: InvestmentPlan): Promise<string> {
  // Always initialize GoogleGenAI inside the function to ensure up-to-date config as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `你是一位名为 "禅意交易导师" 的资深投资专家。
请根据以下交易数据提供一段富有哲理、中肯且简短的复盘分析（约150字）：

交易品种: ${plan.symbol}
交易方向: ${plan.side === 'BUY' ? '买入(做多)' : '卖出(做空)'}
入场价格: ${plan.entryPrice}
离场价格: ${plan.exitPrice}
最终盈亏: ${plan.profitAndLoss}
入场理由: ${plan.reasoning}
初始心态: ${plan.psychologicalState}
用户复盘总结: ${plan.reviewNotes}

请从纪律性（是否执行了止损/目标计划）、心态管理和改进建议三个维度进行分析。语气应如禅师般平和、睿智。请用中文回答。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "禅师正在冥想，无法言语。";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "修行之路偶有迷雾（AI分析失败），请守住本心，坚持复盘。";
  }
}
