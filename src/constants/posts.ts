// import { Err, ErrType } from "./errors.js";
// import { Request, Response } from "express";
// import DbConnection from "./dbConnection.js";
// import { verifyJwt } from "./userAuth.js";
// import { Trick, TrickDescription } from "../trickLogic/trick.js";
// import { Spot } from "../trickLogic/spot.js";

// export async function getPost(req: Request, res: Response, db: DbConnection): Promise<Err | void> {
// 	const postId: any | undefined = req.query.postId;

// 	try {
// 		if (!postId) return {
// 			type: ErrType.RequestMissingProperty,
// 			message: "Post ID is required",
// 		};

// 		const query = `SELECT * FROM Posts WHERE Posts.Id = ?`;
		
// 		const likesQuery = `SELECT COUNT(*) LikesCount FROM Likes WHERE Likes.PostId = Posts.Id`;
		
// 		const trickList = await new Promise<any>((resolve, reject) => {
// 			db.query(query, postId, (err: any, results: any) => {
// 				if (err) reject({
// 					type: ErrType.MySqlFailedQuery,
// 					message: err.code + "Database query failed",
// 				});
// 				resolve(results);
// 			});
// 		});

// 		const idTricks: Map<number, Partial<Trick>> = new Map();

// 		trickList.forEach((row: any) => {
// 			let trick: any | undefined = idTricks.get(row.Id);

// 			if (trick!) trick.spots?.push(row.Type);
// 			else idTricks.set(row.Id, {
// 				name: row.Name,
// 				spots: [row.Type],
// 				date: row.Date,
// 				points: row.Points,
// 			});
// 		});

// 		res.json(Array.from(idTricks));
// 	} catch (err) {
// 		return err as Err;
// 	}
// }
