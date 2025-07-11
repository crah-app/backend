import express from 'express';
import { Response, Request } from 'express';
import {
	getAllPosts,
	getAllPostsByUserId,
	getPostById,
	getPostFromRank,
	getPostsFromRank,
	getPostsOfFriends,
	setPostLikeStatus,
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
	errorHandler(await getPostById(res, req, dbConnection), res);
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

router.get('/all/currentUser/:userId', async (req: Request, res: Response) => {
	errorHandler(await getAllPosts(res, req, dbConnection), res);
});

/* 
e.g

curl http://localhost:4000/api/posts/:rank/silver/1

returns one post from the a rank
*/

router.get('/rank/:rank/:postId', async (req: Request, res: Response) => {
	errorHandler(await getPostFromRank(res, req, dbConnection), res);
});

// user likes a post
router.post('/:postId/like', async (req: Request, res: Response) => {
	errorHandler(await setPostLikeStatus(res, req, dbConnection), res);
});

// get posts of current user friends
router.get('/:userId/friends', async (req: Request, res: Response) => {
	errorHandler(await getPostsOfFriends(req, res, dbConnection), res);
});

/*
    get posts from rank
*/
router.get('/rank/:rank/all', async (req: Request, res: Response) => {
	errorHandler(await getPostsFromRank(req, res, dbConnection), res);
});
