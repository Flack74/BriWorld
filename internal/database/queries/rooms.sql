-- name: CreateRoom :one
INSERT INTO rooms (room_code, room_name, room_type, game_mode, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetRoomByCode :one
SELECT * FROM rooms
WHERE room_code = $1 LIMIT 1;

-- name: ListActiveRooms :many
SELECT * FROM rooms
WHERE is_active = true
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateRoomPlayers :exec
UPDATE rooms
SET current_players = $2
WHERE id = $1;
