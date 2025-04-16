-- CREATE DATABASE
CREATE DATABASE IF NOT EXISTS crah CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crah;

-- USERS (von Clerk verwaltet)
CREATE TABLE Users (
    Id VARCHAR(255) NOT NULL,
    Name VARCHAR(100) NOT NULL,
    PRIMARY KEY (Id),
    lastActiveAt DATETIME DEFAULT NULL,
);

-- FRIENDS
CREATE TABLE Friends (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserAId VARCHAR(255) NOT NULL,
    UserBId VARCHAR(255) NOT NULL,
    CONSTRAINT fk_friend_a_user FOREIGN KEY (UserAId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_friend_b_user FOREIGN KEY (UserBId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- FOLLOWS
CREATE TABLE Follows (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    FollowerId VARCHAR(255) NOT NULL,
    FollowedId VARCHAR(255) NOT NULL,
    CONSTRAINT fk_follower FOREIGN KEY (FollowerId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_followed FOREIGN KEY (FollowedId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- POSTS
CREATE TABLE Posts (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId VARCHAR(255) NOT NULL,
    Type ENUM('Article', 'Video', 'Flash', 'Music') NOT NULL,
    Title VARCHAR(100),
    Description TEXT NOT NULL,
    CreationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastEditDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- LIKES
CREATE TABLE Likes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    PostId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    CONSTRAINT fk_like_post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_like_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- COMMENTS
CREATE TABLE Comments (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    PostId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    Message VARCHAR(600) NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_comment_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- COMMENTS LIKES
CREATE TABLE CommentsLikes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CommentId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    CONSTRAINT fk_like_comment FOREIGN KEY (CommentId) REFERENCES Comments(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_like_comment_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
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
    CONSTRAINT fk_reaction_post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_reaction_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_reaction_emoji FOREIGN KEY (EmojiId) REFERENCES Emojies(Id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- TAGS
CREATE TABLE Tags (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    PostId INT NOT NULL,
    Tag VARCHAR(50) NOT NULL,
    CONSTRAINT fk_tag_post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- CONTRIBUTIONS
CREATE TABLE Contributions (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    PostId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    Role ENUM('Rider', 'Graphic Designer', 'Camera Man', 'Video Editor', 'Writer', 'Helper') NOT NULL,
    CONSTRAINT fk_contribution_post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_contribution_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- TRICKS
CREATE TABLE Tricks (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId VARCHAR(255) NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Points INT NOT NULL,
    Date DATE,
    CONSTRAINT fk_trick_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- SPOTS
CREATE TABLE Spots (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    TrickId INT NOT NULL,
    Spot ENUM('Flat', 'OffLedge', 'DropIn', 'Flyout', 'Air') NOT NULL,
    CONSTRAINT fk_spot_trick FOREIGN KEY (TrickId) REFERENCES Tricks(Id) ON DELETE CASCADE ON UPDATE RESTRICT
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
    _id VARCHAR(36) PRIMARY KEY,                -- geändert von Id auf _id
    ChatId VARCHAR(36) NOT NULL,
    SenderId VARCHAR(255) NOT NULL,
    text TEXT,                                  -- 'Content' wird zu 'text'
    image TEXT,                                 -- hinzugefügt für Bild
    video TEXT,                                 -- hinzugefügt für Video
    audio TEXT,                                 -- hinzugefügt für Audio
    `system` BOOLEAN DEFAULT FALSE,             -- geändert: 'system' in Backticks gesetzt
    sent BOOLEAN DEFAULT FALSE,                 -- hinzugefügt für sent (optional)
    received BOOLEAN DEFAULT FALSE,             -- hinzugefügt für received (optional)
    pending BOOLEAN DEFAULT FALSE,              -- hinzugefügt für pending (optional)
    quickReplies JSON,                          -- hinzugefügt für quickReplies (optional)
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 'CreatedAt' bleibt gleich
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


-- FILE TREE (Info)
-- /users
--   /pfps/<USER_ID>.png
--   /banners/<USER_ID>.png
-- /posts
--   /articles/<POST_ID>.md
--   /videos/<POST_ID>.mp4
--   /music/<POST_ID>.mp3
--   /covers/<POST_ID>.png

-- https://mariadb.com/kb/en/foreign-keys/

INSERT INTO Users (Id, Name) VALUES
('user_1', 'John Doe'),
('user_2', 'Jane Smith'),
('user_3', 'Mike Johnson'),
('user_4', 'Emily Davis'),
('user_2vlanCL8M2qebrHnMGQgqdfz7Wo', 'josef_bbc');


INSERT INTO Friends (UserAId, UserBId) VALUES
('user_1', 'user_2'),
('user_2', 'user_3'),
('user_3', 'user_4');

INSERT INTO Follows (FollowerId, FollowedId) VALUES
('user_1', 'user_3'),
('user_2', 'user_4'),
('user_3', 'user_1');

INSERT INTO Posts (UserId, Type, Title, Description) VALUES
('user_1', 'Article', 'My First Article', 'This is the content of the article.'),
('user_2', 'Video', 'Cool Skateboarding Trick', 'Watch this amazing skateboard trick!'),
('user_3', 'Flash', 'Short Flash Post', 'Just a quick post!'),
('user_4', 'Music', 'My New Song', 'Listen to my latest music creation!');

INSERT INTO Likes (PostId, UserId) VALUES
(1, 'user_2'),
(2, 'user_3'),
(3, 'user_4');

INSERT INTO Comments (PostId, UserId, Message) VALUES
(1, 'user_2', 'Great article!'),
(2, 'user_4', 'Amazing trick!'),
(3, 'user_1', 'Nice post!');

INSERT INTO CommentsLikes (CommentId, UserId) VALUES
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

INSERT INTO Contributions (PostId, UserId, Role) VALUES
(1, 'user_2', 'Writer'),
(2, 'user_3', 'Graphic Designer'),
(3, 'user_4', 'Camera Man');

INSERT INTO Tricks (UserId, Name, Points, Date) VALUES
('user_1', 'Ollie', 10, '2025-04-14'),
('user_2', 'Kickflip', 20, '2025-04-15');

INSERT INTO Spots (TrickId, Spot) VALUES
(1, 'Flat'),
(2, 'OffLedge');

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
('chat_3', 'user_4', '2025-04-12 11:35:00', FALSE),
('chat_3', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '2025-04-12 11:36:00', FALSE),

-- chat_4
('chat_4', 'user_4', '2025-04-12 11:35:00', FALSE),
('chat_4', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '2025-04-12 11:36:00', FALSE);


INSERT INTO Messages (_id, ChatId, SenderId, text, image, video, audio, `system`, sent, received, pending, quickReplies, createdAt)
VALUES
('msg_1', 'chat_1', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', 'Wer bringt morgen die Kamera mit?', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 08:00:00'),
('msg_2', 'chat_2', 'user_3', 'Hier ist das Video 🎥', NULL, 'https://cdn.example.com/messages/video_1.mp4', NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 10:00:00'),
('msg_3', 'chat_3', 'user_4', 'Neuer LUT hochgeladen!', 'https://cdn.example.com/files/lut_v1.zip', NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 09:00:00'),

('msg_4', 'chat_4', 'user_4', 'Hier ist das unser neuer chat', NULL, 'https://www.youtube.com/watch?v=UTjwyDuVjRM&t=225s', NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 10:00:00');


INSERT INTO MessageSeen (MessageId, UserId, SeenAt)
VALUES
('msg_1', 'user_1', '2025-04-14 08:01:00'),
('msg_1', 'user_3', '2025-04-14 08:02:00'),

('msg_2', 'user_1', '2025-04-14 10:05:00'),

('msg_3', 'user_1', '2025-04-14 09:05:00'),
('msg_3', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '2025-04-14 09:06:00');
