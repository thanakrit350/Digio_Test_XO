package org.itsci.Digio_Test_XO.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "positions")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Position {

    @Id
    @GeneratedValue
    @Column(name = "position_id")
    private int positionId;

    @Column(name = "`col`", nullable = false)
    private int column;

    @Column(name = "`row`", nullable = false)
    private int row;
}
