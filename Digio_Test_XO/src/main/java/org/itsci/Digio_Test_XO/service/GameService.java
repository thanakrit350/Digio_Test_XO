package org.itsci.Digio_Test_XO.service;


import lombok.RequiredArgsConstructor;
import org.itsci.Digio_Test_XO.model.Game;
import org.itsci.Digio_Test_XO.repository.GamesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GameService {

    @Autowired
    private GamesRepository gamesRepository;

    public List<Game> getAllGames() {
        return gamesRepository.findAll();
    }

    public Game saveGame(Game game) {
        return gamesRepository.save(game);
    }

    public Game findGameByID(int gameId) {
        return gamesRepository.findByGameId(gameId);
    }
}
