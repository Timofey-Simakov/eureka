package errors

import (
	"encoding/json"
	"net/http"
)

type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"-"`
}

func (e *AppError) Error() string {
	return e.Message
}

var (
	ErrBadRequest   = &AppError{Code: "bad_request", Message: "Invalid request", Status: http.StatusBadRequest}
	ErrUnauthorized = &AppError{Code: "unauthorized", Message: "Unauthorized", Status: http.StatusUnauthorized}
	ErrForbidden    = &AppError{Code: "forbidden", Message: "Forbidden", Status: http.StatusForbidden}
	ErrNotFound     = &AppError{Code: "not_found", Message: "Resource not found", Status: http.StatusNotFound}
	ErrConflict     = &AppError{Code: "conflict", Message: "Resource already exists", Status: http.StatusConflict}
	ErrInternal     = &AppError{Code: "internal_error", Message: "Internal server error", Status: http.StatusInternalServerError}
	ErrInvalidUUID  = &AppError{Code: "invalid_uuid", Message: "Invalid UUID format", Status: http.StatusBadRequest}
	ErrInvalidJSON  = &AppError{Code: "invalid_json", Message: "Invalid JSON body", Status: http.StatusBadRequest}
	ErrFileTooLarge = &AppError{Code: "file_too_large", Message: "File size exceeds limit", Status: http.StatusRequestEntityTooLarge}
	ErrInvalidMime  = &AppError{Code: "invalid_mime", Message: "Invalid file type", Status: http.StatusBadRequest}
)

func New(code, message string, status int) *AppError {
	return &AppError{Code: code, Message: message, Status: status}
}

func (e *AppError) WithMessage(msg string) *AppError {
	return &AppError{
		Code:    e.Code,
		Message: msg,
		Status:  e.Status,
	}
}

func WriteError(w http.ResponseWriter, err error) {
	appErr, ok := err.(*AppError)
	if !ok {
		appErr = ErrInternal
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(appErr.Status)
	json.NewEncoder(w).Encode(appErr)
}
