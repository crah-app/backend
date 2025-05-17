import express from 'express';
import { errorHandler } from '../constants/errors.js';
import { Response, Request } from 'express';
import {
	createGroupChat,
	getChatsFromUser,
	getChatUrlMediaPreview,
	getMessagesFromChat,
	startNewchat,
} from '../middleware/chats.js';
import { dbConnection } from '../constants/dbConnection.js';
import cors from 'cors';

const router = express.Router({ mergeParams: true });
router.use(cors());
router.use(express.json());
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

/**

	new chat
 
*/

router.post('/new', async (req: Request, res: Response) => {
	try {
		console.log(req.body);

		const { isGroup } = req.body;

		if (!isGroup) {
			errorHandler(await startNewchat(req, res, dbConnection), res);
			return;
		}

		errorHandler(await createGroupChat(req, res, dbConnection), res);
	} catch (error) {
		console.warn(error);
		res.status(500).send(error);
	}
});
