// หน้า payload สำหรับเก็บข้อมูลเกมก่อนส่งไปเซฟที่เซิร์ฟเวอร์
export const toISODate = (d = new Date()) => d.toISOString().slice(0, 10);


export function buildCreatePayload({
  tableSize, winNum, gameStatus,
  playerX, playerO, botLevel, firstTurn, playDate,
  endResult, winText, moves, positions = [],
}) {
  return {
    tableSize,
    winNum,
    gameStatus,
    playerX,
    playerO,
    endResult,
    winText,             
    botLevel,            
    firstTurn,           
    playDate,            
    positions: positions.map(p => ({ row: p.row, col: p.col })),
    histories: (moves || []).map(m => ({
      turnNum: m.turnNum,
      row: m.row,
      col: (m.col ?? m.column),   
      text: m.text,
    })),
  };
}
