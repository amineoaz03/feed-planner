const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`

async function toBase64(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve({
      data: reader.result.split(',')[1],
      mimeType: blob.type || 'image/jpeg',
    })
    reader.readAsDataURL(blob)
  })
}

export async function generateCaption(imageUrl, language = 'English') {
  const { data, mimeType } = await toBase64(imageUrl)

  const prompt = `You are a social media expert. Write an engaging Instagram caption for this photo.
- Language: ${language}
- Tone: authentic, not overly promotional
- Include 5-8 relevant hashtags at the end
- Return only the caption text, nothing else`

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt },
        ],
      }],
    }),
  })

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const json = await res.json()
  return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}
