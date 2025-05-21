interface Chat {
	id: string;
	isGroup: boolean;
	createdAt: Date;
	updatedAt: Date;

	name?: string;
	avatarUrl?: string;
	adminIds?: string[];

	lastMessage?: MessagePreview;
}

export type ChatUser = { _id: string; name: string; avatar: string };

export type MessageType = 'text' | 'rider' | 'trick';

export interface Message {
	_id?: string;
	ChatId: string;
	SenderId: string;
	user: ChatUser;
	text?: string;
	image?: string;
	video?: string;
	audio?: string;
	system?: boolean;
	sent?: boolean | null;
	received?: boolean | null;
	pending?: boolean;
	quickReplies?: Record<string, any> | null;
	createdAt?: Date | string;
	type?: MessageType;
	trickId?: number | null;
	riderId?: string | null;
	isReply: boolean;
	replyToMessageId: string | undefined;
	sourceData: JSON;
	ChatAvatar: string;
}

interface ChatMember {
	id: string;
	chatId: string;
	userId: string;
	joinedAt: Date;
	isAdmin?: boolean;
}

interface MessagePreview {
	content: string;
	senderId: string;
	type: 'text' | 'image' | 'video';
	createdAt: Date;
}
