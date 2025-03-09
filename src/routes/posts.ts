import express from 'express';
import { Response, Request } from 'express';
import { getPost } from '../middleware/posts.js';
import { dbConnection } from '../constants/dbConnection.js';
import { errorHandler } from '../constants/errors.js';

const router = express.Router({ mergeParams: true })

export default router;

/* 
e.g

curl http://localhost:4000/api/posts?postId=2 --output post.zip
*/

router.get('/:postId', async (req: Request, res: Response) => {
  errorHandler(await getPost(req, res, dbConnection), res);
});

