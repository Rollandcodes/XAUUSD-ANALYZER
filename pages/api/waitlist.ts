import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { sendWaitlistEmail } from '@/lib/email'

interface WaitlistEntry {
  id: string
  name: string
  email: string
  interested: boolean
  comments: string
  referralCode: string
  createdAt: string
  source: string
}

interface ApiResponse {
  success: boolean
  message: string
  referralCode?: string
  emailSent?: boolean
  error?: string
}

// Get waitlist data file path
const getDataPath = () => {
  const dataDir = path.join(process.cwd(), 'data')
  const filePath = path.join(dataDir, 'waitlist.json')
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  return filePath
}

// Load existing waitlist entries
const loadWaitlist = (): WaitlistEntry[] => {
  try {
    const filePath = getDataPath()
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading waitlist:', error)
  }
  return []
}

// Save waitlist entries
const saveWaitlist = (entries: WaitlistEntry[]): boolean => {
  try {
    const filePath = getDataPath()
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('Error saving waitlist:', error)
    return false
  }
}

// Generate unique referral code
const generateReferralCode = (email: string): string => {
  const base = email.split('@')[0].toUpperCase().slice(0, 4)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${base}${random}`
}

// Check if email already exists
const emailExists = (email: string): boolean => {
  const waitlist = loadWaitlist()
  return waitlist.some(entry => entry.email.toLowerCase() === email.toLowerCase())
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'POST') {
    return handlePostRequest(req, res)
  }

  if (req.method === 'GET') {
    return handleGetRequest(req, res)
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
  })
}

async function handlePostRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    const { name, email, interested = true, comments = '', source = 'website' } = req.body

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required',
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      })
    }

    // Check if email already exists
    if (emailExists(email)) {
      return res.status(200).json({
        success: true,
        message: 'You are already on our waitlist!',
        referralCode: loadWaitlist().find(e => e.email.toLowerCase() === email.toLowerCase())?.referralCode,
      })
    }

    // Create new entry
    const referralCode = generateReferralCode(email)
    const newEntry: WaitlistEntry = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      interested,
      comments: comments.trim(),
      referralCode,
      createdAt: new Date().toISOString(),
      source,
    }

    // Load existing waitlist and add new entry
    const waitlist = loadWaitlist()
    waitlist.push(newEntry)

    // Save updated waitlist
    const saved = saveWaitlist(waitlist)
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save your email. Please try again.',
      })
    }

    // Send welcome email
    const emailSent = await sendWaitlistEmail({
      name,
      email,
      appName: 'PipNexus',
    })

    const emailStatusMessage = emailSent
      ? 'Welcome email sent successfully.'
      : 'You are on the waitlist, but we could not send the welcome email right now.'

    // Log signup
    console.log(`[WAITLIST] New signup: ${name} (${email}) - Referral: ${referralCode}`)
    if (comments) {
      console.log(`[WAITLIST] Comments: ${comments}`)
    }

    return res.status(201).json({
      success: true,
      message: `Welcome to the waitlist! ${emailStatusMessage}`,
      referralCode,
      emailSent,
    })
  } catch (error) {
    console.error('[WAITLIST API] Error:', error)
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

async function handleGetRequest(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Protected endpoint - in production, add authentication
  try {
    const waitlist = loadWaitlist()
    return res.status(200).json({
      success: true,
      message: `Total waitlist entries: ${waitlist.length}`,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve waitlist data',
    })
  }
}
