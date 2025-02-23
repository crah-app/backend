CREATE DATABASE crah;
USE crah;

CREATE TABLE Users (
	Id INT AUTO_INCREMENT NOT NULL,
	Name VARCHAR(25) NOT NULL,
	PRIMARY KEY(Id)
);

CREATE TABLE Tricks (
	Id INT AUTO_INCREMENT NOT NULL,
	UserId INT NOT NULL,
	Name VARCHAR(255) NOT NULL,
	Points INT NOT NULL,
	Date DATE NULL,
	PRIMARY KEY(Id),
	FOREIGN KEY(UserId) REFERENCES Users(Id)
);

CREATE TABLE Spots (
	Id INT AUTO_INCREMENT NOT NULL,
	TrickId INT NOT NULL,
	Spot enum('Flat', 'OffLedge', 'DropIn', 'Flyout', 'Air') NOT NULL,
	PRIMARY KEY(Id),
	FOREIGN KEY(TrickId) REFERENCES Tricks(Id)
);

SELECT Tricks.Name, Tricks.Points, Tricks.Date, Spots.Name FROM Tricks INNER JOIN Spots ON Tricks.Id = Spots.TrickId AND Tricks.UserId=1;

INSERT INTO Users(Name) VALUES ("Josef");
INSERT INTO Tricks(UserId, Name, Points) VALUES (1, "double whip", 150);
INSERT INTO Spots(TrickId, Type) VALUES (1, 'Flat');

'/usr/bin/mysql_secure_installation'
