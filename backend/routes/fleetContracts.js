const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { z } = require('zod');
const { SchoolTrip, Vehicle, School } = require('../database/schema');
router.use(authMiddleware);

router.get('/:schoolId/contracts', async (req, res) => {
  const scope = validateTenantScopedQuery(z.object({ schoolId: z.string().min(1) }).strict(), { schoolId: req.params.schoolId }, req.userId, ['fleet-contracts:list']);
  const contracts = await SchoolTrip.find({ schoolId: scope.tenantScopedQuery.schoolId }).populate('vehicleId', 'type registrationNumber capacity busLabel compliance');
  res.json({ contracts });
});

router.post('/:schoolId/contracts', async (req, res) => {
  const { tripName, destination, departureDate, returnDate, maxSeats, vehicleId, vehicleSource='external', pricePerHead=0, flatRate=0, busLabel, compliance, registrationNumber, vehicleType='bus' } = req.body;
  const contract = await SchoolTrip.create({ schoolId: req.params.schoolId, createdBy: req.userId, tripName, destination, departureDate, returnDate, maxSeats, vehicleId, vehicleSource, busLabel, pricePerHead, flatRate, status: 'open' });
  if (vehicleId && compliance) await Vehicle.findByIdAndUpdate(vehicleId, { compliance, registrationNumber, type: vehicleType, busLabel });
  res.status(201).json({ contract });
});

router.post('/:schoolId/contracts/:contractId/accept-quote', async (req, res) => {
  const scope = validateTenantScopedQuery(z.object({ schoolId: z.string().min(1) }).strict(), { schoolId: req.params.schoolId }, req.userId, ['fleet-contracts:accept']);
  const contract = await SchoolTrip.findOne({ _id: req.params.contractId, schoolId: scope.tenantScopedQuery.schoolId });
  if (!contract) return res.status(404).json({ error: 'Contract not found' });
  contract.acceptedQuoteIndex = req.body.quoteIndex || 0;
  contract.status = 'confirmed';
  await contract.save();
  res.json({ contract });
});

router.post('/:schoolId/gate-pin', async (req, res) => {
  const scope = validateTenantScopedQuery(z.object({ schoolId: z.string().min(1) }).strict(), { schoolId: req.params.schoolId }, req.userId, ['gate-pin']);
  const { gateName, lat, lng, visitNotes } = req.body;
  const school = await School.findById(scope.tenantScopedQuery.schoolId);
  if (!school) return res.status(404).json({ error: 'School not found' });
  school.gates = school.gates || [];
  school.gates.push({ name: gateName, lat, lng, isActive: true });
  school.gatePinning = { dispatcherId: req.userId, pinnedAt: new Date(), physicalVisitConfirmed: true, visitNotes };
  school.verificationStatus = 'verified';
  await school.save();
  res.json({ school });
});
module.exports = router;
