// select all users from current rank and 10 from the rank above
export const selectAllUsersFromThisRankAndFewFromAbove = `
(
  SELECT 
  u.*,
      ROW_NUMBER() OVER (
      PARTITION BY u.\`rank\`
      ORDER BY u.rankPoints DESC
    ) AS rankIndex,
  bestTrick.Id AS TrickId,   
  bestTrick.Name AS TrickName,
  bestTrick.Points AS TrickPoints,
  bestTrick.Difficulty AS TrickDifficulty,
  bestTrick.Spot AS TrickSpot,
  bestTrick.Date AS TrickDate
  FROM Users u
  LEFT JOIN (
    SELECT 
      t.Id,
      t.UserId,
      t.Name,
      gs.Points,
      gs.Difficulty,
      gs.Spot,
      gs.Date
    FROM Tricks t
    JOIN GeneralSpots gs ON t.Id = gs.TrickId
    JOIN (
      SELECT t.UserId, MAX(gs.Points) AS MaxPoints
      FROM Tricks t
      JOIN GeneralSpots gs ON t.Id = gs.TrickId
      GROUP BY t.UserId
    ) best ON best.UserId = t.UserId AND best.MaxPoints = gs.Points
  ) bestTrick ON u.Id = bestTrick.UserId
  WHERE u.\`rank\` = ?
)
UNION ALL
(
  SELECT 
  u.*,
        ROW_NUMBER() OVER (
      PARTITION BY u.\`rank\`
      ORDER BY u.rankPoints DESC
    ) AS rankIndex,
  bestTrick.Id AS TrickId,   
  bestTrick.Name AS TrickName,
  bestTrick.Points AS TrickPoints,
  bestTrick.Difficulty AS TrickDifficulty,
  bestTrick.Spot AS TrickSpot,
  bestTrick.Date AS TrickDate
  FROM Users u
  LEFT JOIN (
    SELECT 
      t.Id,
      t.UserId,
      t.Name,
      gs.Points,
      gs.Difficulty,
      gs.Spot,
      gs.Date
    FROM Tricks t
    JOIN GeneralSpots gs ON t.Id = gs.TrickId
    JOIN (
      SELECT t.UserId, MAX(gs.Points) AS MaxPoints
      FROM Tricks t
      JOIN GeneralSpots gs ON t.Id = gs.TrickId
      GROUP BY t.UserId
    ) best ON best.UserId = t.UserId AND best.MaxPoints = gs.Points
  ) bestTrick ON u.Id = bestTrick.UserId
  WHERE u.\`rank\` = ?
  LIMIT 10
)
		`;
