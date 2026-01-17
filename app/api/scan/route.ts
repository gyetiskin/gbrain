import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spawn, ChildProcess } from 'child_process'

// Store active scans
const activeScans: Map<string, { process: ChildProcess; output: string[] }> = new Map()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, wordlist, method = 'GET', headers = {}, extensions = '', threads = 40 } = await request.json()

    if (!url || !wordlist) {
      return NextResponse.json({ error: 'URL and wordlist are required' }, { status: 400 })
    }

    // Build FFUF command
    const args = [
      '-u', url,
      '-w', wordlist,
      '-X', method,
      '-t', threads.toString(),
      '-o', '-', // Output to stdout
      '-of', 'json',
      '-mc', 'all', // Match all status codes initially
      '-fc', '404', // Filter 404s
    ]

    // Add extensions if provided
    if (extensions) {
      args.push('-e', extensions)
    }

    // Add headers
    for (const [key, value] of Object.entries(headers)) {
      args.push('-H', `${key}: ${value}`)
    }

    const scanId = `scan_${Date.now()}_${session.user.id}`

    // Start FFUF process
    const ffufProcess = spawn('ffuf', args)
    const output: string[] = []

    activeScans.set(scanId, { process: ffufProcess, output })

    ffufProcess.stdout.on('data', (data) => {
      output.push(data.toString())
    })

    ffufProcess.stderr.on('data', (data) => {
      output.push(`[ERROR] ${data.toString()}`)
    })

    ffufProcess.on('close', (code) => {
      output.push(`[COMPLETED] Exit code: ${code}`)
    })

    ffufProcess.on('error', (error) => {
      output.push(`[ERROR] ${error.message}`)
      activeScans.delete(scanId)
    })

    return NextResponse.json({
      scanId,
      status: 'started',
      message: 'FFUF scan started',
    })
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('scanId')

    if (!scanId) {
      return NextResponse.json({ error: 'Scan ID is required' }, { status: 400 })
    }

    const scan = activeScans.get(scanId)

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
    }

    const isRunning = !scan.process.killed && scan.process.exitCode === null

    // Parse JSON results from output
    let results: unknown[] = []
    const jsonOutput = scan.output.join('')
    try {
      if (jsonOutput.includes('"results"')) {
        const parsed = JSON.parse(jsonOutput)
        results = parsed.results || []
      }
    } catch {
      // Output may not be complete JSON yet
    }

    return NextResponse.json({
      scanId,
      status: isRunning ? 'running' : 'completed',
      output: scan.output,
      results,
    })
  } catch (error) {
    console.error('Scan GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('scanId')

    if (!scanId) {
      return NextResponse.json({ error: 'Scan ID is required' }, { status: 400 })
    }

    const scan = activeScans.get(scanId)

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
    }

    // Kill the process
    scan.process.kill('SIGTERM')
    activeScans.delete(scanId)

    return NextResponse.json({
      scanId,
      status: 'stopped',
      message: 'Scan stopped',
    })
  } catch (error) {
    console.error('Scan DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
