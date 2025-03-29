import { Request, Response } from 'express';
import { createClerkClient } from '@clerk/backend';
import { Err } from '../constants/errors.js';

const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
});

export async function getAllUsers(res: Response) {
	// outputs a json with all users and their data
	const allUsers = await clerkClient.users.getUserList();

	res.json(allUsers.data);
}

export async function getUserStats(req: Request, res: Response) {
	const id = req.params.userId;

	// outputs a json with all users and their data
	const userStats = await clerkClient.users.getUser(id);

	res.json(userStats);
}
