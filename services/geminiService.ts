
import { GoogleGenAI } from "@google/genai";
import { InvestmentPlan } from "../types";

export async function analyzeTradeReview(plan: InvestmentPlan, currentDate: string): Promise<string> {
  // 检查 API Key 是否存在
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  
  if (!apiKey) {
    console.warn("未检测到 API_KEY，请在 Vercel 环境变量中配置。");
    return "AI 导师提示：由于未配置 API Key，暂时无法提供深度复盘。请检查应用配置。";
  }

  // 每次调用时初始化，确保获取最新的环境变量
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    你是一位经历了多轮牛熊市的顶级职业投资人（超级牛散）。请基于以下交易计划和实际结果进行深度复盘分析：
    
    【当前分析日期】: ${currentDate}
    【交易品种】: ${plan.symbol} (${plan.side === 'BUY' ? '做多' : '做空'})
    【初始计划】:
    - 理由: ${plan.reasoning}
    - 入场价格: ${plan.entryPrice}
    - 止损: ${plan.stopLoss}
    - 目标价: ${plan.targetPrice}
    - 入场心态: ${plan.psychologicalState}
    
    【实际结果】:
    - 离场价格: ${plan.exitPrice}
    - 最终盈亏金额: ${plan.profitAndLoss}
    - 投资者自述反思: ${plan.reviewNotes}
    
    请作为长辈给出指导：
    1. 策略执行力评价。
    2. 针对入场心态和反思给出建议。
    3. 下次遇到类似情况的改进点。
    
    要求：200字以内，语气专业且温和。
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
    
    return response.text || "复盘完成，但 AI 似乎陷入了沉思，没能给出具体文字。";
  } catch (error) {
    console.error("Gemini AI Analysis Error:", error);
    return "AI 导师正在闭关（可能是网络或 Key 权限问题），建议稍后在‘修行历程’中查看详情。";
  }
}
