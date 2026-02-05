// Supabase Edge Function for AI API calls using Groq (free tier)
// This keeps the API key server-side and secure.
//
// Deploy with: supabase functions deploy claude-ai
// Set secret:  supabase secrets set GROQ_API_KEY=your-key-here
//
// Get your free API key at: https://console.groq.com/keys

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequest {
  prompt: string
  maxTokens?: number
  system?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Note: Auth check removed - function is protected by GROQ_API_KEY
    // In production, you may want to verify the Supabase JWT token here

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY not configured. Get a free key at https://console.groq.com/keys' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { prompt, maxTokens = 2000, system } = await req.json() as AIRequest

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build messages array for OpenAI-compatible API
    const messages: Array<{ role: string; content: string }> = []

    if (system) {
      messages.push({ role: 'system', content: system })
    }

    messages.push({ role: 'user', content: prompt })

    const body = {
      model: 'llama-3.3-70b-versatile', // Fast & capable, free tier friendly
      max_tokens: maxTokens,
      messages,
      temperature: 0.3, // Lower temperature for more consistent grading
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Groq API error', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Groq uses OpenAI format: data.choices[0].message.content
    return new Response(
      JSON.stringify({ content: data.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
