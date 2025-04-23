import { App } from './constants/app.js';
import posts from './routes/posts.js';
import tricks from './routes/tricks.js';
import _default from './routes/default.js';
import users from './routes/users.js';
import chats from './routes/chats.js';

import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { postMessageToDB } from './middleware/chats.js';
import { dbConnection } from './constants/dbConnection.js';

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

// 5. Handle Socket.IO events
io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	// chat logic
	socket.on('join-chat', ({ chatId, userId }) => {
		if (!chatId || !userId) return;

		socket.join(chatId);
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

		socket.to(chatId).emit('recieve-message', msg);
	});

	socket.on('leave-chat', ({ chatId, userId }) => {
		socket.leave(chatId);
		console.log(`User ${userId} left chat ${chatId}`);
	});

	socket.on('disconnect', () => {
		console.log('User disconnected:', socket.id);
	});
});

// 6. Setup routes
let router = app.getRouter();
router.use('/', _default);
router.use('/posts', posts);
router.use('/tricks', tricks);
router.use('/users', users);
router.use('/chats', chats);

// 7. Start server
const PORT = process.env.PORT || '4000';
httpServer.listen(PORT, () => {
	console.log('Server running on port ' + PORT);
});
