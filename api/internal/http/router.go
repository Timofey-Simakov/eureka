package httpx

import (
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/tim/eureka/internal/auth"
	"github.com/tim/eureka/internal/middleware"
	"github.com/tim/eureka/internal/service"
)

func Router(svc *service.Service, jwtSecret string) http.Handler {
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Recovery)
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "X-Request-ID"},
		AllowCredentials: false,
		ExposedHeaders:   []string{"X-Request-ID"},
	}))

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) { w.Write([]byte("ok")) })

	// public image access (no auth required for <img> tags)
	r.Get("/api/images/{id}", svc.GetImage)

	// auth
	r.Post("/api/auth/register", func(w http.ResponseWriter, r *http.Request) {
		var req struct{ Email, Password string }
		if !Bind(w, r, &req) {
			return
		}
		u, err := svc.Register(r.Context(), req.Email, req.Password)
		if err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		JSON(w, 201, map[string]string{"id": u})
	})

	r.Post("/api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		var req struct{ Email, Password string }
		if !Bind(w, r, &req) {
			return
		}
		uid, role, err := svc.Login(r.Context(), req.Email, req.Password)
		if err != nil {
			http.Error(w, "unauthorized", 401)
			return
		}
		tok, _ := auth.MakeToken(jwtSecret, uid, role, 24*time.Hour)
		JSON(w, 200, map[string]string{"accessToken": tok})
	})

	// protected
	ap := chi.NewRouter()
	ap.Use(auth.AuthMiddleware(jwtSecret))

	// pages
	ap.Get("/api/pages", svc.ListPages)
	ap.Post("/api/pages", svc.CreatePage)
	ap.Get("/api/pages/{id}", svc.GetPage)
	ap.Put("/api/pages/{id}", svc.UpdatePage)
	ap.Delete("/api/pages/{id}", svc.DeletePage)

	// owner change (support both admin-style and legacy)
	ap.With(auth.RequireRole("adm")).Patch("/api/pages/{id}/owner", svc.ChangeOwner)      // legacy
	ap.With(auth.RequireRole("adm")).Post("/api/admin/pages/{id}/owner", svc.ChangeOwner) // admin

	// links
	ap.Get("/api/pages/{id}/links", svc.ListLinks)
	ap.Post("/api/pages/{id}/links", svc.AddLink)
	ap.Delete("/api/links/{id}", svc.DelLink)

	// images
	ap.Get("/api/pages/{id}/images", svc.ListImages)
	ap.Post("/api/pages/{id}/images", svc.UploadImage)

	// graph
	ap.Get("/api/graph", svc.UserGraph)

	// admin
	ap.With(auth.RequireRole("adm")).Get("/api/admin/pages", svc.AdminPages)
	ap.With(auth.RequireRole("adm")).Get("/api/admin/users", svc.AdminUsers)
	ap.With(auth.RequireRole("adm")).Delete("/api/admin/users/{id}", svc.AdminDeleteUser)
	ap.With(auth.RequireRole("adm")).Delete("/api/admin/pages/{id}", svc.AdminDeletePage)

	r.Mount("/", ap)
	_ = os.Setenv("TZ", "UTC")
	return r
}
