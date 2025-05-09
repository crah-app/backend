import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import mysql from "mysql2/promise";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || "",
    secretAccessKey: process.env.R2_SECRET_KEY || "",
  }
});

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

export async function generatePresignedUrl(userId: string, filename: string, contentType: string) {
  const videoId = uuidv4();
  const key = `${userId}/${videoId}/${filename}`;

  await pool.execute(
    "INSERT INTO videos (id, userId, key, status) VALUES (?, ?, ?, 'pending')",
    [videoId, userId, key]
  );

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return { url, videoId, key };
}

export async function markVideoUploaded(videoId: string) {
  await pool.execute("UPDATE videos SET status = 'uploaded' WHERE id = ?", [videoId]);
}
