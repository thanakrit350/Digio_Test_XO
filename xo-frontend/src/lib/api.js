import axios from "axios";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  "http://localhost:4000";

export const api = axios.create({ baseURL: API_BASE, timeout: 10000 });

const unwrap = (d) => (d && typeof d === "object"
  ? ("result" in d ? d.result : ("data" in d ? d.data : d))
  : d
);

export const createGame = (body) =>
  api.post("/games", body).then((r) => unwrap(r.data));

export const getGame = (id) =>
  api.get(`/games/${id}`).then((r) => unwrap(r.data));

export const listGames = (p = {}) =>
  api.get("/games", { params: p }).then((r) => unwrap(r.data));
