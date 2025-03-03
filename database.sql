-- https://mariadb.com/kb/en/foreign-keys/

CREATE DATABASE crah;
USE crah;

CREATE TABLE Users (
    Id INT AUTO_INCREMENT NOT NULL,
    Name VARCHAR(25) NOT NULL,
    PRIMARY KEY (Id)
);

CREATE TABLE Friends (
	Id INT AUTO_INCREMENT NOT NULL,
	UserAId INT NOT NULL ,
	UserBId INT NOT NULL,
	PRIMARY KEY (Id),
	CONSTRAINT `fk_friend_a_user`
    	FOREIGN KEY (UserAId) REFERENCES Users (Id)
    	ON DELETE CASCADE
    	ON UPDATE RESTRICT,
    CONSTRAINT `fk_friend_b_user`
    	FOREIGN KEY (UserBId) REFERENCES Users (Id)
    	ON DELETE CASCADE
    	ON UPDATE RESTRICT
);

CREATE TABLE Follows (
	Id INT AUTO_INCREMENT NOT NULL,
	FollowerId INT NOT NULL,
	FollowedId INT NOT NULL,
	PRIMARY KEY (Id),
	CONSTRAINT `fk_follower_user`
    	FOREIGN KEY (FollowerId) REFERENCES Users (Id)
    	ON DELETE CASCADE
    	ON UPDATE RESTRICT,
    CONSTRAINT `fk_followed_user`
    	FOREIGN KEY (FollowedId) REFERENCES Users (Id)
    	ON DELETE CASCADE
    	ON UPDATE RESTRICT
);

-- Flash posts don't have title nor cover
CREATE TABLE Posts (
	Id INT AUTO_INCREMENT NOT NULL,
	UserId INT NOT NULL,
	Type enum('Article', 'Video', 'Flash', 'Music') NOT NULL,
	Title VARCHAR(50) NULL,
	Description VARCHAR(600) NOT NULL,
	CreationDate DATE NOT NULL DEFAULT CURRENT_DATE(),
	LastEditDate DATE NOT NULL DEFAULT CURRENT_DATE(),
	PRIMARY KEY (Id),
	CONSTRAINT `fk_post_user`
		FOREIGN KEY (UserId) REFERENCES Users (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT
);

CREATE TABLE Likes (
	Id INT AUTO_INCREMENT NOT NULL,
	PostId INT NOT NULL,
	UserId INT NOT NULL,
	PRIMARY KEY (Id),
	CONSTRAINT `fk_like_post`
		FOREIGN KEY (PostId) REFERENCES Posts (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT,
	CONSTRAINT `fk_like_user`
		FOREIGN KEY (UserId) REFERENCES Users (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT
);

CREATE TABLE Comments (
	Id INT AUTO_INCREMENT NOT NULL,
	PostId INT NOT NULL,
	UserId VARCHAR(25) NOT NULL,
	Message VARCHAR(600) NOT NULL,
	PRIMARY KEY (Id),
	CONSTRAINT `fk_comment_post`
		FOREIGN KEY (PostId) REFERENCES Posts (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT
	CONSTRAINT `fk_comment_user`
		FOREIGN KEY (UserId) REFERENCES Users (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT
);

CREATE TABLE CommentsLikes (
	Id INT AUTO_INCREMENT NOT NULL,
	CommentId INT NOT NULL,
	UserId INT NOT NULL,
	PRIMARY KEY (Id),
	CONSTRAINT `fk_like_comment`
		FOREIGN KEY (CommentId) REFERENCES Comments (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT,
	CONSTRAINT `fk_like_user`
		FOREIGN KEY (UserId) REFERENCES Users (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT
);

CREATE TABLE Reactions (
	Id INT AUTO_INCREMENT NOT NULL,
	PostId INT NOT NULL,
	UserId INT NOT NULL,
	EmojiId VARCHAR(15) NOT NULL,
	PRIMARY KEY (Id),
	CONSTRAINT `fk_reaction_post`
		FOREIGN KEY (PostId) REFERENCES Posts (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT,
	CONSTRAINT `fk_reaction_user`
		FOREIGN KEY (UserId) REFERENCES Users (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT
);

CREATE TABLE Emojies (
	Id VARCHAR(15) NOT NULL,
	PRIMARY KEY (Id),
);

CREATE TABLE Tags (
	Id INT AUTO_INCREMENT NOT NULL,
	PostId INT NOT NULL,
	Tag VARCHAR(25) NOT NULL,
	PRIMARY KEY (Id),
	CONSTRAINT `fk_tag_post`
		FOREIGN KEY (PostId) REFERENCES Posts (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT
);

CREATE TABLE Contributions (
	Id INT AUTO_INCREMENT NOT NULL,
	PostId INT NOT NULL,
	UserId INT NOT NULL,
	Role enum('Rider', 'Graphic Designer', 'Camera Man', 'Video Editor', 'Writer', 'Helper'),
	PRIMARY KEY (Id),
	CONSTRAINT `fk_contribution_post`
		FOREIGN KEY (PostId) REFERENCES Posts (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT,
	CONSTRAINT `fk_contribution_user`
		FOREIGN KEY (UserId) REFERENCES Users (Id)
		ON DELETE CASCADE
		ON UPDATE RESTRICT
);

CREATE TABLE Tricks (
    Id INT AUTO_INCREMENT NOT NULL,
    UserId INT NOT NULL,
    Name VARCHAR(255) NOT NULL,
    Points INT NOT NULL,
    Date DATE NULL,
    PRIMARY KEY (Id),
    CONSTRAINT `fk_trick_user`
    	FOREIGN KEY (UserId) REFERENCES Users (Id)
    	ON DELETE CASCADE
    	ON UPDATE RESTRICT
);

CREATE TABLE Spots (
    Id INT AUTO_INCREMENT NOT NULL,
    TrickId INT NOT NULL,
    Spot enum ('Flat', 'OffLedge', 'DropIn', 'Flyout', 'Air') NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT `fk_spot_trick`
    	FOREIGN KEY (TrickId) REFERENCES Tricks (Id)
    	ON DELETE CASCADE
    	ON UPDATE RESTRICT
);


-- FILE TREE FOR DATA STORAGE
-- /users
--   /pfps
--     <USER_ID>.png
--   /banners
--     <USER_ID>.png
-- /posts
--   /articles
--     <POST_ID>.md
--   /videos
--     <POST_ID>.mp4
--   /music
--     <POST_ID>.mp3
--   /covers
--     <POST_ID>.png

INSERT INTO Users (Name) VALUES ("Josef");
INSERT INTO Users (Name) VALUES ("Henke");
INSERT INTO Users (Name) VALUES ("Cane");
INSERT INTO Users (Name) VALUES ("Kalle");

INSERT INTO Friends(UserAId, UserBId) VALUES (0, 2);
INSERT INTO Friends(UserAId, UserBId) VALUES (1, 3);
INSERT INTO Friends(UserAId, UserBId) VALUES (1, 2);

INSERT INTO Followers(FollowerId, FollowedId) VALUES (0, 2);
INSERT INTO Followers(FollowerId, FollowedId) VALUES (1, 3);
INSERT INTO Followers(FollowerId, FollowedId) VALUES (0, 1);

INSERT INTO Emojies(Id) VALUES ("JustLandedBangers");
INSERT INTO Emojies(Id) VALUES ("ConfusedHenke");
INSERT INTO Emojies(Id) VALUES ("HappyHenke");

INSERT INTO Posts(UserId, Type, Title, Description)
	VALUES (0, 'Video', "Europe: Crah 2025", "The Crah team is down to the best flat scooter tricks of the year!");
INSERT INTO Tags(PostId, Tag) VALUES (0, "Edit");
INSERT INTO Tags(PostId, Tag) VALUES (0, "World's First");
INSERT INTO Contributions(PostId, UserId, Role) VALUES (0, 3, 'Video Editor');
INSERT INTO Contributions(PostId, UserId, Role) VALUES (0, 0, 'Rider');
INSERT INTO Contributions(PostId, UserId, Role) VALUES (0, 2, 'Rider');
	
INSERT INTO Posts(UserId, Type, Description)
	VALUES (0, 'Flash', "Today I got my new scooter parts: Ethic PandemoniumV2 and Longway T bars.");
INSERT INTO Tags(PostId, Tag) VALUES (1, "Hardware");

INSERT INTO Likes(UserId, PostId) VALUES (0, 0);
INSERT INTO Likes(UserId, PostId) VALUES (0, 1);
INSERT INTO Likes(UserId, PostId) VALUES (1, 0);

INSERT INTO Reactions(UserId, PostId, EmojiId) VALUES (0, 0, "JustLandedBangers");
INSERT INTO Reactions(UserId, PostId, EmojiId) VALUES (0, 1, "HappyHenke");
INSERT INTO Reactions(UserId, PostId, EmojiId) VALUES (1, 0, "ConfusedHenke");

INSERT INTO Comments(UserId, PostId, Message) VALUES (0, 0, "I can't believe you actually landed that bro! That was soo insane.");
INSERT INTO Comments(UserId, PostId, Message) VALUES (1, 0, "Finally, I've always wanted to see flat-only scooter edit with a team of riders");
INSERT INTO Comments(UserId, PostId, Message) VALUES (2, 1, "Pandemonium is the best scooter deck");

INSERT INTO CommentsLikes(UserId, CommentId) VALUES (0, 0);
INSERT INTO CommentsLikes(UserId, CommentId) VALUES (2, 0);
INSERT INTO CommentsLikes(UserId, CommentId) VALUES (1, 1);

INSERT INTO Tricks (UserId, Name, Points) VALUES (1, "double whip", 150, "2025-01-23");
INSERT INTO Spots (TrickId, Type) VALUES (1, 'Flat');
INSERT INTO Spots (TrickId, Type) VALUES (1, 'OffLedge');
INSERT INTO Spots (TrickId, Type) VALUES (1, 'DropIn');

INSERT INTO Tricks (UserId, Name, Points) VALUES (1, "triple whip", 400, "2024-06-14");
INSERT INTO Spots (TrickId, Type) VALUES (2, 'Flat');
INSERT INTO Spots (TrickId, Type) VALUES (2, 'OffLedge');

INSERT INTO Tricks (UserId, Name, Points) VALUES (1, "bri flip", 500, "2024-08-19");
INSERT INTO Spots (TrickId, Type) VALUES (3, 'DropIn');
INSERT INTO Spots (TrickId, Type) VALUES (3, 'Air');
