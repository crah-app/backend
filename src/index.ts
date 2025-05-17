import { App } from './constants/app.js';
import posts from './routes/posts.js';
import tricks from './routes/tricks.js';
import _default from './routes/default.js';
import users from './routes/users.js';
import chats from './routes/chats.js';
import source from './routes/source.js';
import clerk_webhook_user from './webhooks/clerk/routes.js';
import express from 'express';

import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { postMessageToDB } from './middleware/chats.js';
import { dbConnection } from './constants/dbConnection.js';

import redis from 'redis';
import { Err } from './constants/errors.js';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

const redisClient = redis.createClient();

// 1. Init Express wrapper
let app: App = new App({
	assetsDir: 'public',
	assetsPath: '/public',
	rootPath: '/api',
});

// 2. Create HTTP server
const expressApp = app.getInner();
const httpServer = createServer(expressApp);

// 3. Set up Socket.IO
const io = new Server(httpServer, {
	cors: {
		origin: '*',
	},
});

// 4. Redis pub/sub for Socket.IO
const pubClient = createClient();
const subClient = pubClient.duplicate();

await pubClient.connect();
await subClient.connect();

io.adapter(createAdapter(pubClient, subClient));

interface isTypingInterface {
	[chatId: string]: {
		[userId: string]: boolean;
	};
}

// 6. Setup routes
let router = app.getRouter();
router.use('/webhooks/clerk', clerk_webhook_user);
// app.inner.use(express.json());
router.use('/', _default);
router.use('/posts', posts);
router.use('/tricks', tricks);
router.use('/users', users);
router.use('/chats', chats);
router.use('/source', source);

// 5. Handle Socket.IO events
let typingUsers: isTypingInterface = {}; // Store typing status in memory

io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	socket.on('join-chat', ({ chatId, userId }, callback) => {
		if (!chatId || !userId) return;

		socket.join(chatId);
		callback();
		console.log(`User ${userId} joined chat ${chatId}`);
	});

	socket.on('send-message', async ({ chatId, msg }) => {
		if (!chatId || !msg || !msg[0].user._id) return;

		const result = await postMessageToDB(
			{ ...msg, ChatId: chatId },
			dbConnection,
		);

		if (result instanceof Error) {
			console.error('Error while loading:', result);
			return;
		}

		socket.to(chatId).emit('recieve-message', { chatId, msg });
	});

	socket.on('message-seen', async ({ chatId, userId, isInChat }) => {
		// io.to(chatId).emit('message-seen', chatId);

		if (!isInChat) return;

		const conn = await dbConnection.connect();
		if (conn instanceof Err) return;

		const insertSeenQuery = `
    INSERT IGNORE INTO MessageSeen (MessageId, UserId, SeenAt)
    SELECT _id, ?, NOW()
    FROM Messages
    WHERE ChatId = ?
      AND SenderId != ?
      AND _id NOT IN (
          SELECT MessageId FROM MessageSeen WHERE UserId = ?
      )
  `;

		await conn
			.promise()
			.query(insertSeenQuery, [userId, chatId, userId, userId]);
		conn.release();
	});

	socket.on('leave-chat', ({ chatId, userId }) => {
		socket.leave(chatId);
		console.log(`User ${userId} left chat ${chatId}`);
	});

	socket.on(
		'user-typing',
		({
			chatId,
			userId,
			isTyping,
		}: {
			chatId: string;
			userId: string;
			isTyping: boolean;
		}) => {
			if (!typingUsers[chatId]) {
				typingUsers[chatId] = {};
			}

			typingUsers[chatId][userId] = isTyping;

			// send event to all others
			io.to(chatId).emit('user-typing', { chatId, userId, isTyping });
		},
	);

	socket.on('disconnect', () => {
		console.log('User disconnected:', socket.id);

		// Clean up typing status on disconnect
		for (const chatId in typingUsers) {
			for (const userId in typingUsers[chatId]) {
				if (userId === socket.id) {
					delete typingUsers[chatId][userId];
				}
			}
			if (Object.keys(typingUsers[chatId]).length === 0) {
				delete typingUsers[chatId];
			}
		}
	});
});

// 7. Start server
const PORT = process.env.PORT || '4000';
httpServer.listen(PORT, () => {
	console.log('Server running on port ' + PORT);
});
