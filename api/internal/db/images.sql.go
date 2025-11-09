package db

import (
	"context"
	"time"

	"github.com/google/uuid"
)

const imageByID = `-- name: ImageByID :one
SELECT id::text, page_id::text, name, mime, size_bytes, content FROM images WHERE id=$1::uuid
`

type ImageByIDRow struct {
	ID        string `json:"id"`
	PageID    string `json:"page_id"`
	Name      string `json:"name"`
	Mime      string `json:"mime"`
	SizeBytes int32  `json:"size_bytes"`
	Content   []byte `json:"content"`
}

func (q *Queries) ImageByID(ctx context.Context, dollar_1 uuid.UUID) (ImageByIDRow, error) {
	row := q.db.QueryRowContext(ctx, imageByID, dollar_1)
	var i ImageByIDRow
	err := row.Scan(
		&i.ID,
		&i.PageID,
		&i.Name,
		&i.Mime,
		&i.SizeBytes,
		&i.Content,
	)
	return i, err
}

const imageCreate = `-- name: ImageCreate :one
INSERT INTO images (page_id,name,mime,size_bytes,content)
VALUES ($1::uuid,$2,$3,$4,$5)
RETURNING id::text
`

type ImageCreateParams struct {
	Column1   uuid.UUID `json:"column_1"`
	Name      string    `json:"name"`
	Mime      string    `json:"mime"`
	SizeBytes int32     `json:"size_bytes"`
	Content   []byte    `json:"content"`
}

func (q *Queries) ImageCreate(ctx context.Context, arg ImageCreateParams) (string, error) {
	row := q.db.QueryRowContext(ctx, imageCreate,
		arg.Column1,
		arg.Name,
		arg.Mime,
		arg.SizeBytes,
		arg.Content,
	)
	var id string
	err := row.Scan(&id)
	return id, err
}

const imagesByPage = `-- name: ImagesByPage :many
SELECT id::text, name, mime, size_bytes, created_at FROM images WHERE page_id=$1::uuid ORDER BY created_at DESC
`

type ImagesByPageRow struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Mime      string    `json:"mime"`
	SizeBytes int32     `json:"size_bytes"`
	CreatedAt time.Time `json:"created_at"`
}

func (q *Queries) ImagesByPage(ctx context.Context, dollar_1 uuid.UUID) ([]ImagesByPageRow, error) {
	rows, err := q.db.QueryContext(ctx, imagesByPage, dollar_1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ImagesByPageRow
	for rows.Next() {
		var i ImagesByPageRow
		if err := rows.Scan(
			&i.ID,
			&i.Name,
			&i.Mime,
			&i.SizeBytes,
			&i.CreatedAt,
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
