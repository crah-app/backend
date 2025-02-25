import { Success, Err, ErrType } from './errors';
import { Request, Response } from 'express';
import { DbConnection } from './dbConnection';
import { verifyJwt } from './userAuth';
import { Trick, TrickDescription } from './tricks/trick';
import { Spot } from './tricks/spot';

interface IdTrick {
	id: number,
	trick: Partial<Trick>,
}

export async function getTrickList(req: Request, res: Response, db: DbConnection): Promise<Err | Success> {
	
	const userId = req.query.userId;

	return await new Promise<any>((resolve, reject) => {
			
		let query = 'SELECT Tricks.Id, Tricks.Name, Tricks.Points,\
		Tricks.Date, Spots.Type FROM Tricks INNER JOIN Spots\
		ON Tricks.Id = Spots.TrickId AND Tricks.UserId=?';

		db.query([query, userId], (err, trickList) => {

			if (err) reject({
				type: ErrType.MySqlFailedQuery,
				message: err.code ?? "TODO!"
			});

			let idTricks: Array<IdTrick> = [];

			for(let i = 0; i < trickList.length; i++) {

				let idx = idTricks.findIndex(t => t.id == trickList[i].Id);

				if(idx >= 0) {
					idTricks[idx].trick.spots!.push(trickList[i].Type);
				} else {
					idTricks.push({
						id: trickList[i].Id,
						trick: {
							name: trickList[i].Name,
							spots: [trickList[i].Type],
							date: trickList[i].Date,
							points: trickList[i].Points
						}
					});
				}
			}

			resolve(() =>{
				res.json(idTricks);
			});
		});
	});
}

export async function postTrick(req: Request, res: Response, db: DbConnection, secret: string): Promise<Err | Success> {
	return verifyJwt(req, res, secret, (userId: number) => {
		postTrickHelper(req, res, db, userId);
	});
}

async function postTrickHelper(req: Request, res: Response, db: DbConnection, userId: number): Promise<Err | Success> {
	
	let parts: Array<string> = req.body.parts;
	let spots: Array<Spot> = req.body.spots;
	let date: Date = req.body.date;
	
	let description = new TrickDescription(parts, spots, date);
	let trick: Trick = new Trick(description);

	return await new Promise<any>((resolve, reject) => {

		let query = 'INSERT INTO Tricks(UserId,\
		Name, Points, Date) VALUES (?, ?, ?, ?)';

		db.query([query, userId, trick.getName(), trick.getPoints(), date], (err, results) => {

			if (err) reject({
				type: ErrType.MySqlFailedQuery,
				message: err.stack ?? "TODO!"
			});

			let trickId = results.insertId;
				
			for (const spot of trick.spots) {

				let query = 'INSERT INTO Spots(TrickId, Type)\
				VALUES (?, ?)';

				db.query([query, trickId, spot], (err, _) => {
					if (err) reject({
						type: ErrType.MySqlFailedQuery,
						message: err.stack ?? "TODO!"
					});
				});
			}

			resolve(() => {
				res.status(200).send("Trick added to the list");
			});
		});
	});
}


export async function deleteTrick(req: Request, res: Response, db: DbConnection, secret: string): Promise<Err | Success> {
	return verifyJwt(req, res, secret, (userId: string) => {
		deleteTrickHelper(req, res, db, userId);
	});
}

async function deleteTrickHelper(req: Request, res: Response, db: DbConnection, userId: string): Promise<Err | Success> {
	
	let trickId = req.query.trickId;

	return await new Promise<any>((resolve, reject) => {

		let query = 'DELETE FROM Tricks WHERE\
		Tricks.Id=? AND Tricks.UserId=?';
			
		db.query([query, trickId, userId], (err, results) => {

			if (err) reject({
				type: ErrType.MySqlFailedQuery,
				message: err.stack ?? "TODO!"
			});

			let query = 'DELETE FROM Spots WHERE\
			Spots.TrickId=?';

			db.query([query, trickId], (err, _) => {
				if (err) reject({
					type: ErrType.MySqlFailedQuery,
					message: err.stack ?? "TODO!"
				});
			});

			resolve(() => {
				res.status(200).send("Trick deleted from the trick list");
			});
		});
	});
}
