
import { GoogleGenAI } from "@google/genai";
import { InvestmentPlan } from "../types";

export async function analyzeTradeReview(plan: InvestmentPlan, currentDate: string): Promise<string> {
  // 1. 尝试从环境变量获取
  let apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  
  // 2. 如果环境没有，但 AI Studio 提供了 Key
  if (!apiKey) {
    console.warn("API_KEY is not defined in process.env, checking window.aistudio...");
    // 注意：这里无法异步获取 key，必须依赖之前注入或外部环境
    throw new Error("API_KEY_MISSING");
  }

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
    
    请按以下三个维度点评（总共不超过200字）：
    1. 【执行力检查】：是否做到了知行合一？
    2. 【心理博弈】：针对其心态（如${plan.psychologicalState}）给出修行建议。
    3. 【老散寄语】：一句话总结这笔交易的进阶点。
    
    语气：稳健、睿智、温和但有力量。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    
    return response.text || "这笔交易让我也陷入了深思，你做到了独立思考，这就是进步。";
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    // 如果 Key 选择错误或未找到实体
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_INVALID");
    }
    
    if (error.message?.includes("API_KEY_INVALID") || error.status === 403 || error.status === 401) {
      throw new Error("API_KEY_INVALID");
    }
    
    return "AI 导师正在复盘其他选手的单子，但这笔盈亏已经记录在案，继续保持纪律！";
  }
}
