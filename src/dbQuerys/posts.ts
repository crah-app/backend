export const allPostsQuery = `
        SELECT
          p.Id,
          p.UserId,
          u.Name AS UserName,
          u.avatar AS UserAvatar,
          p.Type,
          p.Title,
          p.Description,
          p.Content,
          p.CreatedAt,
          p.UpdatedAt,
          p.SourceKey,
          IFNULL(l.likesCount, 0) AS likes,
          IFNULL(s.sharesCount, 0) AS shares,
          IFNULL(c.comments, JSON_ARRAY()) AS comments,
          e.width AS sourceWidth,
          e.height AS sourceHeight,
          e.sourceRatio
        FROM Posts p
        LEFT JOIN Users u ON u.Id = p.UserId

        LEFT JOIN Sources e ON e.\`key\` = p.SourceKey

        -- Subquery for Likes
        LEFT JOIN (
          SELECT PostId, COUNT(*) AS likesCount
          FROM Likes
          GROUP BY PostId
        ) l ON l.PostId = p.Id
  
        -- Subquery for Shares
        LEFT JOIN (
          SELECT PostId, COUNT(*) AS sharesCount
          FROM Shares
          GROUP BY PostId
        ) s ON s.PostId = p.Id
  
        -- Subquery for Comments as JSON
        LEFT JOIN (
          SELECT PostId,
                 JSON_ARRAYAGG(
                   JSON_OBJECT(
                     'Id', Id,
                     'UserId', UserId,
                     'Message', Message,
                     'CreatedAt', CreatedAt,
                     'UpdatedAt', UpdatedAt
                   )
                 ) AS comments
          FROM Comments
          GROUP BY PostId
        ) c ON c.PostId = p.Id
  
        ORDER BY p.CreatedAt DESC
        LIMIT 8;
      `;

export const allPostsQueryByUserId = `
        SELECT
          p.Id,
          p.UserId,
          u.Name AS UserName,
          u.avatar AS UserAvatar,
          p.Type,
          p.Title,
          p.Description,
          p.Content,
          p.CreatedAt,
          p.UpdatedAt,
          p.SourceKey,
          p.CoverSourceKey,
          IFNULL(l.likesCount, 0) AS likes,
          IFNULL(s.sharesCount, 0) AS shares,
          IFNULL(c.comments, JSON_ARRAY()) AS comments,
          e.width AS sourceWidth,
          e.height AS sourceHeight,
          e.sourceRatio
        FROM Posts p 
        LEFT JOIN Users u ON u.Id = p.UserId

        LEFT JOIN Sources e ON e.\`key\` = p.SourceKey

        -- Subquery for Likes
        LEFT JOIN (
          SELECT PostId, COUNT(*) AS likesCount
          FROM Likes
          GROUP BY PostId
        ) l ON l.PostId = p.Id
  
        -- Subquery for Shares
        LEFT JOIN (
          SELECT PostId, COUNT(*) AS sharesCount
          FROM Shares
          GROUP BY PostId
        ) s ON s.PostId = p.Id
  
        -- Subquery for Comments as JSON
        LEFT JOIN (
          SELECT PostId,
                 JSON_ARRAYAGG(
                   JSON_OBJECT(
                     'Id', Id,
                     'UserId', UserId,
                     'Message', Message,
                     'CreatedAt', CreatedAt,
                     'UpdatedAt', UpdatedAt
                   )
                 ) AS comments
          FROM Comments
          GROUP BY PostId
        ) c ON c.PostId = p.Id
  
        WHERE p.UserId = ?
        ORDER BY p.CreatedAt DESC
        LIMIT 8;
      `;

export const getPostByPostId = `
        SELECT
          p.Id,
          p.UserId,
          u.Name AS UserName,
          u.avatar AS UserAvatar,
          p.Type,
          p.Title,
          p.Description,
          p.Content,
          p.CreatedAt,
          p.UpdatedAt,
          p.SourceKey,
          p.CoverSourceKey,
          IFNULL(l.likesCount, 0) AS likes,
          IFNULL(s.sharesCount, 0) AS shares,
          IFNULL(c.comments, JSON_ARRAY()) AS comments,
          e.width AS sourceWidth,
          e.height AS sourceHeight,
          e.sourceRatio
        FROM Posts p 
        LEFT JOIN Users u ON u.Id = p.UserId

        LEFT JOIN Sources e ON e.\`key\` = p.SourceKey

        -- Subquery for Likes
        LEFT JOIN (
          SELECT PostId, COUNT(*) AS likesCount
          FROM Likes
          GROUP BY PostId
        ) l ON l.PostId = p.Id
  
        -- Subquery for Shares
        LEFT JOIN (
          SELECT PostId, COUNT(*) AS sharesCount
          FROM Shares
          GROUP BY PostId
        ) s ON s.PostId = p.Id
  
        -- Subquery for Comments as JSON
        LEFT JOIN (
          SELECT PostId,
                 JSON_ARRAYAGG(
                   JSON_OBJECT(
                     'Id', Id,
                     'UserId', UserId,
                     'Message', Message,
                     'CreatedAt', CreatedAt,
                     'UpdatedAt', UpdatedAt
                   )
                 ) AS comments
          FROM Comments
          GROUP BY PostId
        ) c ON c.PostId = p.Id
  
        WHERE p.Id = ?
        ORDER BY p.CreatedAt DESC
        LIMIT 8;
      `;
