// Frontend helper proxying requests through local server endpoint /api/groq

export async function queryGroqChat({ messages, temperature = 0.7 }) {
  try {
    const res = await fetch("/api/groq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, temperature }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "Groq server API returned an error.");
    }

    return data.result || "";
  } catch (err) {
    console.error("Groq query error:", err);
    throw new Error(err.message || "Failed to reach AI service.");
  }
}

export async function queryTmdbMovies({ query }) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=ce136bc559c94267dd125621d128f1c5&query=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results ? data.results.slice(0, 5) : [];
  } catch (err) {
    console.error("TMDB error:", err);
    return null;
  }
}
