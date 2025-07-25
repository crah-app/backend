import express from 'express';
import { Response, Request } from 'express';
import {
	getAllPosts,
	getAllPostsByUserId,
	getCommentsOfPost,
	getLatelyPostsBySpecificPostType,
	getPopularPosts,
	getPostById,
	getPostFromRank,
	getPostsFromRank,
	getPostsOfFriends,
	setCommentLike,
	setPostComment,
	setPostLikeStatus,
	setReaction,
	setReport,
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

// get most popular posts of the last 90 days
// bearer
router.get(
	'/popular/:offset/:limit/:userId',
	async (req: Request, res: Response) => {
		errorHandler(await getPopularPosts(res, req, dbConnection), res);
	},
);

// get lately/popular videos
// bearer
router.get(
	'/:postType/:offset/:limit/:userId',
	async (req: Request, res: Response) => {
		errorHandler(
			await getLatelyPostsBySpecificPostType(res, req, dbConnection),
			res,
		);
	},
);

// get lately/popular articles
// bearer
router.get(
	'/:postType/:offset/:limit/:userId',
	async (req: Request, res: Response) => {
		errorHandler(
			await getLatelyPostsBySpecificPostType(res, req, dbConnection),
			res,
		);
	},
);

// get all posts
router.get('/all/currentUser/:userId', async (req: Request, res: Response) => {
	errorHandler(await getAllPosts(res, req, dbConnection), res);
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

router.get('/:postId/comments/:userId', async (req: Request, res: Response) => {
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

// user likes comment
router.post(
	'/comment/:commentId/like/:userId',
	async (req: Request, res: Response) => {
		errorHandler(await setCommentLike(res, req, dbConnection), res);
	},
);

// user sets reaction
router.post('/reaction', async (req: Request, res: Response) => {
	errorHandler(await setReaction(res, req, dbConnection), res);
});

// user reports a post
// bearer
router.post('/report', async (req: Request, res: Response) => {
	errorHandler(await setReport(res, req, dbConnection), res);
});
