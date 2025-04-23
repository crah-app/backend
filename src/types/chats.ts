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
	chatId: string;
	user: ChatUser;
	text?: string;
	image?: string;
	video?: string;
	audio?: string;
	system?: boolean;
	sent?: boolean;
	received?: boolean;
	pending?: boolean;
	quickReplies?: Record<string, any> | null;
	createdAt?: Date | string;
	type?: MessageType;
	trickId?: number | null;
	riderId?: string | null;
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
