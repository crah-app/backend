-- Erstelle und nutze die Datenbank
CREATE DATABASE crah;
USE crah;

-- Users-Tabelle
CREATE TABLE Users (
    Id INT AUTO_INCREMENT NOT NULL,
    Name VARCHAR(25) NOT NULL,
    PRIMARY KEY (Id)
);

-- Friends-Tabelle
CREATE TABLE Friends (
    Id INT AUTO_INCREMENT NOT NULL,
    UserAId INT NOT NULL,
    UserBId INT NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT fk_friend_a_user FOREIGN KEY (UserAId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_friend_b_user FOREIGN KEY (UserBId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- Follows-Tabelle
CREATE TABLE Follows (
    Id INT AUTO_INCREMENT NOT NULL,
    FollowerId INT NOT NULL,
    FollowedId INT NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT fk_follower_user FOREIGN KEY (FollowerId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_followed_user FOREIGN KEY (FollowedId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- Posts-Tabelle
CREATE TABLE Posts (
    Id INT AUTO_INCREMENT NOT NULL,
    UserId INT NOT NULL,
    Type ENUM('Article', 'Video', 'Flash', 'Music') NOT NULL,
    Title VARCHAR(50) NULL,
    Description VARCHAR(600) NOT NULL,
    CreationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastEditDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (Id),
    CONSTRAINT fk_post_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- Likes-Tabelle
CREATE TABLE Likes (
    Id INT AUTO_INCREMENT NOT NULL,
    PostId INT NOT NULL,
    UserId INT NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT fk_like_post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_like_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- Comments-Tabelle
CREATE TABLE Comments (
    Id INT AUTO_INCREMENT NOT NULL,
    PostId INT NOT NULL,
    UserId INT NOT NULL,
    Message VARCHAR(600) NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT fk_comment_post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_comment_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- CommentsLikes-Tabelle
CREATE TABLE CommentsLikes (
    Id INT AUTO_INCREMENT NOT NULL,
    CommentId INT NOT NULL,
    UserId INT NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT fk_like_comment FOREIGN KEY (CommentId) REFERENCES Comments(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_like_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- Emojies-Tabelle
CREATE TABLE Emojies (
    Id VARCHAR(15) NOT NULL,
    PRIMARY KEY (Id)
);

-- Reactions-Tabelle
CREATE TABLE Reactions (
    Id INT AUTO_INCREMENT NOT NULL,
    PostId INT NOT NULL,
    UserId INT NOT NULL,
    EmojiId VARCHAR(15) NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT fk_reaction_post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_reaction_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_reaction_emoji FOREIGN KEY (EmojiId) REFERENCES Emojies(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- Tags-Tabelle
CREATE TABLE Tags (
    Id INT AUTO_INCREMENT NOT NULL,
    PostId INT NOT NULL,
    Tag VARCHAR(25) NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT fk_tag_post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- Contributions-Tabelle
CREATE TABLE Contributions (
    Id INT AUTO_INCREMENT NOT NULL,
    PostId INT NOT NULL,
    UserId INT NOT NULL,
    Role ENUM('Rider', 'Graphic Designer', 'Camera Man', 'Video Editor', 'Writer', 'Helper') NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT fk_contribution_post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_contribution_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- Tricks-Tabelle
CREATE TABLE Tricks (
    Id INT AUTO_INCREMENT NOT NULL,
    UserId INT NOT NULL,
    Name VARCHAR(255) NOT NULL,
    Points INT NOT NULL,
    Date DATE NULL,
    PRIMARY KEY (Id),
    CONSTRAINT fk_trick_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- Spots-Tabelle
CREATE TABLE Spots (
    Id INT AUTO_INCREMENT NOT NULL,
    TrickId INT NOT NULL,
    Spot ENUM('Flat', 'OffLedge', 'DropIn', 'Flyout', 'Air') NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT fk_spot_trick FOREIGN KEY (TrickId) REFERENCES Tricks(Id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- Dummy-Daten einfügen
INSERT INTO Users (Name) VALUES ('Josef'), ('Henke'), ('Cane'), ('Kalle');

INSERT INTO Friends(UserAId, UserBId) VALUES (1, 2), (1, 3), (2, 3);

INSERT INTO Follows(FollowerId, FollowedId) VALUES (1, 2), (2, 3), (3, 1);

INSERT INTO Emojies(Id) VALUES ('JustLandedBangers'), ('ConfusedHenke'), ('HappyHenke');

INSERT INTO Posts(UserId, Type, Title, Description) VALUES 
(1, 'Video', 'Europe: Crah 2025', 'Best flat scooter tricks of the year!'),
(1, 'Flash', NULL, 'Got new scooter parts: Ethic PandemoniumV2 and Longway T bars.');

INSERT INTO Tags(PostId, Tag) VALUES (1, 'Edit'), (1, 'Worlds First'), (2, 'Hardware');

INSERT INTO Contributions(PostId, UserId, Role) VALUES (1, 3, 'Video Editor'), (1, 1, 'Rider');

INSERT INTO Likes(UserId, PostId) VALUES (1, 1), (2, 2), (3, 1);

INSERT INTO Reactions(UserId, PostId, EmojiId) VALUES (1, 1, 'JustLandedBangers'), (2, 2, 'HappyHenke');

INSERT INTO Comments(UserId, PostId, Message) VALUES (1, 1, 'That was insane!'), (2, 1, 'Best edit ever!');

INSERT INTO CommentsLikes(UserId, CommentId) VALUES (1, 1), (2, 2);

INSERT INTO Tricks (UserId, Name, Points, Date) VALUES (1, 'double whip', 150, '2025-01-23');

INSERT INTO Spots (TrickId, Spot) VALUES (1, 'Flat'), (1, 'OffLedge');


INSERT INTO Tricks (UserId, Name, Points) VALUES (1, "bri flip", 500, "2024-08-19");
INSERT INTO Spots (TrickId, Type) VALUES (3, 'DropIn');
INSERT INTO Spots (TrickId, Type) VALUES (3, 'Air');
