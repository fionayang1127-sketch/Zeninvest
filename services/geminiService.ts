
import { GoogleGenAI } from "@google/genai";
import { InvestmentPlan } from "../types";

export async function analyzeTradeReview(plan: InvestmentPlan, currentDate: string): Promise<string> {
  // 1. 获取 Key
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  
  if (!apiKey || apiKey.length < 5) {
    console.warn("API_KEY 未找到，请确保已在 Vercel 配置并重新部署。");
    throw new Error("API_KEY_MISSING");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      你是一位经历了多轮牛熊市、内心极其强大的超级牛散投资导师。
      你的学生刚刚完成了一笔交易，请根据以下数据进行犀利且充满智慧的复盘：
      
      【交易日期】: ${currentDate}
      【标的】: ${plan.symbol} (${plan.side === 'BUY' ? '做多' : '做空'})
      【初始计划】:
      - 理由: ${plan.reasoning}
      - 入场: ${plan.entryPrice} | 止损: ${plan.stopLoss} | 目标: ${plan.targetPrice}
      - 入场心态: ${plan.psychologicalState}
      
      【实际结果】:
      - 离场价: ${plan.exitPrice}
      - 盈亏金额: ${plan.profitAndLoss}
      - 学生的自省: ${plan.reviewNotes}
      
      请按以下三个维度点评（总共不超过180字）：
      1. 【纪律】：是否按计划执行？
      2. 【心态】：针对入场时的“${plan.psychologicalState}”给出一句心法。
      3. 【进阶】：这单最有价值的一个教训。
      
      语气：睿智、坚定、像老友交谈。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { temperature: 0.7 },
    });
    
    return response.text || "这笔交易本身就是最好的老师。";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.status === 403 || error.status === 401) throw new Error("API_KEY_INVALID");
    return "AI 导师暂时在复盘大盘，这笔盈亏已记录，心态保持稳定最重要。";
  }
}
