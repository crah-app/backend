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
                CASE 
                    WHEN c.IsGroup = FALSE THEN (
                        SELECT u.Name 
                        FROM ChatMembers cm2
                        JOIN Users u ON u.Id = cm2.UserId
                        WHERE cm2.ChatId = c.Id AND cm2.UserId != ?
                        LIMIT 1
                    )
                    ELSE c.Name
                END AS Name,
                m.text AS LastMessageContent,
                m.SenderId AS LastMessageSenderId,
                m.createdAt AS LastMessageDate
            FROM Chats c
            JOIN ChatMembers cm ON cm.ChatId = c.Id
            LEFT JOIN (
                SELECT m1.*
                FROM Messages m1
                INNER JOIN (
                    SELECT ChatId, MAX(createdAt) AS maxDate
                    FROM Messages
                    GROUP BY ChatId
                ) m2 ON m1.ChatId = m2.ChatId AND m1.createdAt = m2.maxDate
            ) m ON m.ChatId = c.Id
            WHERE cm.UserId = ?
            ORDER BY 
                m.createdAt IS NULL, 
                m.createdAt ASC;
        `

        let conn: PoolConnection | Err = await db.connect();
        if (conn instanceof Err) return conn;

        const chats = await new Promise<any>((resolve, reject) => {
            conn.query(query, [userId,userId], (err: any, results: any) => {
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
        const userId = req.params.userId;

    try {
        if (!chatId)
            return new Err(ErrType.RequestMissingProperty, 'Chat ID is required');

        const query =
        `
            (
                SELECT 
                    NULL AS _id,
                    ch.Id AS ChatId,
                    ch.IsGroup,
                    -- ChatName-Logik: Wenn kein Gruppenchat, dann nimm Name des "anderen" Users
                    CASE 
                        WHEN ch.IsGroup = FALSE THEN 
                            (SELECT u.Name 
                            FROM ChatMembers cm2 
                            JOIN Users u ON u.Id = cm2.UserId 
                            WHERE cm2.ChatId = ch.Id AND u.Id != ? 
                            LIMIT 1)
                        ELSE ch.Name
                    END AS ChatName,
                    ch.Avatar AS ChatAvatar,
                    NULL AS user,
                    NULL AS text,
                    NULL AS image,
                    NULL AS video,
                    NULL AS audio,
                    NULL AS "system",
                    NULL AS sent,
                    NULL AS received,
                    NULL AS pending,
                    NULL AS quickReplies,
                    NULL AS createdAt,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            '_id', u.Id,
                            'name', u.Name,
                            'avatar', CONCAT('/users/pfps/', u.Id, '.png')
                        )
                    ) AS participants
                FROM Chats ch
                JOIN ChatMembers cm ON cm.ChatId = ch.Id
                JOIN Users u ON u.Id = cm.UserId
                WHERE ch.Id = ?
                AND (
                    ch.IsGroup = TRUE OR
                    (ch.IsGroup = FALSE AND u.Id != ?)
                )
                GROUP BY ch.Id
            )
            UNION ALL
            (
                SELECT 
                    m._id,
                    m.ChatId,
                    ch.IsGroup,
                    -- Selbe ChatName-Logik für Messages
                    CASE 
                        WHEN ch.IsGroup = FALSE THEN 
                            (SELECT u2.Name 
                            FROM ChatMembers cm2 
                            JOIN Users u2 ON u2.Id = cm2.UserId 
                            WHERE cm2.ChatId = ch.Id AND u2.Id != ? 
                            LIMIT 1)
                        ELSE ch.Name
                    END AS ChatName,
                    ch.Avatar AS ChatAvatar,
                    JSON_OBJECT(
                        '_id', u.Id,
                        'name', u.Name,
                        'avatar', CONCAT('/users/pfps/', u.Id, '.png')
                    ) AS user,
                    m.text,
                    m.image,
                    m.video,
                    m.audio,
                    m.system,
                    m.sent,
                    m.received,
                    m.pending,
                    m.quickReplies,
                    m.createdAt,
                    NULL AS participants
                FROM Messages m
                JOIN Users u ON u.Id = m.SenderId
                JOIN Chats ch ON ch.Id = m.ChatId
                WHERE m.ChatId = ?
                ORDER BY m.createdAt
                LIMIT 0, 1000
            );


        `

        let conn: PoolConnection | Err = await db.connect();
        if (conn instanceof Err) return conn;

        const messages = await new Promise<any>((resolve, reject) => {
            conn.query(query, [userId, chatId, userId, userId, chatId], (err: any, results: any) => {
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