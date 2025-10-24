up:
	cp .env deploy/.env 2>/dev/null || true
	cd deploy && docker compose up -d --build
down:
	cd deploy && docker compose down
down-volumes:
	cd deploy && docker compose down -v
logs:
	cd deploy && docker compose logs -f api
