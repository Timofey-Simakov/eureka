-- name: LinksBySource :many
SELECT id::text, id_source::text, id_dest::text, tag FROM page_links WHERE id_source=$1::uuid;

-- name: LinkCreate :one
INSERT INTO page_links (id_source,id_dest,tag) VALUES ($1::uuid,$2::uuid, NULLIF($3,''))
RETURNING id::text;

-- name: LinkDelete :exec
DELETE FROM page_links WHERE id=$1::uuid;

-- name: LinksDeleteBySource :exec
DELETE FROM page_links WHERE id_source=$1::uuid;

-- name: GraphByUser :many
WITH mypages AS (
  SELECT id FROM pages WHERE user_id=$1::uuid
)
SELECT
  p.id::text   AS node_id,
  p.name       AS node_name,
  COALESCE(l.id_source::text, '') AS edge_from,
  COALESCE(l.id_dest::text, '')   AS edge_to,
  l.tag
FROM pages p
LEFT JOIN page_links l ON l.id_source=p.id OR l.id_dest=p.id
WHERE p.user_id=$1::uuid;
