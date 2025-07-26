import { Response, Request } from 'express';
import { dbConnection } from '../../constants/dbConnection.js';
import { Err } from '../../constants/errors.js';
import { UserJSON } from '@clerk/backend';

export async function handleUser(
	eventType: string,
	userData: UserJSON,
	req: Request,
	res: Response,
) {
	console.log(eventType);
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
	const conn = await dbConnection.connect();
	if (conn instanceof Err) throw conn;

	try {
		await conn.beginTransaction();

		const query = `
			INSERT INTO Users (Id, Name, createdAt, avatar) VALUES (?,?,?,?)
		`;

		const rankOvertime_query = `
			INSERT INTO rankovertime (UserId, \`rank\`, rankPoints, rankTotalPoints)
			VALUES (?, ?, ?, ?);
		`;

		await conn.query(query, [
			userData.id,
			userData.username ??
				`${userData.first_name ?? 'John'} ${userData.last_name ?? 'Doe23'}`,
			new Date(userData.created_at),
			userData.image_url,
		]);

		await conn.query(rankOvertime_query, [userData.id, 'Wood', 0, 0]);

		await conn.commit();

		console.log('Webhook received. User created successfully!');
		return res.status(200).send('Webhook received. User created successfully!');
	} catch (error) {
		if (conn) {
			await conn.rollback();
		}
		console.error('Error creating user:', error);
		return res
			.status(500)
			.json({ error: 'Failed to create user', message: error });
	} finally {
		if (conn) conn.release();
	}
}

export async function userDeleted(
	userData: UserJSON,
	req: Request,
	res: Response,
) {
	const conn = await dbConnection.connect();
	if (conn instanceof Err) return conn;

	try {
		await conn.beginTransaction();

		const deleteRankOvertimeQuery = `DELETE FROM rankovertime WHERE UserId = ?`;

		const query = `DELETE FROM Users WHERE Id = ?`;

		await conn.query(deleteRankOvertimeQuery, [userData.id]);
		await conn.query(query, [userData.id]);

		await conn.commit();

		console.log('Webhook received. User deleted successfully!');
		return res.status(200).send('Webhook received. User deleted successfully!');
	} catch (error) {
		if (conn) {
			await conn.rollback();
		}

		console.error('Error deleting user:', error);
		return res
			.status(500)
			.json({ error: 'Failed to delete user', message: error });
	} finally {
		conn && conn.release();
	}
}

export async function userUpdated(
	userData: UserJSON,
	req: Request,
	res: Response,
) {
	const conn = await dbConnection.connect();
	if (conn instanceof Err) return conn;

	try {
		const query = `
			UPDATE Users
			SET Name = ?, lastActiveAt = ?, avatar = ?
			WHERE Id = ?
		`;

		await conn.query(query, [
			userData.username,
			new Date(userData.last_active_at as number),
			userData.image_url,
			userData.id,
		]);

		conn.release();
		console.log('Webhook received. User updated successfully!');
		return res.status(200).send('Webhook received. User updated successfully!');
	} catch (error) {
		console.error('Error updating user:', error);
		return res
			.status(500)
			.json({ error: 'Failed to update user', message: error });
	} finally {
		conn && conn.release();
	}
}
