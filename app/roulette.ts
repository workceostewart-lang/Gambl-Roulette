const FULL_ROTATION = 360;

export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
  10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3,
  26,
] as const;

export const RED_NUMBERS = new Set<number>([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export type PocketColor = "green" | "red" | "black";

export type WinningPocket = Readonly<{
  number: number;
  index: number;
  color: PocketColor;
  targetAngle: number;
}>;

export const numberColor = (number: number): PocketColor => {
  if (number === 0) return "green";
  return RED_NUMBERS.has(number) ? "red" : "black";
};

const pocketArc = FULL_ROTATION / WHEEL_ORDER.length;

export const WHEEL_POCKETS: readonly WinningPocket[] = Object.freeze(
  WHEEL_ORDER.map((number, index) =>
    Object.freeze({
      number,
      index,
      color: numberColor(number),
      targetAngle: (FULL_ROTATION - index * pocketArc) % FULL_ROTATION,
    }),
  ),
);

export function selectWinningPocket(random = Math.random): WinningPocket {
  const index = Math.min(
    WHEEL_POCKETS.length - 1,
    Math.max(0, Math.floor(random() * WHEEL_POCKETS.length)),
  );
  return WHEEL_POCKETS[index];
}

function normalizeAngle(angle: number) {
  return ((angle % FULL_ROTATION) + FULL_ROTATION) % FULL_ROTATION;
}

export function rotationForPocket(
  currentRotation: number,
  pocket: WinningPocket,
  fullTurns = 4,
) {
  const clockwiseOffset = normalizeAngle(
    pocket.targetAngle - normalizeAngle(currentRotation),
  );
  return currentRotation + fullTurns * FULL_ROTATION + clockwiseOffset;
}
