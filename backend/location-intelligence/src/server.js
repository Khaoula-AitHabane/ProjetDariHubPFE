import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import locationRoutes from './routes/locationRoutes.js'

const app = express()
const port = Number(process.env.LOCATION_API_PORT ?? 8787)

app.use(cors())
app.use(express.json())

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'morocco-location-intelligence-api',
  })
})

app.use('/api/location', locationRoutes)

app.listen(port, () => {
  console.log(`Morocco Location Intelligence API listening on http://127.0.0.1:${port}`)
})
