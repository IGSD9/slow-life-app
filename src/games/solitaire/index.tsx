"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

type Card = { id: number; suit: string; rank: string; faceUp: boolean };

function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: id++, suit, rank, faceUp: false });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

interface SolitaireGameProps {
  onGameOver: (score: number) => void;
}

export function SolitaireGame({ onGameOver }: SolitaireGameProps) {
  const [tableau, setTableau] = useState<Card[][]>([]);
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);

  const initGame = useCallback(() => {
    const deck = createDeck();
    const cols: Card[][] = Array.from({ length: 7 }, () => []);
    let idx = 0;
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r <= c; r++) {
        const card = { ...deck[idx++], faceUp: r === c };
        cols[c].push(card);
      }
    }
    setTableau(cols);
    setStock(deck.slice(idx).map((c) => ({ ...c, faceUp: false })));
    setWaste([]);
    setFoundations([[], [], [], []]);
    setScore(0);
    setMoves(0);
    setWon(false);
    setStarted(true);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const rankValue = (rank: string) => {
    if (rank === "A") return 1;
    if (rank === "J") return 11;
    if (rank === "Q") return 12;
    if (rank === "K") return 13;
    return parseInt(rank, 10);
  };

  const isRed = (suit: string) => suit === "♥" || suit === "♦";

  const canStack = (top: Card, bottom: Card) => {
    if (!bottom.faceUp) return false;
    return (
      isRed(top.suit) !== isRed(bottom.suit) &&
      rankValue(top.rank) === rankValue(bottom.rank) - 1
    );
  };

  const drawStock = () => {
    if (stock.length === 0) {
      if (waste.length === 0) return;
      setStock(waste.map((c) => ({ ...c, faceUp: false })).reverse());
      setWaste([]);
      setMoves((m) => m + 1);
      return;
    }
    const card = stock[stock.length - 1];
    setStock(stock.slice(0, -1));
    setWaste([...waste, { ...card, faceUp: true }]);
    setMoves((m) => m + 1);
  };

  const moveToFoundation = (card: Card, from: "waste" | number) => {
    const suitIdx = SUITS.indexOf(card.suit as (typeof SUITS)[number]);
    if (suitIdx < 0) return;
    const pile = foundations[suitIdx];
    const expected = pile.length === 0 ? 1 : rankValue(pile[pile.length - 1].rank) + 1;
    if (rankValue(card.rank) !== expected) return;

    const newFoundations = foundations.map((f, i) =>
      i === suitIdx ? [...f, card] : f,
    );
    setFoundations(newFoundations);

    if (from === "waste") {
      setWaste(waste.slice(0, -1));
    } else {
      const newTableau = tableau.map((col, i) =>
        i === from ? col.slice(0, -1) : col,
      );
      const col = tableau[from];
      if (col.length > 1 && !newTableau[from][newTableau[from].length - 1]?.faceUp) {
        const last = newTableau[from][newTableau[from].length - 1];
        if (last) last.faceUp = true;
      }
      setTableau(newTableau);
    }

    setScore((s) => s + 10);
    setMoves((m) => m + 1);

    const total = newFoundations.reduce((sum, f) => sum + f.length, 0);
    if (total === 52) {
      setWon(true);
      onGameOver(score + 10 + 500);
    }
  };

  const moveWasteToTableau = (colIdx: number) => {
    if (waste.length === 0) return;
    const card = waste[waste.length - 1];
    const col = tableau[colIdx];
    if (col.length === 0) {
      if (card.rank !== "K") return;
    } else if (!canStack(card, col[col.length - 1])) return;

    setWaste(waste.slice(0, -1));
    setTableau(tableau.map((c, i) => (i === colIdx ? [...c, card] : c)));
    setMoves((m) => m + 1);
  };

  const cardLabel = (c: Card) => (c.faceUp ? `${c.rank}${c.suit}` : "🂠");

  if (!started) return null;

  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <div className="flex justify-between text-sm">
        <span className="text-[#ff6b9d] font-bold">SCORE: {score}</span>
        <span className="text-[#9494b0]">手数: {moves}</span>
      </div>

      <div className="flex gap-2 justify-between">
        <button
          onClick={drawStock}
          className="w-12 h-16 bg-[#fff0f6] border border-[#ff6b9d]/30 rounded text-xs flex items-center justify-center"
        >
          {stock.length > 0 ? "🂠" : "↻"}
        </button>
        <button
          onClick={() => waste.length > 0 && moveToFoundation(waste[waste.length - 1], "waste")}
          className="w-12 h-16 bg-[#fff0f6] border border-gray-600 rounded text-xs"
        >
          {waste.length > 0 ? cardLabel(waste[waste.length - 1]) : ""}
        </button>
        <div className="flex gap-1">
          {foundations.map((pile, i) => (
            <div
              key={i}
              className="w-10 h-14 bg-[#fff0f6]/50 border border-green-500/30 rounded text-[10px] flex items-center justify-center"
            >
              {pile.length > 0 ? cardLabel(pile[pile.length - 1]) : SUITS[i]}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {tableau.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-0.5 min-w-[44px]">
            {col.length === 0 ? (
              <button
                onClick={() => moveWasteToTableau(colIdx)}
                className="w-10 h-14 border border-dashed border-[#ffd6e8] rounded"
              />
            ) : (
              col.map((card, cardIdx) => (
                <button
                  key={card.id}
                  onClick={() => {
                    if (cardIdx === col.length - 1 && card.faceUp) {
                      moveToFoundation(card, colIdx);
                    }
                  }}
                  className={`w-10 h-10 text-[9px] border rounded ${
                    card.faceUp
                      ? "bg-[#fff0f6] border-[#ff6b9d]/30"
                      : "bg-[#fff8fb] border-[#ffd6e8]"
                  }`}
                  style={{ marginTop: cardIdx > 0 ? -20 : 0 }}
                >
                  {cardLabel(card)}
                </button>
              ))
            )}
          </div>
        ))}
      </div>

      {won && <p className="text-center text-green-400 font-bold">クリア！</p>}

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={initGame} className="flex-1">
          リセット
        </Button>
        <Button
          size="sm"
          onClick={() => onGameOver(score + moves * 2)}
          className="flex-1"
        >
          終了してスコア送信
        </Button>
      </div>
      <p className="text-[10px] text-[#8888a8] text-center">
        カードをタップして.foundationへ移動 / 空列にKを配置
      </p>
    </div>
  );
}
