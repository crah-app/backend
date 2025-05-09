-- CREATE DATABASE
CREATE DATABASE IF NOT EXISTS crah CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crah;

-- USERS (von Clerk verwaltet)
CREATE TABLE Users (
    Id VARCHAR(255) NOT NULL,
    Name VARCHAR(100) NOT NULL,
    PRIMARY KEY (Id),
    lastActiveAt DATETIME DEFAULT NULL
);

-- FRIENDS
CREATE TABLE Friends (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserAId VARCHAR(255) NOT NULL,
    UserBId VARCHAR(255) NOT NULL,
    CONSTRAINT fk_friend_a__user FOREIGN KEY (UserAId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_friend_b__user FOREIGN KEY (UserBId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- FRIENDSHIP REQUESTS
CREATE TABLE FriendshipRequests (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    FromUserId VARCHAR(255) NOT NULL,
    ToUserId VARCHAR(255) NOT NULL,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_from_user__user FOREIGN KEY (FromUserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_to_user__user FOREIGN KEY (ToUserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- FOLLOWS
CREATE TABLE Follows (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    FollowerId VARCHAR(255) NOT NULL,
    FollowedId VARCHAR(255) NOT NULL,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_follower FOREIGN KEY (FollowerId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_followed FOREIGN KEY (FollowedId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- POSTS
CREATE TABLE Posts (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId VARCHAR(255) NOT NULL,
    Type ENUM('Article', 'Video', 'Post', 'Music') NOT NULL,
    Title VARCHAR(100),
    Description TEXT NOT NULL,
    Content TEXT,   -- markdown article
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_post__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT chk_content_article CHECK (Type = 'Article' OR Content IS NULL)
);

-- POSTS REPORTS
CREATE TABLE PostReports (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId VARCHAR(255) NOT NULL,
    PostId INT NOT NULL,
    Reason VARCHAR(600) NOT NULL,
    IsClosed BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_posts_reports__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_posts_reports__post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- LIKES
CREATE TABLE Likes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    PostId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    CONSTRAINT fk_like__post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_like__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- COMMENTS
CREATE TABLE Comments (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    PostId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    Message VARCHAR(600) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment__post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_comment__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- COMMENTS LIKES
CREATE TABLE CommentLikes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CommentId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_like__comment FOREIGN KEY (CommentId) REFERENCES Comments(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_comment_like__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- EMOJIES
CREATE TABLE Emojies (
    Id VARCHAR(15) PRIMARY KEY
);

-- REACTIONS
CREATE TABLE Reactions (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    PostId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    EmojiId VARCHAR(15) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reaction__post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_reaction__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_reaction__emoji FOREIGN KEY (EmojiId) REFERENCES Emojies(Id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- TAGS
CREATE TABLE Tags (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    PostId INT NOT NULL,
    Tag VARCHAR(50) NOT NULL,
    CONSTRAINT fk_tag__post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- PARTECIPANTS
CREATE TABLE Partecipants (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    PostId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    Role ENUM('Rider', 'Graphic Designer', 'Camera Man', 'Video Editor', 'Writer', 'Helper') NOT NULL,
    CONSTRAINT fk_partecipant__post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_partecipant__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- CONTRIBUTIONS
CREATE TABLE Contributions (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    PostId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    Title VARCHAR(100) NOT NULL,
    Text TEXT NOT NULL,
    IsClosed BOOLEAN DEFAULT FALSE,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contribution__post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_contribution__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- CONTRIBUTIONS LIKES
CREATE TABLE ContributionLikes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ContributionId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contribution_like__contribution FOREIGN KEY (ContributionId) REFERENCES Contributions(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_contribution_like__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- CONTRIBUTIONS DISLIKES
CREATE TABLE ContributionDislikes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ContributionId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contribution_dislike__contribution FOREIGN KEY (ContributionId) REFERENCES Contributions(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_contribution_dislike__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- CONTRIBUTIONS COMMENTS
CREATE TABLE ContributionComments (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ContributionId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    Message VARCHAR(600) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contribution_comment__contribution FOREIGN KEY (ContributionId) REFERENCES Contributions(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_contribution_comment__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- CONTRIBUTION COMMENTS LIKES
CREATE TABLE ContributionCommentLikes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ContributionCommentId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contribution_comment_like__contribution_comment FOREIGN KEY (ContributionCommentId) REFERENCES ContributionComments(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_contribution_comment_like__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- COMMENTS DISLIKES
CREATE TABLE ContributionCommentDislikes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ContributionCommentId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contribution_comment_dislike__contribution_comment FOREIGN KEY (ContributionCommentId) REFERENCES ContributionComments(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_contribution_comment_dislike__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- ALL TRICKS
CREATE TABLE AllTricks (
    Name VARCHAR(100) NOT NULL PRIMARY KEY,
    DefaultPoints INT NOT NULL, -- points without the percentage increase of the spot
    Costum BOOLEAN DEFAULT FALSE
);

CREATE TABLE TrickTypes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    AllTricksName VARCHAR(100) NOT NULL,
    Type ENUM('Balance', 'Rewind', 'Overhead', 'Grab'),
    CONSTRAINT fk_trick_types__all_tricks FOREIGN KEY (AllTricksName) REFERENCES AllTricks(Name) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- TRICKS
CREATE TABLE Tricks (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId VARCHAR(255) NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Points INT NOT NULL,
    CONSTRAINT fk_trick__all_trick FOREIGN KEY (Name) REFERENCES AllTricks(Name) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- SPOTS
CREATE TABLE Spots (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    TrickId INT NOT NULL,
    Spot ENUM('Flat', 'OffLedge', 'DropIn', 'Flyout', 'Air') NOT NULL,
    Date DATE,
    CONSTRAINT fk_spot__trick FOREIGN KEY (TrickId) REFERENCES Tricks(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- CHATS
CREATE TABLE Chats (
    Id VARCHAR(36) PRIMARY KEY,
    IsGroup BOOLEAN DEFAULT FALSE,
    Avatar TEXT,
    Name VARCHAR(255),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CHAT MEMBERS
CREATE TABLE ChatMembers (
    ChatId VARCHAR(36) NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    JoinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    IsAdmin BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (ChatId, UserId),
    FOREIGN KEY (ChatId) REFERENCES Chats(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX idx_user_id (UserId)
);

-- MESSAGES (based an IMessage)
CREATE TABLE Messages (
    _id VARCHAR(36) PRIMARY KEY,                   -- geändert von Id auf _id
    ChatId VARCHAR(36) NOT NULL,
    SenderId VARCHAR(255) NOT NULL,
    text TEXT,                                     -- 'Content' wird zu 'text'
    image TEXT,                                    -- hinzugefügt für Bild
    video TEXT,                                    -- hinzugefügt für Video
    audio TEXT,                                    -- hinzugefügt für Audio
    `system` BOOLEAN DEFAULT FALSE,                -- Backticks statt doppelte Anführungszeichen
    sent BOOLEAN DEFAULT FALSE,                    -- hinzugefügt für sent
    received BOOLEAN DEFAULT FALSE,                -- hinzugefügt für received
    pending BOOLEAN DEFAULT FALSE,                 -- hinzugefügt für pending
    quickReplies JSON,                             -- hinzugefügt für quickReplies
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Timestamp
    `type` ENUM('text', 'rider', 'trick') DEFAULT 'text', -- korrekte ENUM-Syntax
    trickId INT DEFAULT NULL,                   -- TrickId hinzugefügt
    riderId VARCHAR(255) DEFAULT NULL,          -- RiderId hinzugefügt
    FOREIGN KEY (ChatId) REFERENCES Chats(Id) ON DELETE CASCADE,
    FOREIGN KEY (SenderId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX idx_chat_id_created_at (ChatId, createdAt)
);


-- MESSAGE SEEN
CREATE TABLE MessageSeen (
    MessageId VARCHAR(36) NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    SeenAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (MessageId, UserId),
    FOREIGN KEY (MessageId) REFERENCES Messages(_id) ON DELETE CASCADE,  -- Änderung hier: 'Id' zu '_id'
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX idx_user_id (UserId)
);

INSERT INTO Users (Id, Name) VALUES
('user_1', 'John Doe'),
('user_2', 'Jane Smith'),
('user_3', 'Mike Johnson'),
('user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'CaneAnatra'),
('user_2vlanCL8M2qebrHnMGQgqdfz7Wo', 'josef_bbc');


INSERT INTO Friends (UserAId, UserBId) VALUES
('user_1', 'user_2'),
('user_2', 'user_3'),
('user_3', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1');

INSERT INTO Follows (FollowerId, FollowedId) VALUES
('user_1', 'user_3'),
('user_2', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1'),
('user_3', 'user_1');

INSERT INTO Posts (UserId, Type, Title, Description) VALUES
('user_1', 'Article', 'My First Article', 'This is the content of the article.'),
('user_2', 'Video', 'Cool Skateboarding Trick', 'Watch this amazing skateboard trick!'),
('user_3', 'Post', 'Short Flash Post', 'Just a quick post!'),
('user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'Music', 'My New Song', 'Listen to my latest music creation!');

INSERT INTO Likes (PostId, UserId) VALUES
(1, 'user_2'),
(2, 'user_3'),
(3, 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1');

INSERT INTO Comments (PostId, UserId, Message) VALUES
(1, 'user_2', 'Great article!'),
(2, 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'Amazing trick!'),
(3, 'user_1', 'Nice post!');

INSERT INTO CommentLikes (CommentId, UserId) VALUES
(1, 'user_3'),
(2, 'user_1');

INSERT INTO Emojies (Id) VALUES
('thumbs_up'),
('heart'),
('laughing'),
('clapping');

INSERT INTO Reactions (PostId, UserId, EmojiId) VALUES
(1, 'user_3', 'thumbs_up'),
(2, 'user_1', 'heart');

INSERT INTO Tags (PostId, Tag) VALUES
(1, 'technology'),
(2, 'skateboarding'),
(3, 'fun'),
(4, 'music');

INSERT INTO Partecipants (PostId, UserId, Role) VALUES
(1, 'user_2', 'Writer'),
(2, 'user_3', 'Graphic Designer'),
(3, 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'Camera Man');

INSERT INTO AllTricks (Name, DefaultPoints) VALUES
('Kickless bar', 300),
('Bri flip', 200);

INSERT INTO TrickTypes (AllTricksName, Type) VALUES
('Kickless bar', 'Rewind'),
('Bri flip', 'Overhead');

INSERT INTO Tricks (UserId, Name, Points) VALUES
('user_1', 'Kickless bar', 390),
('user_2', 'Bri flip', 180);

INSERT INTO Spots (TrickId, Spot, Date) VALUES
(1, 'Flat', '2025-03-15'),
(1, 'OffLedge', '2023-02-11'),
(2, 'DropIn', '2021-08-18');

INSERT INTO Chats (Id, IsGroup, Name, CreatedAt, UpdatedAt)
VALUES 
('chat_1', TRUE, 'Skaters Only 🛹', '2025-04-13 10:00:00', '2025-04-14 08:00:00'),
('chat_2', FALSE, NULL, '2025-04-13 15:00:00', '2025-04-14 10:00:00'),
('chat_3', TRUE, 'Video Editing Crew ✂️', '2025-04-12 11:30:00', '2025-04-14 09:00:00'),
('chat_4', FALSE, NULL, '2025-04-12 11:30:00', '2025-04-14 09:00:00');


INSERT INTO ChatMembers (ChatId, UserId, JoinedAt, IsAdmin)
VALUES
-- chat_1
('chat_1', 'user_1', '2025-04-13 10:00:00', TRUE),
('chat_1', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '2025-04-13 10:01:00', TRUE),
('chat_1', 'user_3', '2025-04-13 10:05:00', FALSE),

-- chat_2
('chat_2', 'user_1', '2025-04-13 15:00:00', FALSE),
('chat_2', 'user_3', '2025-04-13 15:00:00', FALSE),

-- chat_3
('chat_3', 'user_1', '2025-04-12 11:30:00', TRUE),
('chat_3', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', '2025-04-12 11:35:00', FALSE),
('chat_3', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '2025-04-12 11:36:00', FALSE),

-- chat_4
('chat_4', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', '2025-04-12 11:35:00', FALSE),
('chat_4', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '2025-04-12 11:36:00', FALSE);


INSERT INTO Messages (_id, ChatId, SenderId, text, image, video, audio, `system`, sent, received, pending, quickReplies, createdAt, type)
VALUES
('msg_1', 'chat_1', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', 'Wer bringt morgen die Kamera mit?', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 08:00:00', "text"),
('msg_2', 'chat_2', 'user_3', 'Hier ist das Video 🎥', NULL, 'https://www.w3schools.com/html/mov_bbb.mp4', NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 10:00:00', "text"),
('msg_3', 'chat_3', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'Neuer LUT hochgeladen!', 'https://www.w3schools.com/html/mov_bbb.mp4', NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 09:00:00', "text"),

('msg_4', 'chat_4', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'Hier ist das unser neuer chat', NULL, 'https://www.youtube.com/watch?v=UTjwyDuVjRM&t=225s', NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 10:00:00', "text"),
('msg_5', 'chat_4', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'alright2', NULL, 'https://www.w3schools.com/html/mov_bbb.mp4', NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-16 10:00:00', "text"),
('msg_6', 'chat_4', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', 'alright', NULL, 'https://www.w3schools.com/html/mov_bbb.mp4
', NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-15 11:00:01', "text");

INSERT INTO Messages (_id, ChatId, SenderId, text, image, video, audio, `system`, sent, received, pending, quickReplies, createdAt, `type`, riderId)
VALUES
('msg_7', 'chat_4', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-16 11:00:01', "rider", "user_2w8KalaMAlwDDEa7tTV3pV8Dte1");

INSERT INTO Messages (_id, ChatId, SenderId, text, image, video, audio, `system`, sent, received, pending, quickReplies, createdAt, `type`, trickId)
VALUES
('msg_8', 'chat_4', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', '', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-18 11:00:01', "trick", 1);


INSERT INTO MessageSeen (MessageId, UserId, SeenAt)
VALUES
('msg_1', 'user_1', '2025-04-14 08:01:00'),
('msg_1', 'user_3', '2025-04-14 08:02:00'),

('msg_2', 'user_1', '2025-04-14 10:05:00'),

('msg_3', 'user_1', '2025-04-14 09:05:00'),
('msg_3', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '2025-04-14 09:06:00');

-- video managment for video uploading/loading and cloudflare R2
CREATE TABLE videos (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  key TEXT NOT NULL,
  status ENUM('pending', 'uploaded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
