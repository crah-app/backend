import express from 'express';
import { defaultNamespace } from '../middleware/default.js';

const router = express.Router({ mergeParams: true });
router.use(express.json());
export default router;

router.get('/', (req, res) => {
	defaultNamespace(res);
});
