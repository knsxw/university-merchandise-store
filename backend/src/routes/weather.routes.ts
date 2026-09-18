import { Router } from 'express';
import { getWeatherRecommendations } from '../controllers/weather.controller';

const router = Router();

router.get('/recommendations', getWeatherRecommendations);

export default router;
