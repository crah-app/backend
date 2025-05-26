import express from 'express';
import { Response, Request } from 'express';
import {
	getAllPosts,
	getAllPostsByUserId,
	// getAllPostsFromFriends,
	// getAllPostsFromRank,
	getPost,
	// getPostFromRank,
} from '../middleware/posts.js';
import { dbConnection } from '../constants/dbConnection.js';
import { errorHandler } from '../constants/errors.js';

const router = express.Router({ mergeParams: true });
router.use(express.json());
export default router;

/* 
e.g

curl http://localhost:4000/api/posts/post/1

returns a post
*/

router.get('/post/:postId', async (req: Request, res: Response) => {
	errorHandler(await getPost(req, res, dbConnection), res);
});

/* 
e.g

curl http://localhost:4000/api/posts/user/user_2vlanCL8M2qebrHnMGQgqdfz7Wo

returns all posts from user 
*/

router.get('/user/:userId', async (req: Request, res: Response) => {
	errorHandler(await getAllPostsByUserId(res, req, dbConnection), res);
});

/* 
e.g

curl http://localhost:4000/api/posts/user/user_2vlanCL8M2qebrHnMGQgqdfz7Wo/friends/all

returns all posts from the users friends
*/

router.get('/user/:userId/friends/all', async (req: Request, res: Response) => {
	// errorHandler(await getAllPostsFromFriends(res, req, dbConnection), res);
});

/* 
e.g

curl http://localhost:4000/api/posts/all

returns all posts
*/

router.get('/all', async (req: Request, res: Response) => {
	errorHandler(await getAllPosts(res, req, dbConnection), res);
});

/* 
e.g

curl http://localhost:4000/api/posts/rank/silver/all

returns all posts from the current rank
*/

router.get('/rank/:rank/all', async (req: Request, res: Response) => {
	// errorHandler(await getAllPostsFromRank(res, req, dbConnection), res);
});

/* 
e.g

curl http://localhost:4000/api/posts/:rank/silver/1

returns one post from the a rank
*/

router.get('/rank/:rank/:postId', async (req: Request, res: Response) => {
	// errorHandler(await getPostFromRank(res, req, dbConnection), res);
});
