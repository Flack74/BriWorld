import ws from "k6/ws";
import { check, sleep } from "k6";
import { Counter, Rate, Trend, Gauge } from "k6/metrics";

const wsConnections = new Counter("ws_connections_total");
const wsErrors = new Counter("ws_errors_total");
const wsSuccessRate = new Rate("ws_success_rate");
const connectionDuration = new Trend("ws_connection_duration_ms");
const roundTripLatency = new Trend("ws_round_trip_latency_ms");
const gameStartLatency = new Trend("ws_game_start_latency_ms");
const activeRooms = new Gauge("ws_active_rooms");

export const options = {
  scenarios: {
    normal_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 20 },
        { duration: "30s", target: 50 },
        { duration: "60s", target: 50 }, // hold longer so sessions complete
        { duration: "15s", target: 0 },
      ],
      gracefulRampDown: "15s",
      tags: { scenario: "normal" },
    },
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "5s", target: 0 },
        { duration: "5s", target: 100 }, // spike to 100
        { duration: "30s", target: 100 }, // hold longer
        { duration: "5s", target: 0 },
      ],
      gracefulRampDown: "10s",
      startTime: "60s",
      tags: { scenario: "spike" },
    },
  },
  thresholds: {
    ws_success_rate: ["rate>0.95"],
    ws_connection_duration_ms: ["p(95)<500", "p(99)<1000"],
    ws_round_trip_latency_ms: ["p(95)<200", "p(99)<500"],
    ws_game_start_latency_ms: ["p(95)<16000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "ws://localhost:8080/ws";
const ORIGIN = __ENV.ORIGIN || "http://localhost:5173";
const GAME_MODES = [
  "FLAG",
  "CAPITAL_RUSH",
  "SILHOUETTE",
  "EMOJI",
  "BORDER_LOGIC",
];

export default function () {
  const username = `user_${__VU}_${__ITER}`;
  const roomIndex = (__VU % 25) + 1;
  const roomCode = `RM${String(roomIndex).padStart(3, "0")}`;
  const gameMode = GAME_MODES[__VU % GAME_MODES.length];
  const sessionId = generateSessionId();

  activeRooms.add(roomIndex);

  const url = `${BASE_URL}?room=${roomCode}&username=${username}&session=${sessionId}&mode=${gameMode}&type=PUBLIC&rounds=3&timeout=10`;

  const connectStart = Date.now();
  let gameStarted = false;
  let joinedRoom = false;
  let lastSendTime = 0;

  const res = ws.connect(
    url,
    {
      headers: { Origin: ORIGIN },
      tags: { room: roomCode, mode: gameMode },
    },
    function (socket) {
      wsConnections.add(1);
      connectionDuration.add(Date.now() - connectStart);

      socket.on("open", () => {
        wsSuccessRate.add(1);
      });

      socket.on("message", (data) => {
        let msg;
        try {
          msg = JSON.parse(data);
        } catch (_) {
          wsErrors.add(1);
          return;
        }

        if (!joinedRoom && msg.type === "room_joined") {
          joinedRoom = true;
          socket.send(JSON.stringify({ type: "start_game" }));
        }

        if (!gameStarted && msg.type === "game_started") {
          gameStarted = true;
          gameStartLatency.add(Date.now() - connectStart);
        }

        if (msg.type === "round_started") {
          socket.setTimeout(() => {
            lastSendTime = Date.now();
            socket.send(
              JSON.stringify({
                type: "submit_answer",
                payload: { answer: "France", response_time_ms: 2000 },
              }),
            );
          }, 1500);
        }

        if (
          lastSendTime > 0 &&
          (msg.type === "answer_result" || msg.type === "score_update")
        ) {
          roundTripLatency.add(Date.now() - lastSendTime);
          lastSendTime = 0;
        }

        check(msg, {
          "message has type": (m) => m.type !== undefined,
          "message has payload": (m) =>
            m.payload !== undefined || m.type === "room_update",
        });
      });

      socket.on("error", (e) => {
        wsErrors.add(1);
        wsSuccessRate.add(0);
      });

      sleep(15); // full game session
    },
  );

  check(res, {
    "HTTP 101 Switching Protocols": (r) => r && r.status === 101,
  });

  sleep(1);
}

function generateSessionId() {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}
