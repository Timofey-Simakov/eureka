-- name: UserCreate :one
INSERT INTO users (email, pass_hash) VALUES ($1,$2)
RETURNING id::text;

-- name: UserByEmail :one
SELECT id, email, pass_hash, role FROM users WHERE email = $1;

-- name: AdminSetPassword :exec
UPDATE users SET pass_hash=$1 WHERE email='admin@local';

-- name: UsersList :many
SELECT id::text, email, role, jwt_revoked_at FROM users ORDER BY email;

-- name: UserDelete :exec
DELETE FROM users WHERE id=$1::uuid;
