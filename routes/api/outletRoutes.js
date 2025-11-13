const express = require('express');
const outletController = require('../../controllers/outletController');

const router = express.Router();

router.get('/', outletController.getOutlets);
router.get('/:id', outletController.getOutletById);
router.post('/', outletController.createOutlet);
router.put('/:id', outletController.updateOutlet);
router.delete('/:id', outletController.deleteOutlet);

module.exports = router;

