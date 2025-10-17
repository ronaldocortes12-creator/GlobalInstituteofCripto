// Serverless function para chat com Jeff Wu
// Esta função será deployada como Vercel Edge Function

import { JEFF_WU_SYSTEM_PROMPT } from '../src/lib/jeffWuSystemPrompt.js'

export const config = {
  runtime: 'edge'
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { messages } = await req.json()

    // Get Gemini API key
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Prepare messages for Gemini API
    // Gemini doesn't support system messages, so we prepend the system prompt as the first user message
    const geminiMessages = [
      {
        role: 'user',
        parts: [{ text: JEFF_WU_SYSTEM_PROMPT }]
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido. Sou Jeff Wu, seu professor de trading. Vamos começar?' }]
      }
    ]

    // Add user messages
    for (const msg of messages) {
      geminiMessages.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })
    }

    // Call Google Gemini API with streaming
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
            topP: 0.95,
            topK: 40
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    // Stream response back to client
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim())

            for (const line of lines) {
              try {
                const data = JSON.parse(line)
                
                if (data.candidates && data.candidates[0]?.content?.parts) {
                  const parts = data.candidates[0].content.parts
                  
                  for (const part of parts) {
                    if (part.text) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content: part.text })}\n\n`)
                      )
                    }
                  }
                }
              } catch (e) {
                // Skip invalid JSON lines
                console.error('JSON parse error:', e)
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

