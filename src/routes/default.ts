import express from 'express';
import { defaultNamespace } from '../middleware/default.js';

const router = express.Router({ mergeParams: true })
export default router;

router.get("/", (req, res) => {
	defaultNamespace(res);
});
