// Types for all data that the server fetches from the database etc.

interface UserPost {
	id: string;
	userId: string;

	// Content
	contentText?: string;
	mediaUrls?: string[]; // images, videos, covers
	type: UserPostType;

	// Metadata
	createdAt: string; // ISO-DateTime e.g. "2024-04-14T14:25:00Z"
	updatedAt?: string;

	// Interactions
	likesCount: number;
	commentsCount: number;
	sharesCount: number;
	reactions?: Reaction[];

	// current user means client requesting the post
	isLikedByCurrentUser?: boolean;
	isReactedByCurrentUser?: boolean;
	isReportedByCurrentUser?: boolean;

	// Location & Tags
	location?: {
		lat: number;
		lng: number;
		name?: string;
	};
	tags?: Tag[];

	// Threading
	parentPostId?: string;
	isReply?: boolean;
}

// a reaction to a post
type Reaction =
	| '👍'
	| '❤️'
	| '😂'
	| '😮'
	| '😢'
	| '👏'
	| '🎶'
	| '😎'
	| '🔥'
	| '😁';

// a tag to attach to a post
export enum Tag {
	Banger = 'Banger', // Highly engaging and attention-grabbing
	WorldsFirst = "World's First", // Unique and exclusive content
	WorldsSecond = "World's Second", // Still unique but slightly less exclusive
	News = 'News', // Timely and relevant information
	Challenge = 'Challenge', // Interactive and engaging
	Review = 'Review', // Informative and opinion-based
	Tutorial = 'Tutorial', // Educational and helpful
	Guide = 'Guide', // Step-by-step instructions
	Story = 'Story', // Personal and relatable content
	Opinion = 'Opinion', // Thought-provoking and discussion-worthy
	Thought = 'Thought', // Intellectual and reflective
	Experience = 'Experience', // Personal and relatable insights
	Information = 'Information', // General knowledge sharing
	Announcement = 'Announcement', // Important updates
	Reminder = 'Reminder', // Useful and actionable
	Warning = 'Warning', // Urgent and critical
	Advertisement = 'Advertisement', // Promotional content
	Documentation = 'Documentation', // Technical and detailed
	Question = 'Question', // Encourages interaction
	Answer = 'Answer', // Provides solutions
}

export enum UserPostType {
	video = 'Video', // A video post
	post = 'Post', // a text or image post or a combination of text and image
	article = 'Article', // An article
	music = 'Music', // A beat or song
	text = 'Text', // small text. Kinda like a tweet
}
