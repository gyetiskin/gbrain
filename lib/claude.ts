import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface AnalysisResult {
  vulnerabilities: Vulnerability[]
  summary: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
}

export interface Vulnerability {
  name: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: string
  evidence: string
  remediation: string
  owaspCategory?: string
}

const SECURITY_SYSTEM_PROMPT = `Sen GBrain, siber guvenlik konusunda uzman bir AI asistanisın. Web uygulama guvenligi, penetrasyon testi ve zafiyet degerlendirmesi konularinda derin bilgiye sahipsin.

UZMANLIK ALANLARIN:
- OWASP Top 10 zafiyetleri
- HTTP protokolu ve web guvenligi
- SQL injection, XSS, CSRF, SSRF ve diger web zafiyetleri
- Kimlik dogrulama ve yetkilendirme açıkları
- API guvenlik testleri
- Burp Suite ve diger guvenlik araclari
- Guvenli kodlama pratikleri
- Network guvenligi ve sizma testleri

ONEMLI KURALLAR:
1. Kullanici ile yaptigin TUM konuşmalari HATIRLA
2. Onceki konuşmalarda bahsedilen projeler, sistemler, zafiyetler hakkinda bilgi ver
3. Kullanici bir sey sorduğunda, onceki konuşmalardan ilgili bilgileri çek ve "Daha once bunlardan bahsetmistik..." diye hatırlat
4. Kullanicinin bilgi tabanindaki dokumanlari da dikkate al
5. Yaratici oneriler sun: "Bu durumda sunlari yapabiliriz..." diye secenekler sun
6. Her zaman Turkce yanit ver

HTTP ANALIZI YAPARKEN:
1. Potansiyel guvenlik zafiyetlerini tespit et
2. Risk ve etkisini acikla
3. Spesifik cozum adimlari sun
4. Ilgili OWASP kategorilerini referans goster

Kapsamli ama oz ol. Bulgulari ciddiyet sirasina gore sirala.`

export async function chat(
  messages: Message[],
  context?: string,
  conversationSummary?: string
): Promise<string> {
  let systemPrompt = SECURITY_SYSTEM_PROMPT

  if (conversationSummary) {
    systemPrompt += `\n\n--- ONCEKI KONUSMALARINIZIN OZETI ---\n${conversationSummary}\n--- OZET SONU ---`
  }

  if (context) {
    systemPrompt += `\n\n--- BILGI TABANINDAN ILGILI ICERIK ---\n${context}\n--- ICERIK SONU ---`
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  const textContent = response.content.find(c => c.type === 'text')
  return textContent ? textContent.text : ''
}

export async function summarizeConversation(messages: Message[]): Promise<string> {
  if (messages.length < 10) return ''

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Asagidaki konusmayi ozetle. Onemli bilgileri, projelerı, zafiyetleri, kullanicinin ilgilendigi konulari ve alinan kararlari belirt. Turkce yaz.

KONUSMA:
${messages.map(m => `${m.role === 'user' ? 'Kullanici' : 'GBrain'}: ${m.content}`).join('\n\n')}

OZET:`,
      },
    ],
  })

  const textContent = response.content.find(c => c.type === 'text')
  return textContent ? textContent.text : ''
}

export async function analyzeRequest(
  request: string,
  response?: string,
  context?: string
): Promise<AnalysisResult> {
  let systemPrompt = SECURITY_SYSTEM_PROMPT + `

Analiz yaparken asagidaki JSON formatinda yanit ver:
{
  "vulnerabilities": [
    {
      "name": "Zafiyet adi",
      "severity": "low|medium|high|critical",
      "description": "Detayli aciklama",
      "location": "Request/response'da nerede",
      "evidence": "Request/response'dan spesifik kanit",
      "remediation": "Nasil duzeltilir",
      "owaspCategory": "Varsa OWASP kategorisi"
    }
  ],
  "summary": "Kisa genel degerlendirme",
  "riskLevel": "low|medium|high|critical",
  "recommendations": ["Oneriler listesi"]
}`

  if (context) {
    systemPrompt += `\n\nBilgi tabanindan ilgili icerik:\n${context}`
  }

  let userMessage = `Bu HTTP istegini guvenlik zafiyetleri acisindan analiz et:\n\n${request}`

  if (response) {
    userMessage += `\n\nHTTP Yaniti:\n${response}`
  }

  const aiResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textContent = aiResponse.content.find(c => c.type === 'text')
  const text = textContent ? textContent.text : '{}'

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as AnalysisResult
    } catch {
      return {
        vulnerabilities: [],
        summary: text,
        riskLevel: 'low',
        recommendations: [],
      }
    }
  }

  return {
    vulnerabilities: [],
    summary: text,
    riskLevel: 'low',
    recommendations: [],
  }
}

export async function analyzeImage(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
  prompt?: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: SECURITY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt || 'Bu gorseldeki tum metin ve guvenlikle ilgili bilgileri cikar ve analiz et. Eger bu bir guvenlik araci screenshotu, zafiyet raporu veya kod ise detayli analiz yap.',
          },
        ],
      },
    ],
  })

  const textContent = response.content.find(c => c.type === 'text')
  return textContent ? textContent.text : ''
}

export async function generateEmbeddingText(content: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Bu guvenlikle ilgili icerigin semantik arama indekslemesi icin kisa bir ozetini olustur. Bahsedilen temel kavramlara, zafiyetlere, tekniklere ve araclara odaklan:\n\n${content.slice(0, 8000)}`,
      },
    ],
  })

  const textContent = response.content.find(c => c.type === 'text')
  return textContent ? textContent.text : content.slice(0, 1000)
}
