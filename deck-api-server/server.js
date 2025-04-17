import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import puppeteer from 'puppeteer'
import { fetchDecklogData } from './decklog-scraper.cjs'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const DB_FILE = 'deckCodes.json'

// ✅ 資料庫操作
const readDB = () => {
  try {
    if (!existsSync(DB_FILE)) return {}
    return JSON.parse(readFileSync(DB_FILE, 'utf8'))
  } catch (error) {
    console.error('Error reading DB:', error)
    return {}
  }
}

const writeDB = (data) => {
  try {
    writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing DB:', error)
  }
}

// ✅ 匯入 decklog
app.get('/import-decklog/:code', async (req, res) => {
  try {
    const data = await fetchDecklogData(req.params.code)
    res.json(data)
  } catch (err) {
    console.error('Puppeteer error:', err)
    res.status(500).json({ error: 'Failed to fetch decklog data' })
  }
})

// ✅ 載入六碼代碼
app.get('/load/:code', (req, res) => {
  const { code } = req.params
  const dbData = readDB()
  if (dbData[code]) {
    res.json(dbData[code])
  } else {
    res.status(404).json({ error: 'Code not found' })
  }
})

// ✅ 儲存六碼代碼
app.post('/save/:code', (req, res) => {
  const { code } = req.params
  const dbData = readDB()
  dbData[code] = req.body
  writeDB(dbData)
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
