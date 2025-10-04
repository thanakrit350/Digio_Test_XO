package org.itsci.Digio_Test_XO.controller;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.itsci.Digio_Test_XO.model.Game;
import org.itsci.Digio_Test_XO.model.History;
import org.itsci.Digio_Test_XO.model.Position;
import org.itsci.Digio_Test_XO.model.ResponseObj;
import org.itsci.Digio_Test_XO.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/games")
@RequiredArgsConstructor
@CrossOrigin
public class GameController {

    @Autowired
    private GameService gameService;

    @GetMapping
    public ResponseObj getAllGames() {
        List<Game> games = gameService.getAllGames();
        return new ResponseObj(200,games);
    }

    @PostMapping
    public ResponseObj createGame(@RequestBody Map<String, Object> map){
        int tableSize  = Integer.parseInt(map.get("tableSize").toString());
        int winNum     = Integer.parseInt(map.get("winNum").toString());
        String gameStatus = (String) map.get("gameStatus");
        String playerX = (String) map.get("playerX");
        String playerO = (String) map.get("playerO");
        String endResult = (String) map.get("endResult");
        String winText   = (String) map.get("winText");
        String botLevel  = (String) map.get("botLevel");
        String firstTurn = (String) map.get("firstTurn");

        Calendar playDate = null;
        if (map.get("playDate") != null) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                playDate = Calendar.getInstance();
                playDate.setTime(sdf.parse(map.get("playDate").toString()));
            } catch (Exception e) {
                return new ResponseObj(404, "เกิดข้อผิดพลาดทางการแปลงข้อมูลวันที่เริ่มเล่น");
            }
        }

        List<Position> positions = new ArrayList<>();
        Object rawPositions = map.get("positions");
        if (rawPositions instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?,?> posMap) {
                    Position p = new Position();
                    Object r = posMap.get("row");
                    Object c = posMap.get("col");             // frontend ควรส่ง key = col
                    if (r != null) p.setRow((r instanceof Integer n) ? n : Integer.parseInt(r.toString()));
                    if (c != null) p.setColumn((c instanceof Integer n) ? n : Integer.parseInt(c.toString()));
                    positions.add(p);
                }
            }
        }

        List<History> histories = new ArrayList<>();
        Object rawHistories = map.get("histories");
        if (rawHistories instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?,?> hmap) {
                    History h = new History();
                    Object tn = hmap.get("turnNum");
                    Object r  = hmap.get("row");
                    Object c  = hmap.get("col");
                    Object t  = hmap.get("text");
                    if (tn != null) h.setTurnNum((tn instanceof Integer n) ? n : Integer.parseInt(tn.toString()));
                    if (r  != null) h.setRow((r instanceof Integer n) ? n : Integer.parseInt(r.toString()));
                    if (c  != null) h.setColumn((c instanceof Integer n) ? n : Integer.parseInt(c.toString()));
                    if (t  != null) h.setText(t.toString());

                    histories.add(h);
                }
            }
        }

        Game game = new Game();
        game.setTableSize(tableSize);
        game.setWinNum(winNum);
        game.setGameStatus(gameStatus);
        game.setPlayerX(playerX);
        game.setPlayerO(playerO);
        game.setEndResult(endResult);
        game.setWinText(winText);
        game.setBotLevel(botLevel);
        if (firstTurn != null) game.setFirstTurn(firstTurn);
        if (playDate  != null) game.setPlayDate(playDate);
        game.setPositions(positions);
        game.setHistories(histories);

        Game saveG = gameService.saveGame(game);
        return new ResponseObj(200, saveG);
    }

    @GetMapping("/{gameId}")
    public ResponseObj getGameByID(@PathVariable Integer gameId){
        Game game = gameService.findGameByID(gameId);
        return new ResponseObj(200,game);
    }

}
