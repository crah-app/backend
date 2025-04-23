// socketServer.ts
import { Server as HTTPServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

export async function setupSocket(httpServer: HTTPServer) {
	const io = new IOServer(httpServer, {
		cors: {
			origin: '*', // or domain
			methods: ['GET', 'POST'],
		},
	});

	const pubClient = createClient({ url: 'redis://localhost:6379' });
	const subClient = pubClient.duplicate();

	await pubClient.connect();
	await subClient.connect();

	io.adapter(createAdapter(pubClient, subClient));

	io.on('connection', (socket) => {
		console.log(`⚡ Client connected: ${socket.id}`);

		socket.on('chat:message', (msg) => {
			console.log('Received:', msg);
			// Nachricht broadcasten
			io.emit('chat:message', msg);
		});

		socket.on('disconnect', () => {
			console.log(`👋 Disconnected: ${socket.id}`);
		});
	});
}
