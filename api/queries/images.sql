-- name: ImageCreate :one
INSERT INTO images (page_id,name,mime,size_bytes,content)
VALUES ($1::uuid,$2,$3,$4,$5)
RETURNING id::text;

-- name: ImageByID :one
SELECT id::text, page_id::text, name, mime, size_bytes, content FROM images WHERE id=$1::uuid;
