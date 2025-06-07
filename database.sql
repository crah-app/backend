-- CREATE DATABASE
CREATE DATABASE IF NOT EXISTS crah CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crah;

-- USERS (standard information comes from clerk
CREATE TABLE Users (
    Id VARCHAR(255) NOT NULL,
    Name VARCHAR(100) NOT NULL,
    lastActiveAt DATETIME DEFAULT NULL,
    createdAt DATETIME DEFAULT NULL,
    avatar varchar(255),

    -- abstract information
    chatGreeting varchar(255) DEFAULT NULL,
    profileDescription varchar(255) DEFAULT NULL,
    riderType ENUM("Park Rider", "Street Rider", "Flat Rider") DEFAULT NULL,
    `rank` ENUM('Wood', 'Bronze', 'Silver', 'Gold', 'Diamond', 'Platin', 'Legendary') NOT NULL,
    rankPoints INT DEFAULT 0,
    level INT DEFAULT 0,

    PRIMARY KEY (Id)
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
    Type ENUM('Article', 'Video', 'Image', 'Text', 'Music') NOT NULL,
    Title VARCHAR(100),
    Description TEXT NOT NULL,
    Content TEXT,   -- markdown article
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    SourceKey VARCHAR(255) NULL,
    CoverSourceKey VARCHAR (255) NULL,
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

-- SHARES
CREATE TABLE Shares (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    PostId INT NOT NULL,
    UserId VARCHAR(255) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_share__post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_share__user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE ON UPDATE RESTRICT
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
	Name VARCHAR(50) PRIMARY KEY
);

INSERT INTO Tags (Name) VALUES
  ('Banger'),
  ('World\'s First'),
  ('World\'s Second'),
  ('News'),
  ('Challenge'),
  ('Review'),
  ('Tutorial'),
  ('Guide'),
  ('Story'),
  ('Opinion'),
  ('Thought'),
  ('Experience'),
  ('Information'),
  ('Announcement'),
  ('Reminder'),
  ('Warning'),
  ('Advertisement'),
  ('Documentation'),
  ('Question'),
  ('Answer');


CREATE TABLE PostTags (
	PostId INT,
	TagName VARCHAR(50),
	PRIMARY KEY (PostId, TagName),
    CONSTRAINT fk_tag__post FOREIGN KEY (PostId) REFERENCES Posts(Id) ON DELETE CASCADE ON UPDATE RESTRICT,
	FOREIGN KEY (TagName) REFERENCES Tags(Name) ON DELETE CASCADE
);

-- PARTECIPANTS
CREATE TABLE Participants (
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
    Costum BOOLEAN DEFAULT FALSE,
    Difficulty ENUM(
    'Novice',
    'Beginner',
    'Normal',
    'Intermediate',
    'Advanced',
    'Hard',
    'Very Hard',
    'Monster',
    'Impossible',
    'Goated',
    "Potential World's First"
) NOT NULL,
	SecondName VARCHAR(100) DEFAULT NULL
);

CREATE TABLE TrickTypes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    AllTricksName VARCHAR(100) NOT NULL,
    Type ENUM('Balance', 'Rewind', 'Overhead', 'Grab'),
    CONSTRAINT fk_trick_types__all_tricks FOREIGN KEY (AllTricksName) REFERENCES AllTricks(Name) ON DELETE CASCADE ON UPDATE RESTRICT
);

INSERT INTO AllTricks (Name, DefaultPoints, Difficulty, SecondName) VALUES
('Kickless', 300, 'Normal', NULL),

-- tailwhips
('Tailwhip', 100, 'Normal', NULL),
('Heelwhip', 100, 'Normal', NULL),
('Double Whip', 100, 'Normal', NULL),
('Triple Whip', 100, 'Normal', NULL),
('Quad Whip', 100, 'Normal', NULL),
('Quint Whip', 100, 'Normal', NULL),
('Sextuple Whip', 100, 'Normal', NULL),
('Septuple Whip', 100, 'Normal', NULL),
('Octuple Whip', 100, 'Normal', NULL),
('Nonuple Whip', 100, 'Normal', NULL),
('Decuple Whip', 100, 'Normal', NULL),

-- heelwhips
('Double Heelwhip', 100, 'Normal', NULL),
('Triple Heelwhip', 100, 'Normal', NULL),
('Quadruple Heelwhip', 100, 'Normal', NULL),
('Quintuple Heelwhip', 100, 'Normal', NULL),
('Sextuple Heelwhip', 100, 'Normal', NULL),
('Septuple Heelwhip', 100, 'Normal', NULL),
('Octuple Heelwhip', 100, 'Normal', NULL),
('Nonuple Heelwhip', 100, 'Normal', NULL),
('Decuple Heelwhip', 100, 'Normal', NULL),

-- finger whips
('Fingerwhip', 100, 'Normal', NULL),
('Mc Whip', 100, 'Normal', NULL),
('Whip Fingerwhip', 200, 'Normal', NULL),
('Double Fingerwhip', 200, 'Normal', NULL),
('Triple Fingerwhip', 200, 'Normal', NULL),
('Quad Fingerwhip', 200, 'Normal', NULL),
('Quint Fingerwhip', 200, 'Normal', NULL),
('Sextuple Fingerwhip', 200, 'Normal', NULL),
('Septuple Fingerwhip', 200, 'Normal', NULL),
('Double Mc Whip', 200, 'Normal', NULL),
('Triple Mc Whip', 200, 'Normal', NULL),
('Quadruple Mc Whip', 200, 'Normal', NULL),
('Quintuple Mc Whip', 200, 'Normal', NULL),
('Fingerwhip Bar', 200, 'Normal', 'Fingerwhip to Late Barspin'),
('Fingerwhip Rotor', 200, 'Normal', NULL),
('Fullwhip to Fingerwhip', 200, 'Normal', NULL),
('Rotorwhip to Fingerwhip', 200, 'Normal', NULL),
('Fingerwhip Fingerwhip', 200, 'Normal', NULL),
('Mc Whip to Fingerwhip', 200, 'Normal', NULL),
('Fingerwhip to Mc Whip', 200, 'Normal', NULL),
('Heel to Fingerwhip', 200, 'Normal', 'Heelwhip to Fingerwhip/ Heel Finger Rewind'),
('Barspin to Fingerwhip', 200, 'Normal', NULL),
('Oppo Barspin to Fingerwhip', 200, 'Normal', 'Oppo Bar Finger'),
('Double Whip to Fingerwwhip', 200, 'Normal', NULL),
('Oppo Fingerwhip', 200, 'Normal', NULL),
('Fingerwhip kick Heelwhup', 200, 'Normal', 'Fingerwhip Rewind'),
('Fingerwhip to Front Bri', 200, 'Normal', NULL),
('Fingerwhip to Buttercup', 200, 'Normal', NULL),
('Finger Rotortwist', 200, 'Normal', NULL),
('Full Untiwst Finger', 200, 'Normal', NULL),
('Rotor Bartwist Finger', 200, 'Normal', NULL),

-- simple overheads
('Briflip', 200, 'Normal', NULL),
('Umbrella', 100, 'Normal', 'Mc Flip'),
('Front Briflip', 100, 'Normal', 'Inward'),
('Front Scooter Flip', 100, 'Normal', "Frontscoot"),
('Back Scooter Flip', 100, 'Normal', 'Backscoot'),
('Dono Flip', 200, 'Normal', NULL),
('Back Dono Flip', 200, 'Normal', NULL),
('Unbri', 200, 'Normal', 'Dragon Bri'),
('Corona Flip', 200, 'Normal', NULL),
('Funky Flip', 200, 'Normal', NULL),
('STD Flip', 200, 'Normal', "Korpela Flip"),
('Whip Backscoot', 200, 'Normal', NULL),
('Whip Backscoot Whip', 200, 'Normal', 'Backscootercup'),
('Whip Frontscoot Whip', 200, 'Normal', 'Frontscootercup'),
('Whip Donoflip Whip', 200, 'Normal', 'Donocup'),
('Funky Flip whip', 200, 'Normal', NULL),
('Whip Inward', 200, 'Normal', 'Whip Front Bri'),
('Inwardcup', 200, 'Normal', 'Whip Frontbri Whip'),

-- hard overheads
('Spanner Flip', 100, 'Normal', 'Pot Flip'),
('Buttercup', 100, 'Normal', NULL),
('Bri Whip', 100, 'Normal', NULL),
('Bri Double Whip', 100, 'Normal', NULL),
('Bri Triple Whip', 100, 'Normal', NULL),
('Bri Quad Whip', 100, 'Normal', NULL),
('Bri Quint Whip', 100, 'Normal', NULL),
('Nothing Front Scoot', 100, 'Normal', NULL),
('Deckgrab Nothing Front Scoot', 100, 'Normal', NULL),
('Fingerblast', 100, 'Normal', 'Palm Flip'),
('Whip Fingerblast', 100, 'Normal', 'Whip Palm Flip'),
('Capron Flip', 100, 'Normal', NULL),
('Deckgrab to Frontscoot', 100, 'Normal', NULL),

-- complex overheads
('Donotwist', 200, 'Normal', NULL),
('Fingerblast Twist', 200, 'Normal', NULL),
('Whip Fingerblast Twist', 200, 'Normal', NULL),

-- 360 overheads
('360 Briflip', 200, 'Normal', NULL),
('360 Umbrella', 200, 'Normal', NULL),
('360 Whip Umbrella', 200, 'Normal', NULL),
('360 Buttercup', 200, 'Normal', NULL),
('360 Front Bri', 200, 'Normal', '360 Inward'),
('360 Whip Front Scooter Flip', 200, 'Normal', NULL),
('360 Front Scooter Flip', 200, 'Normal', NULL),
('360 Whip Dono Flip', 200, 'Normal', NULL),
('360 Dono Flip', 200, 'Normal', NULL),
('360 Whip Buttercup', 200, 'Normal', NULL),
('360 Funky Flip', 200, 'Normal', NULL),
('360 Capron Flip', 200, 'Normal', NULL),
('360 Whip Fingerblast', 200, 'Normal', NULL),
('360 Fingerblast', 200, 'Normal', NULL),

-- 360 tricks
('360 Barspin', 200, 'Normal', NULL),
('360 Tailwhip', 200, 'Normal', NULL),
('360 Whip Backscoot Whip', 200, 'Normal', '360 Backscootercup'),
('360 Whip Frontscoot Whip', 200, 'Normal', '360 Frontscootercup'),
('360 Whip Donoflip Whip', 200, 'Normal', '360 Donocup'),
('360 Funky Flip whip', 200, 'Normal', NULL),
('360 Whip Inward', 200, 'Normal', '360 Whip Front Bri'),
('360 Inwardcup', 200, 'Normal', '360 Whip Frontbri Whip'),

-- misc
('Donoflip Deckgrab', 200, 'Normal', NULL),
('Britwist', 200, 'Normal', NULL),
('Deckgrab Britwist', 200, 'Normal', NULL),
('Backflip', 200, 'Normal', NULL),
('Frontflip', 200, 'Normal', NULL),
('Flair', 200, 'Normal', NULL),
('Front Flair', 200, 'Normal', NULL),
('Cashroll', 200, 'Normal', NULL),
('90', 200, 'Normal', NULL),
('180', 200, 'Normal', NULL),
('360', 200, 'Normal', NULL),
('540', 200, 'Normal', NULL),
('720', 200, 'Normal', NULL),
('900', 200, 'Normal', NULL),
('1080', 200, 'Normal', NULL),
('1440', 200, 'Normal', NULL),
('half cab', 200, 'Normal', NULL),
('X Twist', 200, 'Normal', NULL),
('360 Bartiwst', 200, 'Normal', NULL),
('360 Britwist', 200, 'Normal', NULL),
('Whip Umbrella Twist', 200, 'Normal', NULL),
('Umbrella Twist', 200, 'Normal', NULL),
('Buttercup Twist', 200, 'Normal', NULL),
('Whip Buttercup Twist', 200, 'Normal', NULL),
('Whip Funkyflip', 200, 'Normal', NULL),
('Funkyflip Twist', 200, 'Normal', NULL),
('Double Bartwist', 200, 'Normal', NULL),
('Heel kick Briflip', 200, 'Normal', NULL),
('Heel kick Briwhip', 200, 'Normal', NULL),
('Kickless Briflip', 200, 'Normal', NULL),
('Unless Kickless', 200, 'Normal', NULL),
('Kickless Kickless', 200, 'Normal', NULL),
('Kickless kick Kickless', 200, 'Normal', NULL),
('Unless Unless', 200, 'Normal', NULL),
('Whip Rewind Rewind', 200, 'Normal', NULL),
('Heel Rewind Rewind', 200, 'Normal', NULL),
('Oppo Bri Kickless', 200, 'Normal', NULL),
('Sleazeball Flip', 200, 'Normal', 'Double Whip to Late Whip Umbrella'),
('360 Kickless Briflip', 200, 'Normal', NULL),
('Decade', 200, 'Normal', NULL),
('Body Varial', 200, 'Normal', NULL),
('Oppo Decade', 200, 'Normal', NULL),
('Free Willy', 200, 'Normal', NULL),
('Full Buttercup', 200, 'Normal', NULL),
('Double Whip Rotor', 200, 'Normal', NULL),
('Fullwhip Whip', 200, 'Normal', 'Double Whip to Late Whip Umbrella'),
('Fullheel Heelwhip', 200, 'Normal', NULL),
('Oppo Briflip', 200, 'Normal', NULL),
('Briflip Late Bar', 200, 'Normal', NULL),
('Buttercup Whip', 200, 'Normal', NULL),
('Inward to Late Whip', 200, 'Normal', NULL),
('Umbrella Kickless', 200, 'Normal', NULL),
('Umbrella to Late Whip', 200, 'Normal', NULL),
('Umbrella to Late Heelwhip', 200, 'Normal', 'Double Whip to Late Whip Umbrella'),
('Inward to Late Heelwhip', 200, 'Normal', 'Double Whip to Late Whip Umbrella'),
('Double Bri', 200, 'Normal', NULL),
('Double Inward', 200, 'Normal', NULL);
	
INSERT INTO TrickTypes (AllTricksName, Type) VALUES
('Kickless', 'Rewind'),
('Tailwhip', 'Rewind'),
('Heelwhip', 'Rewind'),
('Double Whip', 'Rewind'),
('Triple Whip', 'Rewind'),
('Quad Whip', 'Rewind'),
('Quint Whip', 'Rewind'),
('Sextuple Whip', 'Rewind'),
('Septuple Whip', 'Rewind'),
('Octuple Whip', 'Rewind'),
('Nonuple Whip', 'Rewind'),
('Decuple Whip', 'Rewind'),
('Double Heelwhip', 'Rewind'),
('Triple Heelwhip', 'Rewind'),
('Quadruple Heelwhip', 'Rewind'),
('Quintuple Heelwhip', 'Rewind'),
('Sextuple Heelwhip', 'Rewind'),
('Septuple Heelwhip', 'Rewind'),
('Octuple Heelwhip', 'Rewind'),
('Nonuple Heelwhip', 'Rewind'),
('Decuple Heelwhip', 'Rewind'),
('Fingerwhip', 'Balance'),
('Mc Whip', 'Balance'),
('Whip Fingerwhip', 'Balance'),
('Double Fingerwhip', 'Balance'),
('Triple Fingerwhip', 'Balance'),
('Quad Fingerwhip', 'Balance'),
('Quint Fingerwhip', 'Balance'),
('Sextuple Fingerwhip', 'Balance'),
('Septuple Fingerwhip', 'Balance'),
('Double Mc Whip', 'Balance'),
('Triple Mc Whip', 'Balance'),
('Quadruple Mc Whip', 'Balance'),
('Quintuple Mc Whip', 'Balance'),
('Fingerwhip Bar', 'Balance'),
('Fingerwhip Rotor', 'Balance'),
('Fullwhip to Fingerwhip', 'Balance'),
('Rotorwhip to Fingerwhip', 'Balance'),
('Fingerwhip Fingerwhip', 'Balance'),
('Mc Whip to Fingerwhip', 'Balance'),
('Fingerwhip to Mc Whip', 'Balance'),
('Heel to Fingerwhip', 'Balance'),
('Barspin to Fingerwhip', 'Balance'),
('Oppo Barspin to Fingerwhip', 'Balance'),
('Double Whip to Fingerwwhip', 'Balance'),
('Oppo Fingerwhip', 'Balance'),
('Fingerwhip kick Heelwhup', 'Balance'),
('Fingerwhip to Front Bri', 'Balance'),
('Fingerwhip to Buttercup', 'Balance'),
('Finger Rotortwist', 'Balance'),
('Full Untiwst Finger', 'Balance'),
('Rotor Bartwist Finger', 'Balance'),
('Briflip', 'Overhead'),
('Umbrella', 'Overhead'),
('Front Briflip', 'Overhead'),
('Front Scooter Flip', 'Overhead'),
('Back Scooter Flip', 'Overhead'),
('Dono Flip', 'Overhead'),
('Back Dono Flip', 'Overhead'),
('Unbri', 'Overhead'),
('Corona Flip', 'Overhead'),
('Funky Flip', 'Overhead'),
('STD Flip', 'Overhead'),
('Whip Backscoot', 'Overhead'),
('Whip Backscoot Whip', 'Overhead'),
('Whip Frontscoot Whip', 'Overhead'),
('Whip Donoflip Whip', 'Overhead'),
('Funky Flip whip', 'Overhead'),
('Whip Inward', 'Overhead'),
('Inwardcup', 'Overhead'),
('Spanner Flip', 'Overhead'),
('Buttercup', 'Overhead'),
('Bri Whip', 'Overhead'),
('Bri Double Whip', 'Overhead'),
('Bri Triple Whip', 'Overhead'),
('Bri Quad Whip', 'Overhead'),
('Bri Quint Whip', 'Overhead'),
('Nothing Front Scoot', 'Overhead'),
('Deckgrab Nothing Front Scoot', 'Overhead'),
('Fingerblast', 'Overhead'),
('Whip Fingerblast', 'Overhead'),
('Capron Flip', 'Overhead'),
('Deckgrab to Frontscoot', 'Overhead'),
('Donotwist', 'Overhead'),
('Fingerblast Twist', 'Overhead'),
('Whip Fingerblast Twist', 'Overhead'),
('360 Briflip', 'Overhead'),
('360 Umbrella', 'Overhead'),
('360 Whip Umbrella', 'Overhead'),
('360 Buttercup', 'Overhead'),
('360 Front Bri', 'Overhead'),
('360 Whip Front Scooter Flip', 'Overhead'),
('360 Front Scooter Flip', 'Overhead'),
('360 Whip Dono Flip', 'Overhead'),
('360 Dono Flip', 'Overhead'),
('360 Whip Buttercup', 'Overhead'),
('360 Funky Flip', 'Overhead'),
('360 Capron Flip', 'Overhead'),
('360 Whip Fingerblast', 'Overhead'),
('360 Fingerblast', 'Overhead'),
('360 Bartiwst', 'Balance'),
('360 Britwist', 'Overhead'),
('Whip Umbrella Twist', 'Overhead'),
('Umbrella Twist', 'Overhead'),
('Buttercup Twist', 'Overhead'),
('Whip Buttercup Twist', 'Overhead'),
('Whip Funkyflip', 'Overhead'),
('Funkyflip Twist', 'Overhead'),
('Double Bartwist', 'Balance'),
('Heel kick Briflip', 'Overhead'),
('Heel kick Briwhip', 'Overhead'),
('Kickless Briflip', 'Rewind'),
('Unless Kickless', 'Rewind'),
('Kickless Kickless', 'Rewind'),
('Kickless kick Kickless', 'Rewind'),
('Unless Unless', 'Rewind'),
('Whip Rewind Rewind', 'Rewind'),
('Heel Rewind Rewind', 'Rewind'),
('Oppo Bri Kickless', 'Rewind'),
('Sleazeball Flip', 'Overhead'),
('360 Kickless Briflip', 'Overhead'),
('Decade', 'Balance'),
('Body Varial', 'Balance'),
('Oppo Decade', 'Balance'),
('Free Willy', 'Grab'),
('Full Buttercup', 'Overhead'),
('Double Whip Rotor', 'Balance'),
('Fullwhip Whip', 'Rewind'),
('Fullheel Heelwhip', 'Rewind'),
('Oppo Briflip', 'Overhead'),
('Briflip Late Bar', 'Overhead'),
('Buttercup Whip', 'Overhead'),
('Inward to Late Whip', 'Overhead'),
('Umbrella Kickless', 'Overhead'),
('Umbrella to Late Whip', 'Overhead'),
('Umbrella to Late Heelwhip', 'Overhead'),
('Inward to Late Heelwhip', 'Overhead'),
('Double Bri', 'Overhead'),
('Double Inward', 'Overhead');


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

-- MESSAGES (based an IMessage and the extended version ChatMessage)
CREATE TABLE Messages (
    _id VARCHAR(36) PRIMARY KEY,                   
    ChatId VARCHAR(36) NOT NULL,
    SenderId VARCHAR(255) NOT NULL,
    ChatAvatar VARCHAR(255) NOT NULL,
    text TEXT,                                     
    image TEXT,                                 
    video TEXT,                               
    audio TEXT,                                 
    `system` BOOLEAN DEFAULT FALSE,             
    sent BOOLEAN DEFAULT FALSE,                    
    received BOOLEAN DEFAULT FALSE,             
    pending BOOLEAN DEFAULT FALSE,               
    quickReplies JSON,                             
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,  
    `type` ENUM('text', 'rider', 'trick') DEFAULT 'text',
    trickId varchar(100) DEFAULT NULL,                   
    riderId VARCHAR(255) DEFAULT NULL,
    isReply boolean DEFAULT FALSE,
    replyToMessageId varchar(36) DEFAULT NULL,          
    sourceData JSON,
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

-- video managment for video uploading/loading and cloudflare R2
CREATE TABLE Sources (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  `key` TEXT NOT NULL,
  `status` ENUM('pending', 'uploaded') DEFAULT 'pending',
  duration INT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  sourceRatio varchar(10) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSERT INTO Users (Id, Name) VALUES
-- ('user_1', 'John Doe'),
-- ('user_2', 'Jane Smith'),
-- ('user_3', 'Mike Johnson'),
-- ('user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'CaneAnatra'),
-- ('user_2vlanCL8M2qebrHnMGQgqdfz7Wo', 'josef_bbc');


-- INSERT INTO Friends (UserAId, UserBId) VALUES
-- ('user_1', 'user_2'),
-- ('user_2', 'user_3'),
-- ('user_3', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1');

-- INSERT INTO Follows (FollowerId, FollowedId) VALUES
-- ('user_1', 'user_3'),
-- ('user_2', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1'),
-- ('user_3', 'user_1');

-- INSERT INTO Posts (UserId, Type, Title, Description) VALUES
-- ('user_1', 'Article', 'My First Article', 'This is the content of the article.'),
-- ('user_2', 'Video', 'Cool Skateboarding Trick', 'Watch this amazing skateboard trick!'),
-- ('user_3', 'Post', 'Short Flash Post', 'Just a quick post!'),
-- ('user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'Music', 'My New Song', 'Listen to my latest music creation!');

-- INSERT INTO Likes (PostId, UserId) VALUES
-- (1, 'user_2'),
-- (2, 'user_3'),
-- (3, 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1');

-- INSERT INTO Comments (PostId, UserId, Message) VALUES
-- (1, 'user_2', 'Great article!'),
-- (2, 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'Amazing trick!'),
-- (3, 'user_1', 'Nice post!');

-- INSERT INTO CommentLikes (CommentId, UserId) VALUES
-- (1, 'user_3'),
-- (2, 'user_1');

-- INSERT INTO Emojies (Id) VALUES
-- ('thumbs_up'),
-- ('heart'),
-- ('laughing'),
-- ('clapping');

-- INSERT INTO Reactions (PostId, UserId, EmojiId) VALUES
-- (1, 'user_3', 'thumbs_up'),
-- (2, 'user_1', 'heart');

-- INSERT INTO Tags (PostId, Tag) VALUES
-- (1, 'technology'),
-- (2, 'skateboarding'),
-- (3, 'fun'),
-- (4, 'music');

-- INSERT INTO Participants (PostId, UserId, Role) VALUES
-- (1, 'user_2', 'Writer'),
-- (2, 'user_3', 'Graphic Designer'),
-- (3, 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'Camera Man');

-- INSERT INTO Tricks (UserId, Name, Points) VALUES
-- ('user_1', 'Kickless bar', 390),
-- ('user_2', 'Bri flip', 180);

-- INSERT INTO Spots (TrickId, Spot, Date) VALUES
-- (1, 'Flat', '2025-03-15'),
-- (1, 'OffLedge', '2023-02-11'),
-- (2, 'DropIn', '2021-08-18');

-- INSERT INTO Chats (Id, IsGroup, Name, CreatedAt, UpdatedAt)
-- VALUES 
-- ('chat_1', TRUE, 'Skaters Only 🛹', '2025-04-13 10:00:00', '2025-04-14 08:00:00'),
-- ('chat_2', FALSE, NULL, '2025-04-13 15:00:00', '2025-04-14 10:00:00'),
-- ('chat_3', TRUE, 'Video Editing Crew ✂️', '2025-04-12 11:30:00', '2025-04-14 09:00:00'),
-- ('chat_4', FALSE, NULL, '2025-04-12 11:30:00', '2025-04-14 09:00:00');


-- INSERT INTO ChatMembers (ChatId, UserId, JoinedAt, IsAdmin)
-- VALUES
-- -- chat_1
-- ('chat_1', 'user_1', '2025-04-13 10:00:00', TRUE),
-- ('chat_1', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '2025-04-13 10:01:00', TRUE),
-- ('chat_1', 'user_3', '2025-04-13 10:05:00', FALSE),

-- -- chat_2
-- ('chat_2', 'user_1', '2025-04-13 15:00:00', FALSE),
-- ('chat_2', 'user_3', '2025-04-13 15:00:00', FALSE),

-- -- chat_3
-- ('chat_3', 'user_1', '2025-04-12 11:30:00', TRUE),
-- ('chat_3', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', '2025-04-12 11:35:00', FALSE),
-- ('chat_3', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '2025-04-12 11:36:00', FALSE),

-- -- chat_4
-- ('chat_4', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', '2025-04-12 11:35:00', FALSE),
-- ('chat_4', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '2025-04-12 11:36:00', FALSE);


-- INSERT INTO Messages (_id, ChatId, SenderId, text, image, video, audio, `system`, sent, received, pending, quickReplies, createdAt, type)
-- VALUES
-- ('msg_1', 'chat_1', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', 'Wer bringt morgen die Kamera mit?', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 08:00:00', "text"),
-- ('msg_2', 'chat_2', 'user_3', 'Hier ist das Video 🎥', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 10:00:00', "text"),
-- ('msg_3', 'chat_3', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'Neuer LUT hochgeladen!', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 09:00:00', "text"),

-- ('msg_4', 'chat_4', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'Hier ist das unser neuer chat', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-14 10:00:00', "text"),
-- ('msg_5', 'chat_4', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', 'alright2', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-16 10:00:00', "text"),
-- ('msg_6', 'chat_4', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', 'alright', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-15 11:00:01', "text");

-- INSERT INTO Messages (_id, ChatId, SenderId, text, image, video, audio, `system`, sent, received, pending, quickReplies, createdAt, `type`, riderId)
-- VALUES
-- ('msg_7', 'chat_4', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-16 11:00:01', "rider", "user_2w8KalaMAlwDDEa7tTV3pV8Dte1");

-- INSERT INTO Messages (_id, ChatId, SenderId, text, image, video, audio, `system`, sent, received, pending, quickReplies, createdAt, `type`, trickId)
-- VALUES
-- ('msg_8', 'chat_4', 'user_2w8KalaMAlwDDEa7tTV3pV8Dte1', '', NULL, NULL, NULL, FALSE, FALSE, FALSE, FALSE, NULL, '2025-04-18 11:00:01', "trick", 1);


-- INSERT INTO MessageSeen (MessageId, UserId, SeenAt)
-- VALUES
-- ('msg_1', 'user_1', '2025-04-14 08:01:00'),
-- ('msg_1', 'user_3', '2025-04-14 08:02:00'),

-- ('msg_2', 'user_1', '2025-04-14 10:05:00'),

-- ('msg_3', 'user_1', '2025-04-14 09:05:00'),
-- ('msg_3', 'user_2vlanCL8M2qebrHnMGQgqdfz7Wo', '2025-04-14 09:06:00');
