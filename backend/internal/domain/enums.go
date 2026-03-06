package domain

type RoomStatus string
type ClientRole string
type ClientState string

const (
	RoomWaiting    RoomStatus = "waiting"
	RoomInProgress RoomStatus = "in_progress"
	RoomCompleted  RoomStatus = "completed"
	RoomClosed     RoomStatus = "closed"
)

const (
	RolePlayer    ClientRole = "player"
	RoleSpectator ClientRole = "spectator"
)

const (
	StateConnected    ClientState = "connected"
	StateDisconnected ClientState = "disconnected"
)
