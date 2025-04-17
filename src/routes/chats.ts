import express from 'express';
import { errorHandler } from '../constants/errors.js';
import { Response, Request } from 'express';
import {
	getChatsFromUser,
	getChatUrlMediaPreview,
	getMessagesFromChat,
} from '../middleware/chats.js';
import { dbConnection } from '../constants/dbConnection.js';
import cors from 'cors';

const router = express.Router({ mergeParams: true });
router.use(cors());
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

router.get('/messages/:chatId/:userId', async (req: Request, res: Response) => {
	errorHandler(await getMessagesFromChat(req, res, dbConnection), res);
});

/**

get the link preview of an url 
 
*/

router.post('/link-preview', async (req: Request, res: Response) => {
	errorHandler(await getChatUrlMediaPreview(req, res, dbConnection), res);
});
