
import { GoogleGenAI } from "@google/genai";
import { Client, Payment } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const generateGeminiResponse = async (
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro',
  contents: { role: 'user' | 'model', parts: { text: string }[] }[],
  systemInstruction: string,
  thinkingBudget?: number
) => {
  try {
    const config: any = {
      systemInstruction,
    };
    if (thinkingBudget) {
      config.thinkingConfig = { thinkingBudget };
    }
    const response = await ai.models.generateContent({
      model,
      contents, // Pass the full conversation history
      config,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return "Lo siento, encontré un error al procesar tu solicitud. Por favor, revisa la consola para más detalles.";
  }
};


export const getChatbotResponse = async (
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  newMessage: string,
  isThinkingMode: boolean,
  clients: Client[],
  payments: Payment[]
): Promise<string> => {
  const model = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const thinkingBudget = isThinkingMode ? 32768 : undefined;

  const dataContext = `
    Aquí están los datos actuales del sistema de cobros de la empresa en formato JSON.
    Usa estos datos para responder las preguntas del usuario.
    La fecha de hoy es ${new Date().toLocaleDateString()}.

    Clientes:
    ${JSON.stringify(clients, null, 2)}

    Pagos:
    ${JSON.stringify(payments, null, 2)}
    `;

  const systemInstruction = `Eres un asistente experto de IA para "GPS Tracker Panama". Tu rol es ayudar al usuario a gestionar los datos de sus clientes y pagos de manera eficiente.
    Eres amigable, conciso y profesional.
    Analiza los datos JSON proporcionados para responder preguntas sobre clientes, pagos, cuentas vencidas, ingresos y otras métricas del negocio.
    Cuando se te pida generar un informe, formatéalo claramente usando Markdown.
    ${dataContext}
    `;
    
  // The initial messages from the chatbot component are just for display.
  // We filter out the initial bot message to not confuse the model.
  const relevantHistory = history.filter(m => m.parts[0].text !== "¡Hola! ¿Cómo puedo ayudarte a gestionar tus cobros hoy?");

  const conversationHistory = [
      ...relevantHistory,
      { role: 'user' as const, parts: [{ text: newMessage }] }
  ];

  return generateGeminiResponse(model, conversationHistory, systemInstruction, thinkingBudget);
};
