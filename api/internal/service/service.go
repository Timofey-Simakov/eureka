package service

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/tim/eureka/internal/auth"
	"github.com/tim/eureka/internal/db"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	Q  *db.Queries
	PG db.DBTX
}

func hash(pw string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	return string(b), err
}
func check(hash, pw string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(pw)) == nil
}

// --- AUTH ---

func (s *Service) Register(ctx context.Context, email, password string) (string, error) {
	h, err := hash(password)
	if err != nil {
		return "", err
	}
	id, err := s.Q.UserCreate(ctx, db.UserCreateParams{Email: email, PassHash: h})
	return id, err
}

func (s *Service) Login(ctx context.Context, email, password string) (string, string, error) {
	u, err := s.Q.UserByEmail(ctx, email)
	if err != nil {
		return "", "", err
	}
	if !check(u.PassHash, password) {
		return "", "", sql.ErrNoRows
	}
	return u.ID.String(), string(u.Role), nil
}

// --- JSON helpers ---

func bind(w http.ResponseWriter, r *http.Request, v any) bool {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		http.Error(w, "bad json", 400)
		return false
	}
	return true
}
func writeJSON(w http.ResponseWriter, v any) { writeJSONCode(w, 200, v) }
func writeJSONCode(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

// --- PAGES ---

func (s *Service) ListPages(w http.ResponseWriter, r *http.Request) {
	uid := r.Context().Value(auth.CtxUserID).(string)
	role, _ := r.Context().Value(auth.CtxRole).(string)

	owner := uid
	if role == "adm" {
		if q := r.URL.Query().Get("owner"); q != "" {
			owner = q
		} else {
			owner = "" // показать все
		}
	}

	if owner == "" {
		rows, err := s.Q.PagesAll(r.Context())
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		writeJSON(w, rows)
		return
	}

	ownerUUID, err := uuid.Parse(owner)
	if err != nil {
		http.Error(w, "bad owner uuid", 400)
		return
	}
	rows, err := s.Q.PagesByUser(r.Context(), ownerUUID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	writeJSON(w, rows)
}

func (s *Service) CreatePage(w http.ResponseWriter, r *http.Request) {
	uidStr := r.Context().Value(auth.CtxUserID).(string)
	userID, err := uuid.Parse(uidStr)
	if err != nil {
		http.Error(w, "bad uid", 400)
		return
	}
	var req struct {
		Name string
		Body string
	}
	if !bind(w, r, &req) {
		return
	}
	id, err := s.Q.PageCreate(r.Context(), db.PageCreateParams{
		Column1: userID, // user_id
		Name:    req.Name,
		Body:    req.Body,
	})
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	writeJSONCode(w, 201, map[string]string{"id": id})
}

func (s *Service) GetPage(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	pid, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	row, err := s.Q.PageByID(r.Context(), pid)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	writeJSON(w, row)
}

// parseWikiLinks extracts all [[Page Name]] style links from text
func parseWikiLinks(text string) []string {
	var links []string
	// Simple regex to find [[...]]
	start := 0
	for {
		idx1 := strings.Index(text[start:], "[[")
		if idx1 == -1 {
			break
		}
		idx1 += start
		idx2 := strings.Index(text[idx1+2:], "]]")
		if idx2 == -1 {
			break
		}
		idx2 += idx1 + 2
		linkText := text[idx1+2 : idx2]
		linkText = strings.TrimSpace(linkText)
		if linkText != "" {
			links = append(links, linkText)
		}
		start = idx2 + 2
	}
	return links
}

// syncPageLinks updates page links based on [[wiki]] references in body
func (s *Service) syncPageLinks(ctx context.Context, pageID uuid.UUID, userID uuid.UUID, body string) error {
	// Parse wiki links
	wikiLinks := parseWikiLinks(body)

	// Delete existing links
	if err := s.Q.LinksDeleteBySource(ctx, pageID); err != nil {
		return err
	}

	// Create new links
	for _, linkName := range wikiLinks {
		// Find page by name
		destID, err := s.Q.PageByNameAndUser(ctx, db.PageByNameAndUserParams{
			Column1: userID,
			Name:    linkName,
		})
		if err != nil {
			// Page doesn't exist, skip
			continue
		}

		destUUID, err := uuid.Parse(destID)
		if err != nil {
			continue
		}

		// Create link
		_, _ = s.Q.LinkCreate(ctx, db.LinkCreateParams{
			Column1: pageID,
			Column2: destUUID,
			Column3: nil,
		})
	}

	return nil
}

func (s *Service) UpdatePage(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	pid, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	var req struct {
		Name string
		Body string
	}
	if !bind(w, r, &req) {
		return
	}
	uid := r.Context().Value(auth.CtxUserID).(string)
	role, _ := r.Context().Value(auth.CtxRole).(string)
	owner, err := s.Q.PageOwner(r.Context(), pid)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	if role != "adm" && owner != uid {
		http.Error(w, "forbidden", 403)
		return
	}
	if err := s.Q.PageUpdate(r.Context(), db.PageUpdateParams{
		Column1: pid,
		Name:    req.Name,
		Body:    req.Body,
	}); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	// Sync wiki links
	userUUID, _ := uuid.Parse(uid)
	_ = s.syncPageLinks(r.Context(), pid, userUUID, req.Body)

	writeJSON(w, map[string]string{"ok": "1"})
}

func (s *Service) DeletePage(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	pid, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	uid := r.Context().Value(auth.CtxUserID).(string)
	role, _ := r.Context().Value(auth.CtxRole).(string)
	owner, err := s.Q.PageOwner(r.Context(), pid)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	if role != "adm" && owner != uid {
		http.Error(w, "forbidden", 403)
		return
	}
	if err := s.Q.PageDelete(r.Context(), pid); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	writeJSON(w, map[string]string{"ok": "1"})
}

func (s *Service) ChangeOwner(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	pid, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	var req struct {
		UserID string
	}
	if !bind(w, r, &req) {
		return
	}
	newOwner, err := uuid.Parse(req.UserID)
	if err != nil {
		http.Error(w, "bad user_id", 400)
		return
	}
	if err := s.Q.PageSetOwner(r.Context(), db.PageSetOwnerParams{
		Column1: pid,
		Column2: newOwner,
	}); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	writeJSON(w, map[string]string{"ok": "1"})
}

// --- LINKS ---

func (s *Service) ListLinks(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	src, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	rows, err := s.Q.LinksBySource(r.Context(), src)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	writeJSON(w, rows)
}

func (s *Service) AddLink(w http.ResponseWriter, r *http.Request) {
	srcStr := chi.URLParam(r, "id")
	src, err := uuid.Parse(srcStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	var req struct {
		IDDest string
		Tag    string
	}
	if !bind(w, r, &req) {
		return
	}
	dest, err := uuid.Parse(req.IDDest)
	if err != nil {
		http.Error(w, "bad id_dest", 400)
		return
	}
	var tag any = req.Tag
	if strings.TrimSpace(req.Tag) == "" {
		tag = nil
	}
	id, err := s.Q.LinkCreate(r.Context(), db.LinkCreateParams{
		Column1: src,
		Column2: dest,
		Column3: tag,
	})
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	writeJSONCode(w, 201, map[string]string{"id": id})
}

func (s *Service) DelLink(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	lid, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	if err := s.Q.LinkDelete(r.Context(), lid); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	writeJSON(w, map[string]string{"ok": "1"})
}

// --- IMAGES ---

const maxImage = 5 << 20 // 5 MB
var allowed = map[string]bool{
	"image/png":  true,
	"image/jpeg": true,
	"image/gif":  true,
	"image/webp": true,
}

func (s *Service) UploadImage(w http.ResponseWriter, r *http.Request) {
	pageIDStr := chi.URLParam(r, "id")
	pageID, err := uuid.Parse(pageIDStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	if err := r.ParseMultipartForm(maxImage + 1024); err != nil {
		http.Error(w, "multipart", 400)
		return
	}
	f, hdr, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "no file", 400)
		return
	}
	defer f.Close()
	mime := hdr.Header.Get("Content-Type")
	if !allowed[strings.ToLower(mime)] {
		http.Error(w, "mime", 400)
		return
	}
	var buf bytes.Buffer
	if _, err := io.CopyN(&buf, f, maxImage+1); err != nil && err != io.EOF {
		http.Error(w, "read", 400)
		return
	}
	if buf.Len() > maxImage {
		http.Error(w, "too large", 413)
		return
	}
	id, err := s.Q.ImageCreate(r.Context(), db.ImageCreateParams{
		Column1:   pageID, // page_id
		Name:      hdr.Filename,
		Mime:      mime,
		SizeBytes: int32(buf.Len()),
		Content:   buf.Bytes(),
	})
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	writeJSONCode(w, 201, map[string]string{"id": id})
}

func (s *Service) GetImage(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	imgID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	img, err := s.Q.ImageByID(r.Context(), imgID)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	w.Header().Set("Content-Type", img.Mime)
	w.Header().Set("Content-Length", strconv.Itoa(int(img.SizeBytes)))
	_, _ = w.Write(img.Content)
}

func (s *Service) ListImages(w http.ResponseWriter, r *http.Request) {
	pageIDStr := chi.URLParam(r, "id")
	pageID, err := uuid.Parse(pageIDStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	images, err := s.Q.ImagesByPage(r.Context(), pageID)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	writeJSON(w, images)
}

// --- GRAPH & ADMIN ---

func (s *Service) UserGraph(w http.ResponseWriter, r *http.Request) {
	uidStr := r.Context().Value(auth.CtxUserID).(string)
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		http.Error(w, "bad uid", 400)
		return
	}
	rows, err := s.Q.GraphByUser(r.Context(), uid)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	writeJSON(w, rows)
}

func (s *Service) AdminPages(w http.ResponseWriter, r *http.Request) {
	rows, err := s.Q.PagesWithOwners(r.Context())
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	writeJSON(w, rows)
}

func (s *Service) AdminUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := s.Q.UsersList(r.Context())
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	writeJSON(w, rows)
}

func (s *Service) AdminDeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	uid, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	if err := s.Q.UserDelete(r.Context(), uid); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	writeJSON(w, map[string]string{"ok": "1"})
}

func (s *Service) AdminDeletePage(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	pid, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "bad id", 400)
		return
	}
	if err := s.Q.PageDelete(r.Context(), pid); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	writeJSON(w, map[string]string{"ok": "1"})
}
