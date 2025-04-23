import DbConnection from '../constants/dbConnection.js';
import { Response, Request } from 'express';

import { Err, ErrType } from '../constants/errors.js';
import { PoolConnection } from 'mysql2';

import { getLinkPreview } from 'link-preview-js';

import { v4 as uuidv4 } from 'uuid';

import { Message } from '../types/chats.js';

export async function getChatsFromUser(
	req: Request,
	res: Response,
	db: DbConnection,
): Promise<Err | void> {
	const userId = req.params.userId;

	try {
		if (!userId)
			return new Err(ErrType.RequestMissingProperty, 'User ID is required');

		const query = `
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
            
            -- restliche Felder
            m.text AS LastMessageContent,
            m.SenderId AS LastMessageSenderId,
            m.createdAt AS LastMessageDate,
            m.type AS LastMessageType,

            COALESCE((
                SELECT COUNT(*)
                FROM Messages msg
                LEFT JOIN MessageSeen ms 
                    ON ms.MessageId = msg._id AND ms.UserId = ?
                WHERE msg.ChatId = c.Id 
                AND msg.SenderId != ?
                AND ms.MessageId IS NULL
            ), 0) AS UnreadCount

            FROM Chats c
            JOIN ChatMembers cm ON cm.ChatId = c.Id

            -- letzte Nachricht pro Chat
            LEFT JOIN (
                SELECT m1.*
                FROM Messages m1
                INNER JOIN (
                    SELECT ChatId, MAX(createdAt) AS maxDate
                    FROM Messages
                    GROUP BY ChatId
                ) m2 ON m1.ChatId = m2.ChatId AND m1.createdAt = m2.maxDate
                WHERE m1._id = (
                    SELECT MAX(_id)
                    FROM Messages m3
                    WHERE m3.ChatId = m1.ChatId AND m3.createdAt = m1.createdAt
                )
            ) m ON m.ChatId = c.Id

            WHERE cm.UserId = ?

            ORDER BY 
            m.createdAt IS NULL, 
            m.createdAt DESC;
        `;

		let conn: PoolConnection | Err = await db.connect();
		if (conn instanceof Err) return conn;

		const chats = await new Promise<any>((resolve, reject) => {
			conn.query(
				query,
				[userId, userId, userId, userId, userId],
				(err: any, results: any) => {
					if (err) {
						reject(new Err(ErrType.MySqlFailedQuery, err));
						return;
					}

					resolve(results);
				},
			);
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
): Promise<Err | void> {
	const chatId = req.params.chatId;
	const userId = req.params.userId;

	try {
		if (!chatId)
			return new Err(ErrType.RequestMissingProperty, 'Chat ID is required');
		if (!userId)
			return new Err(ErrType.RequestMissingProperty, 'User ID is required');

		const query = `
SELECT *
FROM (
    -- Chat-Metadaten (ein einzelnes Objekt)
    SELECT 
        CASE
            WHEN (
                SELECT COUNT(*) 
                FROM ChatMembers cm
                WHERE cm.ChatId = c.Id
            ) > 2 THEN c.Name
            ELSE (
                SELECT u2.Name
                FROM ChatMembers cm
                JOIN Users u2 ON cm.UserId = u2.Id
                WHERE cm.ChatId = c.Id AND cm.UserId != ?
                LIMIT 1
            )
        END AS ChatName,
        c.IsGroup AS isGroup,
        c.Id AS ChatId,
        c.Avatar AS ChatAvatar,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    '_id', u2.Id,
                    'name', u2.Name,
                    'avatar', CONCAT('/users/pfps/', u2.Id, '.png')
                )
            )
            FROM ChatMembers cm
            JOIN Users u2 ON cm.UserId = u2.Id
            WHERE cm.ChatId = c.Id
        ) AS participants,
        NULL AS user,
        NULL AS text,
        NULL AS createdAt,
        NULL AS sent,
        NULL AS "system",
        NULL AS recieved,
        NULL AS pending,
        NULL AS quickReplies,
        NULL AS audio,
        NULL AS video,
        NULL AS image,
        NULL AS _id,
        NULL AS "type",
        NULL AS trickId,
        NULL AS riderId

    FROM Chats c
    WHERE c.Id = ?

    UNION ALL

    -- Nachrichten mit user-Objekt
    SELECT 
        NULL AS chatName,
        NULL AS isGroup,
        NULL AS ChatId,
        NULL AS chatAvatar,
        NULL AS participants,
        JSON_OBJECT(
            '_id', u.Id,
            'name', u.Name,
            'avatar', CONCAT('/users/pfps/', u.Id, '.png')
        ) AS user,
        m.text,
        m.createdAt,
        NULL AS sent,
        m.system AS "system",
        m.received AS received,
        m.pending AS pending,
        m.quickReplies AS quickReplies,
        m.audio AS audio,
        m.video AS video,
        m.image AS image,
        m._id AS _id,
        m.type AS "type",
        m.trickId AS trickId,
        m.riderId AS riderId
    FROM Messages m
    JOIN Users u ON m.SenderId = u.Id
    WHERE m.ChatId = ?
) AS combined
ORDER BY createdAt DESC;
`;

		let conn: PoolConnection | Err = await db.connect();
		if (conn instanceof Err) return conn;

		const messages = await new Promise<any>((resolve, reject) => {
			conn.query(query, [userId, chatId, chatId], (err: any, results: any) => {
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
}

export async function getChatUrlMediaPreview(
	req: Request,
	res: Response,
	db: DbConnection,
): Promise<Err | void> {
	try {
		const { url } = req.body;
		const data = await getLinkPreview(url);
		res.json(data);
	} catch (err) {
		return err as Err;
	}
}

export async function startNewchat(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const { senderId, receiverId } = req.body;

	if (!senderId || !receiverId)
		return res
			.status(400)
			.json({ error: 'senderId and receiverId are required' });

	try {
		const conn = await db.connect();
		if (conn instanceof Err) throw conn;

		// check wether chat between them already exists
		const [existingChat] = await conn.promise().query(
			`
			SELECT c.Id FROM Chats c
			JOIN ChatMembers cm1 ON cm1.ChatId = c.Id AND cm1.UserId = ?
			JOIN ChatMembers cm2 ON cm2.ChatId = c.Id AND cm2.UserId = ?
			WHERE c.IsGroup = FALSE
		`,
			[senderId, receiverId],
		);

		if (Array.isArray(existingChat) && existingChat.length > 0) {
			// @ts-ignore
			const existingChatId = existingChat[0].Id;
			conn.release();
			return res.json({ chatId: existingChatId, existing: true });
		}

		// create new chat
		const chatId = uuidv4();

		await conn
			.promise()
			.query(`INSERT INTO Chats (Id, IsGroup) VALUES (?, FALSE)`, [chatId]);

		await conn
			.promise()
			.query(`INSERT INTO ChatMembers (ChatId, UserId) VALUES (?, ?), (?, ?)`, [
				chatId,
				senderId,
				chatId,
				receiverId,
			]);

		conn.release();
		return res.status(201).json({ chatId, existing: false });
	} catch (error) {
		console.error('Error creating chat:', error);
		return res.status(500).json({ error: 'Failed to create chat' });
	}
}

export async function postMessageToDB(message: any, db: DbConnection) {
	const {
		_id = message[0]._id,
		ChatId,
		SenderId = message[0].user._id,
		text = message[0].text,
		image = null,
		video = null,
		audio = null,
		system = false,
		sent = null,
		received = null,
		pending = false,
		quickReplies = null,
		createdAt = new Date(message[0].createdAt),
		type = 'text',
		trickId = null,
		riderId = null,
	} = message;

	console.log(ChatId, SenderId);

	if (!ChatId || !SenderId) {
		return new Err(
			ErrType.RequestMissingProperty,
			'chatId and senderId are required',
		);
	}

	let conn = await db.connect();
	if (conn instanceof Err) return conn;

	const insertQuery = `
	INSERT INTO Messages (
		_id, ChatId, SenderId, text, image, video, audio,
		\`system\`, sent, received, pending, quickReplies,
		createdAt, type, trickId, riderId
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

	const values = [
		_id,
		ChatId,
		SenderId,
		text || null,
		image,
		video,
		audio,
		system,
		sent ?? true, // fallback true, when send false is
		received ?? false, // fallback false
		pending,
		quickReplies ? JSON.stringify(quickReplies) : null,
		createdAt,
		type,
		trickId,
		riderId,
	];

	try {
		await conn.promise().query(insertQuery, values);
		conn.release();

		return { ...message, _id, createdAt, sent: true };
	} catch (err) {
		conn.release();
		return new Err(ErrType.MySqlFailedQuery, err);
	}
}
