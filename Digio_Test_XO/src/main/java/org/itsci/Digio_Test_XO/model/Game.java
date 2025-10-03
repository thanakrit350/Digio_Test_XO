package org.itsci.Digio_Test_XO.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

@Entity
@Table(name = "games")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Game {
    @Id
    @GeneratedValue
    private int gameId;

    @Column(name = "table_size", nullable = false)
    private int tableSize;

    @Column(name = "win_num", nullable = false)
    private int winNum;

    @Column(name = "game_status", length = 50, nullable = false)
    private String gameStatus;

    @Column(name = "player_x", length = 100, nullable = false)
    private String playerX;

    @Column(name = "player_o", length = 100, nullable = false)
    private String playerO;

    @Column(name = "end_result", length = 50, nullable = false)
    private String endResult;

    @Column(name = "win_text", length = 1)
    private String winText;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "game_id")
    private List<Position> positions = new ArrayList<>();

    @Column(name = "bot_difficulty", length = 50)
    private String botLevel;

    @Temporal(TemporalType.DATE)
    @Column(name = "play_date")
    private Calendar playDate;

    @Column(name = "first_turn", length = 1, nullable = false)
    private String firstTurn = "X";

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JoinColumn(name = "game_id")
    private List<History> histories = new ArrayList<>();

}
