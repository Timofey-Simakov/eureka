-- name: PageCreate :one
INSERT INTO pages (user_id, name, body) VALUES ($1::uuid,$2,$3)
RETURNING id::text;

-- name: PagesByUser :many
SELECT id::text, name, updated_at FROM pages WHERE user_id=$1::uuid ORDER BY updated_at DESC;

-- name: PagesAll :many
SELECT p.id::text AS id, p.name, u.email AS owner_email, p.updated_at
FROM pages p JOIN users u ON u.id=p.user_id
ORDER BY p.updated_at DESC;

-- name: PageByID :one
SELECT id::text, user_id::text AS owner_id, name, body, updated_at FROM pages WHERE id=$1::uuid;

-- name: PageOwner :one
SELECT user_id::text FROM pages WHERE id=$1::uuid;

-- name: PageUpdate :exec
UPDATE pages SET name=$2, body=$3 WHERE id=$1::uuid;

-- name: PageDelete :exec
DELETE FROM pages WHERE id=$1::uuid;

-- name: PageSetOwner :exec
UPDATE pages SET user_id=$2::uuid WHERE id=$1::uuid;

-- name: PagesWithOwners :many
SELECT p.id::text AS id, p.name, u.id::text AS owner_id, u.email AS owner_email, p.updated_at
FROM pages p JOIN users u ON u.id=p.user_id
ORDER BY p.updated_at DESC;

-- name: PageByNameAndUser :one
SELECT id::text FROM pages WHERE user_id=$1::uuid AND name=$2 LIMIT 1;
