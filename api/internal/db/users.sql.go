package db

import (
	"context"
	"time"

	"github.com/google/uuid"
)

const adminSetPassword = `-- name: AdminSetPassword :exec
UPDATE users SET pass_hash=$1 WHERE email='admin@local'
`

func (q *Queries) AdminSetPassword(ctx context.Context, passHash string) error {
	_, err := q.db.ExecContext(ctx, adminSetPassword, passHash)
	return err
}

const userByEmail = `-- name: UserByEmail :one
SELECT id, email, pass_hash, role FROM users WHERE email = $1
`

type UserByEmailRow struct {
	ID       uuid.UUID `json:"id"`
	Email    string    `json:"email"`
	PassHash string    `json:"pass_hash"`
	Role     UserRole  `json:"role"`
}

func (q *Queries) UserByEmail(ctx context.Context, email string) (UserByEmailRow, error) {
	row := q.db.QueryRowContext(ctx, userByEmail, email)
	var i UserByEmailRow
	err := row.Scan(
		&i.ID,
		&i.Email,
		&i.PassHash,
		&i.Role,
	)
	return i, err
}

const userCreate = `-- name: UserCreate :one
INSERT INTO users (email, pass_hash) VALUES ($1,$2)
RETURNING id::text
`

type UserCreateParams struct {
	Email    string `json:"email"`
	PassHash string `json:"pass_hash"`
}

func (q *Queries) UserCreate(ctx context.Context, arg UserCreateParams) (string, error) {
	row := q.db.QueryRowContext(ctx, userCreate, arg.Email, arg.PassHash)
	var id string
	err := row.Scan(&id)
	return id, err
}

const userDelete = `-- name: UserDelete :exec
DELETE FROM users WHERE id=$1::uuid
`

func (q *Queries) UserDelete(ctx context.Context, dollar_1 uuid.UUID) error {
	_, err := q.db.ExecContext(ctx, userDelete, dollar_1)
	return err
}

const usersList = `-- name: UsersList :many
SELECT id::text, email, role, jwt_revoked_at FROM users ORDER BY email
`

type UsersListRow struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	Role         UserRole  `json:"role"`
	JwtRevokedAt time.Time `json:"jwt_revoked_at"`
}

func (q *Queries) UsersList(ctx context.Context) ([]UsersListRow, error) {
	rows, err := q.db.QueryContext(ctx, usersList)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []UsersListRow
	for rows.Next() {
		var i UsersListRow
		if err := rows.Scan(
			&i.ID,
			&i.Email,
			&i.Role,
			&i.JwtRevokedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
