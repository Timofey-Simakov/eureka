package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/tim/eureka/internal/db"
	httpx "github.com/tim/eureka/internal/http"
	"github.com/tim/eureka/internal/service"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	addr := env("API_ADDR", ":8080")
	dsn := mustEnv("DATABASE_URL")
	sec := mustEnv("JWT_SECRET")
	adminPw := mustEnv("ADMIN_PASSWORD")

	// stdlib driver for pgx → *sql.DB implements db.DBTX
	sqlDB, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer sqlDB.Close()
	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	if err := sqlDB.Ping(); err != nil {
		log.Fatal(err)
	}

	q := db.New(sqlDB)

	// init admin password each start
	hash, _ := bcrypt.GenerateFromPassword([]byte(adminPw), bcrypt.DefaultCost)
	if err := q.AdminSetPassword(context.Background(), string(hash)); err != nil {
		log.Printf("admin password set: %v", err)
	}

	svc := &service.Service{Q: q, PG: sqlDB}
	router := httpx.Router(svc, sec)

	srv := &http.Server{Addr: addr, Handler: router}
	go func() {
		log.Printf("api %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("%s empty", k)
	}
	return v
}
