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

interface Message {
	id: string;
	chatId: string;
	senderId: string;

	content: string;
	type: 'text' | 'image' | 'video' | 'file';
	mediaUrl?: string;

	createdAt: Date;
	seenBy: string[];
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
