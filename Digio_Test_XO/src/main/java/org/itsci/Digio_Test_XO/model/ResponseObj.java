package org.itsci.Digio_Test_XO.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class ResponseObj {
    private int code;
    private Object result;
}
