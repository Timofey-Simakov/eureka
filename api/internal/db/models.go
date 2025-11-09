package db

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	UserRoleUser UserRole = "user"
	UserRoleAdm  UserRole = "adm"
)

func (e *UserRole) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = UserRole(s)
	case string:
		*e = UserRole(s)
	default:
		return fmt.Errorf("unsupported scan type for UserRole: %T", src)
	}
	return nil
}

type NullUserRole struct {
	UserRole UserRole `json:"user_role"`
	Valid    bool     `json:"valid"` // Valid is true if UserRole is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullUserRole) Scan(value interface{}) error {
	if value == nil {
		ns.UserRole, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.UserRole.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullUserRole) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.UserRole), nil
}

type Image struct {
	ID        uuid.UUID `json:"id"`
	PageID    uuid.UUID `json:"page_id"`
	Name      string    `json:"name"`
	Mime      string    `json:"mime"`
	SizeBytes int32     `json:"size_bytes"`
	Content   []byte    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type Page struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Name      string    `json:"name"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PageLink struct {
	ID       uuid.UUID      `json:"id"`
	IDSource uuid.UUID      `json:"id_source"`
	IDDest   uuid.UUID      `json:"id_dest"`
	Tag      sql.NullString `json:"tag"`
}

type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PassHash     string    `json:"pass_hash"`
	Role         UserRole  `json:"role"`
	JwtRevokedAt time.Time `json:"jwt_revoked_at"`
}
