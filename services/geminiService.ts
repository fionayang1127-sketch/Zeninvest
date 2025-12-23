
import { GoogleGenAI } from "@google/genai";
import { InvestmentPlan } from "../types";

export async function analyzeTradeReview(plan: InvestmentPlan, currentDate: string): Promise<string> {
  // 核心：更兼容的变量读取
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) 
                 ? process.env.API_KEY 
                 : (window as any)._ENV_API_KEY; // 备用注入方式
  
  if (!apiKey || apiKey.length < 5) {
    throw new Error("API_KEY_MISSING");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      你是一位经历了多轮牛熊市、内心极其强大的超级牛散投资导师。
      你的学生刚刚完成了一笔交易，请根据以下数据进行犀利且充满智慧的复盘：
      
      【交易日期】: ${currentDate}
      【标的】: ${plan.symbol} (${plan.side === 'BUY' ? '做多' : '做空'})
      【理由】: ${plan.reasoning}
      【入场心态】: ${plan.psychologicalState}
      【结果】: 盈亏 ¥${plan.profitAndLoss}，出场备注：${plan.reviewNotes}
      
      请按以下两个维度点评（总共不超过150字）：
      1. 【系统性】：是否背离了当初的理由？
      2. 【导师寄语】：针对这笔单子的盈亏，给出一句能安抚学生情绪并提升境界的话。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { temperature: 0.8 },
    });
    
    return response.text || "这笔交易本身就是最好的老师。";
  } catch (error: any) {
    console.error("Gemini Error Detail:", error);
    throw error;
  }
}
