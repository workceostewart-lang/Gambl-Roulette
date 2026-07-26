import assert from "node:assert/strict";
import test from "node:test";

import {
  WHEEL_POCKETS,
  rotationForPocket,
  selectWinningPocket,
} from "../app/roulette.ts";

const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;
const angularDistance = (first, second) => {
  const distance = Math.abs(normalizeAngle(first - second));
  return Math.min(distance, 360 - distance);
};

test("selects one immutable winning pocket as the round source of truth", () => {
  const pocket = selectWinningPocket(() => 17 / WHEEL_POCKETS.length);

  assert.strictEqual(pocket, WHEEL_POCKETS[17]);
  assert.equal(pocket.number, 23);
  assert.equal(pocket.color, "red");
  assert.ok(Object.isFrozen(pocket));
});

test("every spin lands the selected pocket at the pointer", () => {
  let rotation = 0;
  const sequence = [8, 29, 0, 17, 36, 8];

  for (const index of sequence) {
    const pocket = WHEEL_POCKETS[index];
    const nextRotation = rotationForPocket(rotation, pocket);

    assert.ok(nextRotation >= rotation + 4 * 360);
    assert.ok(
      angularDistance(nextRotation, pocket.targetAngle) < 1e-9,
      `pocket ${pocket.number} did not land at its target angle`,
    );
    rotation = nextRotation;
  }
});
