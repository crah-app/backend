import { Err, ErrType } from './errors';
import { Request, Response } from 'express';
import { DbConnection } from './dbConnection';
import { verifyJwt } from './userAuth';
import { Trick, TrickDescription } from './tricks/trick';

interface FetchedTrick {
	id: number,
	trick: Partial<Trick>,
}

export async function getTrickListByUserId(req: Request, res: Response, db: DbConnection): Promise<Err | undefined> {
	const userId = req.query.id;
	try {
		const results = await new Promise<any>((resolve, reject) => {
			db.query('SELECT Tricks.Id, Tricks.Name, Tricks.Points, Tricks.Date, Spots.Type FROM Tricks INNER JOIN Spots ON Tricks.Id = Spots.TrickId AND Tricks.UserId='+ userId, (err, results) => {
				if (err) {
					reject({type: ErrType.MySqlFailedQuery, message: err.code ?? undefined});
				} else {

					let fetchedTricks: Array<FetchedTrick> = [];

					for(let i = 0; i < results.length; i++) {
						
						let idx: number = fetchedTricks.findIndex(t => t.id == results[i].Id);

						if(idx >= 0) {
							fetchedTricks[idx].trick.spots!.push(results[i].Type);
						} else {
							fetchedTricks.push({
								id: results[i].Id,
								trick: {
									name: results[i].Name,
									spots: [results[i].Type],
									date: results[i].Date,
									points: results[i].Points
								}
							});
						}
					}
					res.json(fetchedTricks);
					resolve(undefined);
				}
			});
		});
	} catch (err) {
		return(err as Err);
	}
}


export async function postTrickToTrickList(req: Request, res: Response, db: DbConnection, secret: string): Promise<Err | undefined> {
	return verifyJwt(req, res, secret, (userId: number) => {
		addTrickToTrickList(req, res, db, userId);
	});
}

// curl  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjQ0NDQ0NDQ0MzkwMDB9.ojW668Z4CJwA_JcG2hIj7jQ6utRngeP3v558TANpV2c' -H 'Content-Type: application/json' --data '{"parts": ["fakie", "double", "whip"], "spots": [0], "date": null}' --request POST 'http://localhost:4000/api/tricks/new?id=1'

// Before merging the trick, it should be checked that the trick name isn't already present in the list, and if it is, return an error.
// On the client, a notification will be shown to the user so he knows he has to edit the trick in place and add the spot.

async function addTrickToTrickList(req: Request, res: Response, db: DbConnection, userId: number): Promise<Err | undefined> {
	let desc: TrickDescription = new TrickDescription(req.body.parts as Array<string>, req.body.spots, req.body.date);
	let trick = new Trick(desc);
	try {
		const results = await new Promise<any>((resolve, reject) => {
			db.query('INSERT INTO Tricks(UserId, Name, Points, Date) VALUES (' + userId + ',\"' + trick.getName() + '\",' + trick.getPoints() + ',' + trick.date + ')', (err, results) => {
				  if (err) {
					 reject({type: ErrType.MySqlFailedQuery, message: err.stack ?? undefined});
				  } else {
						let trickId = results.insertId;
						for (const spot of trick.spots) {
						db.query('INSERT INTO Spots(TrickId, Type) VALUES (' + trickId + ',' + spot + ')', (err, results) => {
							if (err) {
								reject({type: ErrType.MySqlFailedQuery, message: err.stack ?? undefined});
							}
						});
					}
					
					res.status(200).send("Trick added to the list");
					resolve(undefined);
				}
			});
		});
		return results;
	} catch (err) {
		return(err as Err);
	}
}

// curl  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNTE2MjM5MjM0NjI2MjR9._rbyL-KlSoffzaw4XXsUpnTzThu3oLWaq84QCvScjY8' -H 'Content-Type: application/json' --data '{"trickId": 0}' --request DELETE 'http://localhost:4000/api/tricks/remove'

export async function deleteTrickFromTrickList(req: Request, res: Response, db: DbConnection, secret: string): Promise<Err | undefined> {
	return verifyJwt(req, res, secret, (userId: string) => {
		removeTrickFromTrickList(req, res, db, userId);
	});
}

async function removeTrickFromTrickList(req: Request, res: Response, db: DbConnection, userId: string): Promise<Err | undefined> {
	let trickId: number = req.body.trickId;
	console.log(userId);

	try {
		const results = await new Promise<any>((resolve, reject) => {
			db.query('DELETE FROM Tricks WHERE Tricks.Id=' + trickId + ' AND Tricks.UserId=' + userId, (err, results) => {
				if (err) {
					reject({type: ErrType.MySqlFailedQuery, message: err.stack ?? undefined});
				} else {
					db.query('DELETE FROM Spots WHERE Spots.TrickId=' + trickId, (err, results) => {
						if (err) {
							reject({type: ErrType.MySqlFailedQuery, message: err.stack ?? undefined});
						}
					});
				}
				
				res.status(200).send("Trick removed from the list");
				resolve(undefined);
			});
		});
	} catch (err) {
		return(err as Err);
	}
}
