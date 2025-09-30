import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Read the Apple Pay verification file from the correct location
    const filePath = path.join(process.cwd(), '.well-known', 'apple-developer-merchantid-domain-association')
    const fileContent = fs.readFileSync(filePath, 'utf8')
    
    // Return the file content with the correct content-type
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving Apple Pay verification file:', error)
    return new NextResponse('File not found', { status: 404 })
  }
}