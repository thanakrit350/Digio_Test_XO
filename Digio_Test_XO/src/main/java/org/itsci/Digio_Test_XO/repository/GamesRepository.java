package org.itsci.Digio_Test_XO.repository;

import org.itsci.Digio_Test_XO.model.Game;
import org.springframework.data.jpa.repository.JpaRepository;


public interface GamesRepository extends JpaRepository<Game, Integer> {
    Game findByGameId(int gameId);
}
