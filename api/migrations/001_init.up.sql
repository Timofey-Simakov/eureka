CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('user','adm');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  jwt_revoked_at TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01'
);

CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON pages(user_id);

CREATE TABLE page_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_source UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  id_dest   UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tag TEXT,
  CONSTRAINT uniq_link UNIQUE (id_source,id_dest)
);
CREATE INDEX ON page_links(id_source);
CREATE INDEX ON page_links(id_dest);

-- Изображения в БД
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes INT NOT NULL CHECK (size_bytes >= 0),
  content BYTEA NOT NULL,                 -- тело файла
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at триггер
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_pages_updated BEFORE UPDATE ON pages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Начальный админ (пароль зададим через ENV на приложении)
INSERT INTO users (id,email,pass_hash,role)
VALUES (uuid_generate_v4(),'admin@local','__TO_BE_SET__','adm');
