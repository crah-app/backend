import DbConnection from '../constants/dbConnection.js';
import { Response, Request } from 'express';

import { Err, ErrType } from '../constants/errors.js';
import { PoolConnection } from 'mysql2';

import { getLinkPreview } from 'link-preview-js';

import { v4 as uuidv4 } from 'uuid';

import { Message } from '../types/chats.js';

// get all chats where user is participant

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
        c.CreatedAt AS ChatCreatedAt, 

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

    CASE 
        WHEN c.IsGroup = FALSE THEN (
            SELECT u.avatar 
            FROM ChatMembers cm2
            JOIN Users u ON u.Id = cm2.UserId
            WHERE cm2.ChatId = c.Id AND cm2.UserId != ?
            LIMIT 1
        )
        ELSE NULL
    END AS Avatar,

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

		const conn = await db.connect();

		if (conn instanceof Err) return conn;

		const [chats] = await conn.query(query, [
			userId,
			userId,
			userId,
			userId,
			userId,
		]);

		conn.release();
		res.json(chats);
	} catch (err) {
		return err as Err;
	}
}

// get all messages from a chat

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
    -- Chat meta data as first entry
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

		CASE 
			WHEN c.IsGroup = FALSE THEN (
				SELECT u.avatar 
				FROM ChatMembers cm2
				JOIN Users u ON u.Id = cm2.UserId
				WHERE cm2.ChatId = c.Id AND cm2.UserId != ?
				LIMIT 1
			)
			ELSE NULL
		END AS ChatAvatar,

        c.IsGroup AS isGroup,
        c.Id AS ChatId,
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
        JSON_OBJECT(
            '_id', 'bot',
            'name', 'bot',
            'avatar', 'bot'
        ) AS user,
        'bot' AS text,
        c.CreatedAt AS createdAt,
        NULL AS sent,
        TRUE AS "system",
        0 AS recieved,
        0 AS pending,
        NULL AS quickReplies,
        NULL AS audio,
        NULL AS video,
        NULL AS image,
        'profile-card' AS _id,
        'text' AS "type",
        NULL AS trickId,
        NULL AS riderId,
        FALSE AS isReply,
        NULL AS replyToMessageId,
		NULL as sourceData

    FROM Chats c
    WHERE c.Id = ?

    UNION ALL

    -- Actual messages
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
        m.riderId AS riderId,
        m.isReply AS isReply,
        m.replyToMessageId AS replyToMessageId,
		m.sourceData AS sourceData
    FROM Messages m
    JOIN Users u ON m.SenderId = u.Id
    WHERE m.ChatId = ?
) AS combined
ORDER BY createdAt DESC;
`;

		const conn = await db.connect();
		if (conn instanceof Err) throw conn;

		const [messages] = await conn.query(query, [
			userId,
			userId,
			chatId,
			chatId,
		]);

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

// @josef-stips
// check wether chat with that user can be started
// because some users may do not allow that some random starts a chat with them
async function canStartChatWithOtherUser(): Promise<boolean> {
	return true;
}

// currentUser wants to create one-to-one chat
export async function startNewchat(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const { senderId, receiverId } = req.body;
	const userIsNotRestricted = canStartChatWithOtherUser();

	if (!senderId || !receiverId)
		return res
			.status(400)
			.json({ error: 'senderId and receiverId are required' });

	if (!userIsNotRestricted)
		return res
			.status(500)
			.json({ error: 'Failed to create chat. User is restricted.' });

	try {
		const conn = await db.connect();
		if (conn instanceof Err) throw conn;

		// check wether chat between them already exists
		const [existingChat] = await conn.query(
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

		await conn.query(`INSERT INTO Chats (Id, IsGroup) VALUES (?, FALSE)`, [
			chatId,
		]);

		await conn.query(
			`INSERT INTO ChatMembers (ChatId, UserId) VALUES (?, ?), (?, ?)`,
			[chatId, senderId, chatId, receiverId],
		);

		conn.release();
		return res.status(201).json({ chatId, existing: false });
	} catch (error) {
		console.error('Error creating chat:', error);
		return res.status(500).json({ error: 'Failed to create chat' });
	}
}

// currentUser wants to create group chat
export async function createGroupChat(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const { creatorId, memberIds, name } = req.body;

	console.log('lol', creatorId, memberIds, name);

	if (
		!creatorId ||
		!Array.isArray(memberIds) ||
		memberIds.length === 0 ||
		!name
	) {
		return res.status(400).json({
			error:
				'creatorId, memberIds (array), and name are required for group chat',
		});
	}

	try {
		const conn = await db.connect();
		if (conn instanceof Err) throw conn;

		// validisation: do all users exist?
		const [rows] = await conn.query('SELECT Id FROM Users WHERE Id IN (?)', [
			[...memberIds],
		]);

		const foundUserIds = (rows as any[]).map((row) => row.Id);

		console.log(foundUserIds);

		if (foundUserIds.length !== memberIds.length) {
			conn.release();
			return res
				.status(400)
				.json({ error: 'One or more userIds do not exist' });
		}

		const chatId = uuidv4();

		// 1. create group chat
		await conn.query(
			`INSERT INTO Chats (Id, IsGroup, Name) VALUES (?, TRUE, ?)`,
			[chatId, name],
		);

		const placeholders = memberIds.map(() => `(?, ?, ? )`).join(',');
		const values: (string | boolean)[] = [];

		memberIds.forEach((userId) => {
			values.push(chatId, userId, userId === creatorId); // true for admin
		});

		console.log(placeholders);

		await conn.query(
			`INSERT INTO ChatMembers (ChatId, UserId, IsAdmin) VALUES ${placeholders}`,
			values,
		);

		conn.release();

		return res.status(201).json({ chatId });
	} catch (error) {
		console.error('Error creating group chat:', error);
		return res.status(500).json({ error: 'Failed to create group chat' });
	}
}

export async function postMessageToDB(message: any, db: DbConnection) {
	console.log('new message arrived', message);

	const {
		_id = message[0]._id,
		ChatId,
		SenderId = message[0].user._id,
		text = message[0].text,
		image = message[0].image,
		video = message[0].video,
		audio = message[0].audio,
		system = message[0].system,
		sent = null,
		received = null,
		pending = false,
		quickReplies = null,
		createdAt = new Date(message[0].createdAt),
		type = message[0].type,
		trickId = message[0].trickId,
		riderId = message[0].riderId,
		isReply = message[0].isReply,
		replyToMessageId = message[0].replyToMessageId,
		sourceData = message[0].sourceData ?? JSON.stringify({}),
		ChatAvatar = message[0].ChatAvatar ?? '',
	}: Message = message;

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
		createdAt, type, trickId, riderId, isReply, replyToMessageId, sourceData, ChatAvatar
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
		isReply,
		replyToMessageId,
		sourceData,
		ChatAvatar,
	];

	console.log(values);

	try {
		await conn.query(insertQuery, values);
		conn.release();

		return { ...message, _id, createdAt, sent: true };
	} catch (err) {
		conn.release();
		return new Err(ErrType.MySqlFailedQuery, err);
	}
}

export async function deleteChat(
	req: Request,
	res: Response,
	dbConnection: DbConnection,
) {}
