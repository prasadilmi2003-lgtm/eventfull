import { GoogleGenAI } from '@google/genai'

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return null
  }
  return new GoogleGenAI({ apiKey })
}

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body

    if (
      typeof message !== 'string' ||
      !message.trim() ||
      message.length > 2000
    ) {
      return res.status(400).json({
        message: 'Please provide a message under 2000 characters.',
      })
    }

    const ai = getAiClient()
    if (!ai) {
      console.warn('[EventEase AI] Chat request failed: GEMINI_API_KEY is not configured.')
      return res.status(503).json({
        message: 'The AI assistant is currently not configured. Please set GEMINI_API_KEY.',
      })
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash'

    const response = await ai.models.generateContent({
      model: modelName,
      contents: message.trim(),
      config: {
        systemInstruction:
          'You are EventEase AI, a friendly assistant for an event management platform. Help users with event discovery, event planning, registration, tickets, and general platform questions. Be concise and helpful. Never invent event details, ticket prices, or booking availability. If you do not have access to current event data, explain that clearly.',
      },
    })

    const reply = response.text || 'Sorry, I could not generate a response.'

    return res.status(200).json({
      reply,
    })
  } catch (error) {
    console.error('[EventEase AI Error]:', error.message || error)

    return res.status(500).json({
      message: 'The AI assistant is temporarily unavailable. Please try again.',
    })
  }
}