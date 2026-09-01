import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request) {
  try {
    const { messages, temperature = 0.7 } = await request.json();

    // 1. Fetch available models dynamically to avoid 404/400 errors
    const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
    });
    
    if (!modelsRes.ok) {
      return NextResponse.json({ error: "Failed to fetch available models from Groq. Verify your API Key is active." }, { status: 500 });
    }

    const modelsData = await modelsRes.json();
    
    // Filter for text generation models (ignore whisper audio models)
    let availableModels = modelsData.data
      .map(m => m.id)
      .filter(id => !id.toLowerCase().includes('whisper'));

    if (availableModels.length === 0) {
      return NextResponse.json({ error: "No text generation models available on this Groq account." }, { status: 500 });
    }

    // Try available models dynamically
    let lastError = null;

    for (const model of availableModels) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: temperature,
            max_tokens: 1024,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices[0]?.message?.content || "";
          return NextResponse.json({ result: reply });
        } else {
          const errBody = await response.text();
          console.warn(`Groq model ${model} error ${response.status}:`, errBody);
          lastError = `Status ${response.status}: ${errBody}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    return NextResponse.json({ error: lastError || "Groq API request failed across all models." }, { status: 500 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
