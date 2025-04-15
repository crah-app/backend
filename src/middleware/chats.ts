import DbConnection from '../constants/dbConnection.js';
import { Response, Request } from 'express';

import chat from '../../dummy/JSON/chat.json' with { type: 'json' };
import messages from '../../dummy/JSON/message.json' with { type: 'json' };
import chatMembers from '../../dummy/JSON/chatMembers.json' with { type: 'json' };
import { Err, ErrType } from '../constants/errors.js';
import { PoolConnection } from 'mysql2';

export async function getChatsFromUser(
	req: Request,
	res: Response,
	db: DbConnection,
    ): Promise<Err | void> {
        
    const userId = req.params.userId;

    try {
        if (!userId)
            return new Err(ErrType.RequestMissingProperty, 'User ID is required');

        const query =
        `
            SELECT 
                c.Id, 
                c.IsGroup, 
                c.Name,
                m.text AS LastMessageContent, -- Content wurde zu text geändert
                m.SenderId AS LastMessageSenderId,
                m.createdAt AS LastMessageDate
            FROM Chats c
            JOIN ChatMembers cm ON cm.ChatId = c.Id
            LEFT JOIN Messages m ON m.ChatId = c.Id
            WHERE cm.UserId = ?
            ORDER BY m.createdAt DESC;
        `

        let conn: PoolConnection | Err = await db.connect();
        if (conn instanceof Err) return conn;

        const chats = await new Promise<any>((resolve, reject) => {
            conn.query(query, userId, (err: any, results: any) => {
                if (err) {
                    reject(new Err(ErrType.MySqlFailedQuery, err));
                    return;
                }

                resolve(results);
            });
        });

        conn.release();
        res.json(chats);
    } catch (err) {
        return err as Err;
    }
}

export async function getMessagesFromChat(	
    req: Request,
	res: Response,
	db: DbConnection,
): Promise<Err | void>  {

        const chatId = req.params.chatId;

    try {
        if (!chatId)
            return new Err(ErrType.RequestMissingProperty, 'Chat ID is required');

        const query =
        `
            SELECT 
                m._id,
                m.ChatId,
                ch.Name AS ChatName,
                ch.Avatar,
                m.SenderId,
                u.Name,
                m.text,
                m.image,
                m.video,
                m.audio,
                m.createdAt
            FROM Messages m
            JOIN Users u ON u.Id = m.SenderId
            JOIN Chats ch ON ch.Id = m.ChatId
            WHERE m.ChatId = ?
            ORDER BY m.createdAt
            LIMIT 0, 1000;
        `

        let conn: PoolConnection | Err = await db.connect();
        if (conn instanceof Err) return conn;

        const messages = await new Promise<any>((resolve, reject) => {
            conn.query(query, chatId, (err: any, results: any) => {
                if (err) {
                    reject(new Err(ErrType.MySqlFailedQuery, err));
                    return;
                }

                resolve(results);
            });
        });

        conn.release();
        res.json(messages);
    } catch (err) {
        return err as Err;
    }
};