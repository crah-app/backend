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
		IFNULL(total_c.totalComments, 0) AS totalComments,

		MAX(e.width) AS sourceWidth,
		MAX(e.height) AS sourceHeight,
		MAX(e.sourceRatio) AS sourceRatio,
		GROUP_CONCAT(DISTINCT r.EmojiId) AS Reactions,

		EXISTS(SELECT 1 FROM Likes l2 WHERE l2.PostId = p.Id AND l2.UserId = ?) AS liked,

		(
			IFNULL(l.likesCount, 0) * 1 +
			COUNT(DISTINCT c2.Id) * 2 +
			IFNULL(s.sharesCount, 0) * 3 +
			COUNT(DISTINCT r.Id) * 1
		) AS PopularityScore

		FROM 
		posts p
		JOIN Users u ON u.Id = p.UserId
		LEFT JOIN Comments c2 ON c2.PostId = p.Id
		LEFT JOIN Reactions r ON r.PostId = p.Id AND r.isDeleted = 0
		LEFT JOIN Sources e ON e.\`key\` = p.SourceKey
		LEFT JOIN (
		SELECT PostId, COUNT(*) AS likesCount FROM Likes GROUP BY PostId
		) l ON l.PostId = p.Id
		LEFT JOIN (
		SELECT PostId, COUNT(*) AS sharesCount FROM Shares GROUP BY PostId
		) s ON s.PostId = p.Id
		LEFT JOIN (
		SELECT 
			ranked.PostId,
			JSON_ARRAYAGG(
			JSON_OBJECT(
				'Id', ranked.Id,
				'UserId', ranked.UserId,
				'UserName', ranked.UserName,
				'UserAvatar', ranked.UserAvatar,
				'Message', ranked.Message,
				'CreatedAt', ranked.CreatedAt,
				'UpdatedAt', ranked.UpdatedAt,
				'likes', IFNULL(ranked.likeCount, 0),
				'liked', ranked.liked
			)
			) AS comments
		FROM (
			SELECT 
			c.*,
			u.Name AS UserName,
			u.avatar AS UserAvatar,
			IFNULL(cl.likeCount, 0) AS likeCount,
			EXISTS (
				SELECT 1 FROM CommentLikes cl2 WHERE cl2.CommentId = c.Id AND cl2.UserId = ?
			) AS liked,
			ROW_NUMBER() OVER (PARTITION BY c.PostId ORDER BY IFNULL(cl.likeCount, 0) DESC) AS rn
			FROM Comments c
			JOIN Users u ON u.Id = c.UserId
			LEFT JOIN (
			SELECT CommentId, COUNT(*) AS likeCount
			FROM CommentLikes
			GROUP BY CommentId
			) cl ON cl.CommentId = c.Id
		) ranked
		WHERE ranked.rn <= 2
		GROUP BY ranked.PostId
		) c ON c.PostId = p.Id

		LEFT JOIN (
			SELECT PostId, COUNT(*) AS totalComments
			FROM Comments
			GROUP BY PostId
		) total_c ON total_c.PostId = p.Id

		WHERE p.CreatedAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
		GROUP BY p.Id

		ORDER BY PopularityScore DESC, p.CreatedAt DESC
		LIMIT ? OFFSET ?;
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
          MAX(e.width) AS sourceWidth,
          MAX(e.height) AS sourceHeight,
          MAX(e.sourceRatio) AS sourceRatio,  
          GROUP_CONCAT(DISTINCT r.EmojiId) AS Reactions,
          EXISTS(SELECT 1 FROM Likes l WHERE l.PostId = p.Id AND l.UserId = ?) AS liked
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

        -- Join Reactions
		LEFT JOIN Reactions r ON r.PostId = p.Id AND r.isDeleted = 0
  
        WHERE p.UserId = ?
        GROUP BY p.Id
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
          MAX(e.width) AS sourceWidth,
          MAX(e.height) AS sourceHeight,
          MAX(e.sourceRatio) AS sourceRatio,
          GROUP_CONCAT(DISTINCT r.EmojiId) AS Reactions,
          EXISTS(SELECT 1 FROM Likes l WHERE l.PostId = p.Id AND l.UserId = ?) AS liked
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

        -- Join Reactions
		LEFT JOIN Reactions r ON r.PostId = p.Id AND r.isDeleted = 0
  
        WHERE p.Id = ?
        GROUP BY p.Id
        ORDER BY p.CreatedAt DESC
        LIMIT 8;
      `;
