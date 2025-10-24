-- обратный порядок удаления
DROP TRIGGER IF EXISTS trg_pages_updated ON pages;
DROP FUNCTION IF EXISTS set_updated_at();

DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS page_links;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS user_role;
-- расширение оставим (не критично для down)
