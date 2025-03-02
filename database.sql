-- https://mariadb.com/kb/en/foreign-keys/

CREATE DATABASE crah;
USE crah;

CREATE TABLE Users (
    Id INT AUTO_INCREMENT NOT NULL,
    Name VARCHAR(25) NOT NULL,
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
    Spot enum ('Flat', 'OffLedge', 'DropIn', 'Flyout', 'Air') NOT NULL,
    PRIMARY KEY (Id),
    CONSTRAINT `fk_spot_trick`
    	FOREIGN KEY (TrickId) REFERENCES Tricks (Id)
    	ON DELETE CASCADE
    	ON UPDATE RESTRICT
);

INSERT INTO
    Users (Name)
VALUES
    ("Josef");

INSERT INTO
    Users (Name)
VALUES
    ("Henke");

INSERT INTO
    Users (Name)
VALUES
    ("Cane");

INSERT INTO
    Users (Name)
VALUES
    ("Kalle");

INSERT INTO
    Tricks (UserId, Name, Points)
VALUES
    (1, "double whip", 150, "2025-01-23");

INSERT INTO
    Spots (TrickId, Type)
VALUES
    (1, 'Flat');

INSERT INTO
    Spots (TrickId, Type)
VALUES
    (1, 'OffLedge');

INSERT INTO
    Spots (TrickId, Type)
VALUES
    (1, 'DropIn');

INSERT INTO
    Tricks (UserId, Name, Points)
VALUES
    (1, "triple whip", 400, "2024-06-14");

INSERT INTO
    Spots (TrickId, Type)
VALUES
    (2, 'Flat');

INSERT INTO
    Spots (TrickId, Type)
VALUES
    (2, 'OffLedge');

INSERT INTO
    Tricks (UserId, Name, Points)
VALUES
    (1, "bri flip", 500, "2024-08-19");

INSERT INTO
    Spots (TrickId, Type)
VALUES
    (3, 'DropIn');

INSERT INTO
    Spots (TrickId, Type)
VALUES
    (3, 'Air');
