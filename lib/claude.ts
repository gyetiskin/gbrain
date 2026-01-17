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

const SECURITY_SYSTEM_PROMPT = `You are GBrain, an expert cybersecurity AI assistant specializing in web application security, penetration testing, and vulnerability assessment. You have deep knowledge of:

- OWASP Top 10 vulnerabilities
- HTTP protocol and web security
- SQL injection, XSS, CSRF, SSRF, and other web vulnerabilities
- Authentication and authorization flaws
- API security testing
- Burp Suite and other security tools
- Secure coding practices

When analyzing HTTP requests/responses:
1. Identify potential security vulnerabilities
2. Explain the risk and impact
3. Provide specific remediation steps
4. Reference relevant OWASP categories
5. Consider the context from the knowledge base

Be thorough but concise. Prioritize findings by severity.`

export async function chat(
  messages: Message[],
  context?: string
): Promise<string> {
  let systemPrompt = SECURITY_SYSTEM_PROMPT

  if (context) {
    systemPrompt += `\n\nRelevant context from knowledge base:\n${context}`
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
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

When analyzing, respond in the following JSON format:
{
  "vulnerabilities": [
    {
      "name": "Vulnerability name",
      "severity": "low|medium|high|critical",
      "description": "Detailed description",
      "location": "Where in the request/response",
      "evidence": "Specific evidence from the request/response",
      "remediation": "How to fix",
      "owaspCategory": "OWASP category if applicable"
    }
  ],
  "summary": "Brief overall assessment",
  "riskLevel": "low|medium|high|critical",
  "recommendations": ["List of recommendations"]
}`

  if (context) {
    systemPrompt += `\n\nRelevant context from knowledge base:\n${context}`
  }

  let userMessage = `Analyze this HTTP request for security vulnerabilities:\n\n${request}`

  if (response) {
    userMessage += `\n\nHTTP Response:\n${response}`
  }

  const aiResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
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
    max_tokens: 4096,
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
            text: prompt || 'Extract and analyze all text and security-relevant information from this image. If this is a screenshot of a security tool, vulnerability report, or code, provide detailed analysis.',
          },
        ],
      },
    ],
  })

  const textContent = response.content.find(c => c.type === 'text')
  return textContent ? textContent.text : ''
}

export async function generateEmbeddingText(content: string): Promise<string> {
  // For ChromaDB, we'll use the content directly as it has its own embedding model
  // But we can use Claude to create a summary for better semantic search
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Create a concise summary of this security-related content for semantic search indexing. Focus on key concepts, vulnerabilities, techniques, and tools mentioned:\n\n${content.slice(0, 8000)}`,
      },
    ],
  })

  const textContent = response.content.find(c => c.type === 'text')
  return textContent ? textContent.text : content.slice(0, 1000)
}
