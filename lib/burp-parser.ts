export interface ParsedRequest {
  method: string
  url: string
  path: string
  host: string
  protocol: string
  headers: Record<string, string>
  body: string
  rawRequest: string
}

export interface ParsedResponse {
  statusCode: number
  statusText: string
  headers: Record<string, string>
  body: string
  rawResponse: string
}

export interface BurpWebhookPayload {
  request: string
  response?: string
  host: string
  port: number
  protocol: string
  url: string
  method: string
  path: string
  timestamp?: string
}

export function parseHttpRequest(rawRequest: string): ParsedRequest {
  const lines = rawRequest.split('\r\n').length > 1
    ? rawRequest.split('\r\n')
    : rawRequest.split('\n')

  // Parse request line
  const requestLine = lines[0]
  const [method, path, protocol] = requestLine.split(' ')

  // Parse headers
  const headers: Record<string, string> = {}
  let bodyStartIndex = -1

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line === '') {
      bodyStartIndex = i + 1
      break
    }
    const colonIndex = line.indexOf(':')
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim()
      const value = line.slice(colonIndex + 1).trim()
      headers[key] = value
    }
  }

  // Extract body
  const body = bodyStartIndex !== -1
    ? lines.slice(bodyStartIndex).join('\n')
    : ''

  // Extract host
  const host = headers['Host'] || headers['host'] || ''
  const protocolScheme = protocol?.includes('HTTPS') ? 'https' : 'http'

  return {
    method: method || 'GET',
    url: `${protocolScheme}://${host}${path}`,
    path: path || '/',
    host,
    protocol: protocolScheme,
    headers,
    body,
    rawRequest,
  }
}

export function parseHttpResponse(rawResponse: string): ParsedResponse {
  const lines = rawResponse.split('\r\n').length > 1
    ? rawResponse.split('\r\n')
    : rawResponse.split('\n')

  // Parse status line
  const statusLine = lines[0]
  const statusMatch = statusLine.match(/HTTP\/[\d.]+\s+(\d+)\s*(.*)/)
  const statusCode = statusMatch ? parseInt(statusMatch[1]) : 0
  const statusText = statusMatch ? statusMatch[2] : ''

  // Parse headers
  const headers: Record<string, string> = {}
  let bodyStartIndex = -1

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line === '') {
      bodyStartIndex = i + 1
      break
    }
    const colonIndex = line.indexOf(':')
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim()
      const value = line.slice(colonIndex + 1).trim()
      headers[key] = value
    }
  }

  // Extract body
  const body = bodyStartIndex !== -1
    ? lines.slice(bodyStartIndex).join('\n')
    : ''

  return {
    statusCode,
    statusText,
    headers,
    body,
    rawResponse,
  }
}

export function formatRequestForAnalysis(parsed: ParsedRequest): string {
  let formatted = `Method: ${parsed.method}\n`
  formatted += `URL: ${parsed.url}\n`
  formatted += `Host: ${parsed.host}\n\n`
  formatted += `Headers:\n`

  for (const [key, value] of Object.entries(parsed.headers)) {
    formatted += `  ${key}: ${value}\n`
  }

  if (parsed.body) {
    formatted += `\nBody:\n${parsed.body}`
  }

  return formatted
}

export function formatResponseForAnalysis(parsed: ParsedResponse): string {
  let formatted = `Status: ${parsed.statusCode} ${parsed.statusText}\n\n`
  formatted += `Headers:\n`

  for (const [key, value] of Object.entries(parsed.headers)) {
    formatted += `  ${key}: ${value}\n`
  }

  if (parsed.body) {
    // Truncate very long bodies
    const maxBodyLength = 10000
    const bodyPreview = parsed.body.length > maxBodyLength
      ? parsed.body.slice(0, maxBodyLength) + '\n[... truncated]'
      : parsed.body
    formatted += `\nBody:\n${bodyPreview}`
  }

  return formatted
}

export function identifyQuickWins(request: ParsedRequest): string[] {
  const quickWins: string[] = []

  // Check for potential injection points
  if (request.path.includes('=')) {
    quickWins.push('URL contains query parameters - potential injection point')
  }

  if (request.body) {
    // Check for JSON body
    if (request.headers['Content-Type']?.includes('application/json')) {
      quickWins.push('JSON body detected - check for object injection')
    }
    // Check for form data
    if (request.headers['Content-Type']?.includes('x-www-form-urlencoded')) {
      quickWins.push('Form data detected - check for parameter tampering')
    }
  }

  // Check for authentication headers
  if (request.headers['Authorization']) {
    quickWins.push('Authorization header present - verify token security')
  }

  if (request.headers['Cookie']) {
    quickWins.push('Cookies present - check session management')
  }

  // Check for security headers missing
  const url = new URL(request.url)
  if (url.protocol === 'http:') {
    quickWins.push('HTTP (not HTTPS) - potential MitM vulnerability')
  }

  return quickWins
}
