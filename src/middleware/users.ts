import { Request, Response } from 'express';
import { createClerkClient } from '@clerk/backend';
import { Err } from '../constants/errors.js';

// export to /types
type UserSetting = "setting01" | "setting02";

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

// user can alter clerk and crah specific information
// clerk data gets updated on the client directly and the clerk API triggers the /webhook/clerk route
// this function manages changes to crah specific user data in the db
export async function updateUser(req: Request, res: Response, db: DBconnection, data: JSON) {
	
}

// client alters an account setting (privacy setting, general setting, ...)
export async function alterAccountSettings(req: Request, res: Response, db: DBconnection, setting: UserSetting) {

	switch(setting) {
		case "setting01" :
			alterSetting01(req, res, db, setting);		
	}
}

// alter setting "xy"
export async function alterSetting01(req : Request, res: Response, db:DBconnection, setting: UserSetting) {
	
}
