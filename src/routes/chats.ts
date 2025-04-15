import express from 'express';
import { errorHandler } from '../constants/errors.js';
import { Response, Request } from 'express';
import { getChatsFromUser, getMessagesFromChat } from '../middleware/chats.js';
import { dbConnection } from '../constants/dbConnection.js';

const router = express.Router({ mergeParams: true });
export default router;

/**

get chat where user id is participant of the chat
 
*/

router.get('/byUserId/:userId', async (req: Request, res: Response) => {
	errorHandler(await getChatsFromUser(req, res, dbConnection), res);
});

/**

get messages of the chat 
 
*/

router.get('/messages/:chatId', async (req: Request, res: Response) => {
	errorHandler(await getMessagesFromChat(req, res, dbConnection), res);
});
