import express, { Response, Request } from 'express';
import {
	generatePresignedUrl,
	markVideoUploaded,
} from '../../middleware/source.js';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { dbConnection } from '../../constants/dbConnection.js';
import { Err } from '../../constants/errors.js';
import { UserJSON } from '@clerk/backend';

export async function handleUser(
	eventType: string,
	userData: UserJSON,
	req: Request,
	res: Response,
) {
	switch (eventType) {
		case 'user.created':
			return userCreated(userData, req, res);

		case 'user.deleted':
			return userDeleted(userData, req, res);

		case 'user.updated':
			return userUpdated(userData, req, res);
	}
}

async function userCreated(userData: UserJSON, req: Request, res: Response) {
	try {
		const conn = await dbConnection.connect();
		if (conn instanceof Err) return conn;

		const query = `
            INSERT INTO Users (Id, Name, lastActiveAt, createdAt) VALUES (?,?,?,?)
            `;

		await conn
			.promise()
			.query(query, [
				userData.id,
				userData.username,
				userData.last_active_at,
				userData.created_at,
			]);

		conn.release();
		return res.status(200).send('Webhook received. User created successfully!');
	} catch (error) {
		console.error('Error creating user:', error);
		return res.status(500).json({ error: 'Failed to create group chat' });
	}
}

export async function userDeleted(
	userData: UserJSON,
	req: Request,
	res: Response,
) {
	try {
		const conn = await dbConnection.connect();
		if (conn instanceof Err) return conn;

		const query = `DELETE FROM Users WHERE Id = ?`;

		await conn.promise().query(query, [userData.id]);

		conn.release();
		return res.status(200).send('Webhook received. User deleted successfully!');
	} catch (error) {
		console.error('Error deleting user:', error);
		return res.status(500).json({ error: 'Failed to delete user' });
	}
}

export async function userUpdated(
	userData: UserJSON,
	req: Request,
	res: Response,
) {
	try {
		const conn = await dbConnection.connect();
		if (conn instanceof Err) return conn;

		const query = `
			UPDATE Users
			SET Name = ?, lastActiveAt = ?
			WHERE Id = ?
		`;

		await conn
			.promise()
			.query(query, [userData.username, userData.last_active_at, userData.id]);

		conn.release();
		return res.status(200).send('Webhook received. User updated successfully!');
	} catch (error) {
		console.error('Error updating user:', error);
		return res.status(500).json({ error: 'Failed to update user' });
	}
}
