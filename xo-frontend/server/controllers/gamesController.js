const { spring } = require("../services/gameService");

const createGame = async (req, res, next) => {
  try {
    const { data } = await spring.post("/games", req.body);
    res.json(data);
  } catch (e) { next(e); }
};

const getGame = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data } = await spring.get(`/games/${id}`);
    res.json(data);
  } catch (e) { next(e); }
};

const listGames = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const { data } = await 
    spring.get("/games", { params: { limit, offset } });
    res.json(data);
  } catch (e) { next(e); }
};


module.exports = {
  createGame,
  getGame,
  listGames,
};
