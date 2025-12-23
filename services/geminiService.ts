
import { GoogleGenAI, Type } from "@google/genai";
import { InvestmentPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeTradeReview(plan: InvestmentPlan, currentDate: string): Promise<string> {
  const prompt = `
    你是一位经历了多轮牛熊市的顶级职业投资人（超级牛散）。请基于以下交易计划和实际结果进行深度复盘分析：
    
    【当前分析日期】: ${currentDate}
    【交易品种】: ${plan.symbol} (${plan.side})
    【初始计划】:
    - 理由: ${plan.reasoning}
    - 入场价格: ${plan.entryPrice}
    - 止损: ${plan.stopLoss}
    - 止盈: ${plan.targetPrice}
    - 心理状态: ${plan.psychologicalState}
    
    【实际结果】:
    - 离场价格: ${plan.exitPrice}
    - 盈亏金额: ${plan.profitAndLoss}
    - 复盘笔记: ${plan.reviewNotes}
    
    请结合当前时间点的宏观或周期背景（如果适用），从以下三个维度给出专业的、“扎心”但温和的建议：
    1. 策略执行力：是否严格遵守了止损/止盈？
    2. 心理博弈：当时的情绪是否影响了判断？
    3. 市场洞察：下次遇到类似情况该如何优化？
    
    字数在200字以内，语气要像一个智慧的长辈或导师。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    return response.text || "暂时无法生成分析，请稍后再试。";
  } catch (error) {
    console.error("Gemini AI Analysis Error:", error);
    return "AI 导师正在闭关，请检查网络后重试。";
  }
}
