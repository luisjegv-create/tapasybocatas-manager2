import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface ExtractedInvoiceItem {
  itemName: string;
  quantity: number;
  totalCost: number;
}

export interface ExtractedInvoiceData {
  supplierName: string;
  date: string;
  totalAmount: number;
  items: ExtractedInvoiceItem[];
}

export const analyzeInvoiceImage = async (base64Image: string, mimeType: string): Promise<ExtractedInvoiceData> => {
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure process.env.API_KEY is set.");
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: "Analyze this supplier invoice image. Extract the supplier name, the date (YYYY-MM-DD), the total amount, and a list of items with their names, quantities, and individual total costs. Return pure JSON.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          supplierName: { type: Type.STRING },
          date: { type: Type.STRING, description: "Format YYYY-MM-DD" },
          totalAmount: { type: Type.NUMBER },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                itemName: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                totalCost: { type: Type.NUMBER },
              },
            },
          },
        },
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(text) as ExtractedInvoiceData;
};

// --- CHATBOT LOGIC ---

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_INSTRUCTION = `
Eres Benneti, el Asistente Experto de la aplicación "Tapas y Bocatas Manager". Tu trabajo es ayudar a camareros, cocineros y gerentes a usar la aplicación.
Responde de forma breve, concisa y amable. Usa emojis de comida para ser amigable.

CONOCIMIENTO DE LA APP:
1. TPV/Comandas: Sirve para tomar notas. Tiene buscador, categorías (Tapas, Bocatas, Bebidas con subsecciones Vinos/Licores). Permite notas a cocina ("Sin cebolla"). Botón "Cocina" envía ticket, "Crear Ticket" imprime cuenta, "Cobrar" cierra mesa.
2. Monitor Cocina (KDS): Pantalla para cocineros. Colores: Verde (<5min), Amarillo (5-15min), Rojo (>15min). Ciclo: Botón "Oído" (Cocinando) -> Botón "Servido" (Terminado).
3. Almacén: Gestión de stock. Tiene "Bodega Sommelier" (vinos con D.O.), "Bar & Mixología" (Licores), y "Asistente Reposición" (calcula compras automáticas).
4. Mermas: En Almacén, botón "Papelera" (Color Naranja) para registrar comida tirada (Rotura, Caducidad).
5. Escandallos: Recetas para calcular costes. Permite poner ingredientes en gramos/ml. Tiene alertas de Alérgenos.
6. Finanzas: Dashboard con matriz de rentabilidad (Estrellas, Perros, etc.) y Calendario Financiero.
7. Personal: Para fichar entrada/salida.
8. Consumo Propio: Botón morado en TPV. Descuenta stock pero coste 0€ (no descuadra caja).

Si te preguntan algo fuera de la app, di amablemente que solo sabes gestionar el restaurante.
`;

export const getChatHelpResponse = async (history: ChatMessage[], userMessage: string): Promise<string> => {
    if (!apiKey) return "Error: No hay API Key configurada. Contacta con el administrador.";

    try {
        // Filter history to conform to Gemini's strict User -> Model -> User policy
        // We must remove the initial "Welcome" message if it comes from the model without a preceding user message
        const apiHistory = history.filter((msg, index) => {
             // If it's the very first message and it's from the model (our UI welcome msg), skip it
             if (index === 0 && msg.role === 'model') return false;
             return true;
        }).map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        // Add the new user message
        const contents = [
            ...apiHistory,
            { role: 'user', parts: [{ text: userMessage }] }
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents as any,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION // Use proper system instruction field
            }
        });

        return response.text || "Lo siento, no he entendido eso.";
    } catch (error) {
        console.error("Chat Error:", error);
        return "Tengo problemas de conexión con mi cerebro digital ahora mismo. Inténtalo en unos segundos. 🧠🔌";
    }
};