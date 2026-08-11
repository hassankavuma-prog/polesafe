// PoleSafe — Pricing Routes
// Smart pricing engine with aggressive rates to beat competitors

const express = require('express');
const router = express.Router();
const pricingEngine = require('../services/pricingEngine');
const { authMiddleware } = require('../middleware/auth');

// ============================================================
// GET /api/pricing/estimate — Price estimate for a trip (no auth needed — public)
// ============================================================
router.get('/estimate', async (req, res) => {
  try {
    const { vehicleType, distance, duration, weather, school } = req.query;

    if (!vehicleType || !['boda', 'car'].includes(vehicleType)) {
      return res.status(400).json({ error: 'vehicleType must be "boda" or "car"' });
    }
    if (!distance || isNaN(distance) || distance <= 0) {
      return res.status(400).json({ error: 'distance must be a positive number (km)' });
    }

    const fare = await pricingEngine.calculateFare(vehicleType, parseFloat(distance), parseFloat(duration || 0), {
      weather: weather || null,
      schoolSubsidized: school === 'true',
    });

    res.json({ fare });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/pricing/school-subscription — School subscription estimate (auth required)
// ============================================================
router.get('/school-subscription', authMiddleware, async (req, res) => {
  try {
    const { distance, tripsPerDay, daysPerWeek } = req.query;

    if (!distance || isNaN(distance) || distance <= 0) {
      return res.status(400).json({ error: 'distance must be a positive number (km)' });
    }

    const subscription = pricingEngine.calculateSchoolSubscription(
      parseFloat(distance),
      parseInt(tripsPerDay) || 2,
      parseInt(daysPerWeek) || 5
    );

    res.json({ subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/pricing/competitors — Competitor comparison (public)
// ============================================================
router.get('/competitors', async (req, res) => {
  const comparison = pricingEngine.getCompetitorComparison();
  res.json({ comparison });
});

// ============================================================
// GET /api/pricing/rates — Current base rates (public)
// ============================================================
router.get('/rates', async (req, res) => {
  res.json({
    boda: { minFare: 2500, perKm: 1000, perMin: 80, commission: '10%' },
    car: { minFare: 3500, perKm: 1500, perMin: 120, commission: '12%' },
    timeAdjustments: [
      { label: 'Morning rush (6-9 AM)', adjustment: '+15%' },
      { label: 'Evening rush (5-8 PM)', adjustment: '+15%' },
      { label: 'Late night (10 PM-5 AM)', adjustment: '+20%' },
    ],
    weatherAdjustments: { lightRain: '+10%', heavyRain: '+20%' },
    rounding: 'Nearest 500 UGX',
    schoolSubsidy: '10% discount funded by school subscription revenue',
    slogan: 'From Home to School. And Beyond. 🚸',
  });
});

module.exports = router;
