const express = require("express");
const {
  createGame,
  getGame,
  listGames,
} = require("../controllers/gamesController");

const router = express.Router();

router.post("/", createGame);
router.get("/", listGames);
router.get("/:id", getGame);

module.exports = router;
