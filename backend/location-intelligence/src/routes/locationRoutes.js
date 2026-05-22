import { Router } from 'express'
import { searchMoroccoLocations } from '../services/locationSearchEngine.js'

const router = Router()

router.get('/search', async (request, response) => {
  const query = request.query.q ?? ''
  const limit = Math.min(Number(request.query.limit ?? 8), 10)

  try {
    const result = await searchMoroccoLocations(query, limit)
    response.json(result)
  } catch (error) {
    response.status(500).json({
      query: String(query),
      results: [],
      error: 'location_search_failed',
      message: error instanceof Error ? error.message : 'Search failed.',
    })
  }
})

export default router
