import express from 'express';
import { Response, Request } from 'express';
import {
	getAllPosts,
	getAllPostsByUserId,
	getCommentsOfPost,
	getPostById,
	getPostFromRank,
	getPostsFromRank,
	getPostsOfFriends,
	setPostComment,
	setPostLikeStatus,
} from '../middleware/posts.js';
import { dbConnection } from '../constants/dbConnection.js';
import { errorHandler } from '../constants/errors.js';

const router = express.Router({ mergeParams: true });
router.use(express.json());
export default router;

// return a specific post
router.get('/post/:postId', async (req: Request, res: Response) => {
	errorHandler(await getPostById(res, req, dbConnection), res);
});

// get all posts from user
router.get('/user/:userId', async (req: Request, res: Response) => {
	errorHandler(await getAllPostsByUserId(res, req, dbConnection), res);
});

// get all posts
router.get('/all/currentUser/:userId', async (req: Request, res: Response) => {
	const userId = req.params.userId;

	errorHandler(await getAllPosts(res, req, dbConnection, userId), res);
});

// get all posts from friends
router.get(
	'/currentUser/:userId/friends',
	async (req: Request, res: Response) => {
		errorHandler(await getPostsOfFriends(res, req, dbConnection), res);
	},
);

// returns one post from a specific rank
router.get('/rank/:rank/:postId', async (req: Request, res: Response) => {
	errorHandler(await getPostFromRank(res, req, dbConnection), res);
});

// get all posts from a specific rank
router.get('/rank/:rank/all', async (req: Request, res: Response) => {
	errorHandler(await getPostsFromRank(req, res, dbConnection), res);
});

router.get('/:postId/comments', async (req: Request, res: Response) => {
	errorHandler(await getCommentsOfPost(res, req, dbConnection), res);
});

// user sets like-status on a post
router.post('/:postId/like/:userId', async (req: Request, res: Response) => {
	errorHandler(await setPostLikeStatus(res, req, dbConnection), res);
});

// user adds a comment to a post
router.post('/:postId/comment/:userId', async (req: Request, res: Response) => {
	errorHandler(await setPostComment(res, req, dbConnection), res);
});
