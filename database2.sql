CREATE DATABASE crah;
USE crah;

CREATE TABLE Users (
    Id INT AUTO_INCREMENT NOT NULL,
    Name VARCHAR(25) NOT NULL,
    PRIMARY KEY (Id)
);

CREATE TABLE Friends (
    Id INT AUTO_INCREMENT NOT NULL,
    UserAId INT NOT NULL,
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

CREATE TABLE Posts (
    Id INT AUTO_INCREMENT NOT NULL,
    UserId INT NOT NULL,
    Type ENUM('Article', 'Video', 'Flash', 'Music') NOT NULL,
    Title VARCHAR(50) NULL,
    Description VARCHAR(600) NOT NULL,
    CreationDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastEditDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    UserId INT NOT NULL,
    Message VARCHAR(600) NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT `fk_comment_post`
        FOREIGN KEY (PostId) REFERENCES Posts (Id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    CONSTRAINT `fk_comment_user`
        FOREIGN KEY (UserId) REFERENCES Users (Id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
);

CREATE TABLE Emojies (
    Id VARCHAR(15) NOT NULL,
    PRIMARY KEY (Id)
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
    Spot ENUM('Flat', 'OffLedge', 'DropIn', 'Flyout', 'Air') NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT `fk_spot_trick`
        FOREIGN KEY (TrickId) REFERENCES Tricks (Id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
);

-- ✅ FIXED INSERT-STATEMENTS:
INSERT INTO Users (Name) VALUES ("Josef"), ("Henke"), ("Cane"), ("Kalle");

INSERT INTO Friends(UserAId, UserBId) VALUES (1, 2), (2, 3), (2, 4);

INSERT INTO Follows(FollowerId, FollowedId) VALUES (1, 2), (2, 3), (1, 4);

INSERT INTO Emojies(Id) VALUES ("JustLandedBangers"), ("ConfusedHenke"), ("HappyHenke");

INSERT INTO Tricks (UserId, Name, Points, Date) VALUES 
(1, "double whip", 150, "2025-01-23"),
(1, "triple whip", 400, "2024-06-14"),
(1, "bri flip", 500, "2024-08-19");

INSERT INTO Spots (TrickId, Spot) VALUES 
(1, 'Flat'), (1, 'OffLedge'), (1, 'DropIn'),
(2, 'Flat'), (2, 'OffLedge'),
(3, 'DropIn'), (3, 'Air');
