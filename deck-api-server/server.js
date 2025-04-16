import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import puppeteer from 'puppeteer-core'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const DB_FILE = 'deckCodes.json'

// 輔助函數：讀取資料庫
const readDB = () => {
  try {
    if (!existsSync(DB_FILE)) return {}
    return JSON.parse(readFileSync(DB_FILE, 'utf8'))
  } catch (error) {
    console.error('Error reading DB:', error)
    return {}
  }
}

// 輔助函數：寫入資料庫
const writeDB = (data) => {
  try {
    writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing DB:', error)
  }
}

app.get('/import-decklog/:code', async (req, res) => {
  const decklogCode = req.params.code
  const url = `https://decklog.bushiroad.com/view/${decklogCode}`

  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 })

    const result = await page.evaluate(() => {
      const parseCard = (el) => {
        const count = Number(el.querySelector('.number').textContent.trim())
        const name = el.querySelector('img').getAttribute('alt')
        const idMatch = el.querySelector('img').getAttribute('src').match(/\/([\w-]+)\.(?:png|webp)/)
        const id = idMatch ? idMatch[1] : null
        return id && name ? { id, name, count } : null
      }

      const leaderEl = document.querySelector('.deck-leader .card')
      const mainEls = document.querySelectorAll('.main-deck .card')
      const donEls = document.querySelectorAll('.don-deck .card')

      const leader = leaderEl ? parseCard(leaderEl) : null
      const main = Array.from(mainEls).map(parseCard).filter(Boolean)
      const don = Array.from(donEls).map(parseCard).filter(Boolean)

      return { leader, main, don }
    })

    await browser.close()
    res.json(result)
  } catch (err) {
    console.error('Puppeteer error:', err)
    res.status(500).json({ error: 'Failed to fetch decklog data' })
  }
})

app.get('/load/:code', (req, res) => {
  const { code } = req.params
  const db = readDB()
  if (db[code]) {
    res.json(db[code])
  } else {
    res.status(404).json({ error: 'Code not found' })
  }
})

app.post('/save/:code', (req, res) => {
  const { code } = req.params
  const deckData = req.body
  const db = readDB()
  db[code] = deckData
  writeDB(db)
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
