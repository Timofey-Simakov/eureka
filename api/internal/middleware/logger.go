package middleware

import (
	"log"
	"net/http"
	"time"
)

// ResponseWriter wrapper to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
	written    int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.written += n
	return n, err
}

// Logger middleware logs HTTP requests with timing
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap response writer to capture status
		wrapped := &responseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		// Process request
		next.ServeHTTP(wrapped, r)

		// Log after request
		duration := time.Since(start)
		log.Printf(
			"[%s] %s %s - %d (%v) %d bytes",
			r.Method,
			r.RemoteAddr,
			r.URL.Path,
			wrapped.statusCode,
			duration,
			wrapped.written,
		)
	})
}
