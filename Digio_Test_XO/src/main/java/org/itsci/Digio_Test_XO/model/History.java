package org.itsci.Digio_Test_XO.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "histories")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class History {

    @Id
    @GeneratedValue
    @Column(name = "history_id")
    private int historyId;

    @Column(name = "turn_num", nullable = false)
    private int turnNum;

    @Column(name = "`col`", nullable = false)
    private int column;

    @Column(name = "`row`", nullable = false)
    private int row;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "position_id")
    private Position position;

    @Column(name = "text", length = 1, nullable = false)
    private String text;

}
