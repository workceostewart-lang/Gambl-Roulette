# PRD: Roulette (Layout Matched to Wheel of Goods)

## 1. Overview
A browser-based roulette game reusing the same structural/layout conventions established for **Wheel of Goods**: menu-first flow, PC + mobile support, and a screen structure that keeps the wheel from crowding out the board on small screens. Core content is standard casino roulette (wheel, betting board, chips) rather than the Wheel of Fortune mechanic.

> Note: this PRD assumes the same layout *conventions* as Wheel of Goods (menu-first entry, dual orientation, wheel/board screen split on mobile) based on its PRD. If you want pixel-exact reuse of the wheel's size/position, chip art, and board grid, share the Wheel of Goods file/screenshots and I'll tighten the spec against the real values.

## 2. Platform Requirements
- Playable on both PC and mobile (same requirement as Wheel of Goods).
- Mobile must support both horizontal and vertical orientation.
- On mobile, the UI switches between a **wheel screen** and a **board screen** — mirroring Wheel of Goods' wheel/wall split — so the wheel never obscures the betting board on small screens.
- On PC/desktop and mobile landscape (if screen is wide enough), wheel and board can share the screen simultaneously.

## 3. Flow
1. **Menu / Lobby** — menu-first entry point, consistent with the approach used in [[family-war-game]] and Wheel of Goods.
   - Start Game
   - Rules / How to Play
   - Settings (chip denominations, sound, table limits)
2. **Betting Round**
   - Player places chips on the board.
   - Betting closes ("no more bets") before the spin.
3. **Spin Screen**
   - Wheel spins, ball lands on a number.
   - Result is highlighted on both the wheel and the board.
4. **Payout**
   - Winning bets are paid out per standard roulette odds.
   - Losing chips are cleared from the board.
   - Return to betting round (or menu, if bankroll is depleted).

## 4. The Wheel
- Standard 37-pocket European wheel (0–36, single zero) as the default ruleset. *(Confirm: single-zero European vs. double-zero American — affects house edge and payout table.)*
- Wheel occupies its own dedicated space/screen on mobile (same pattern as the Wheel of Goods spinner), sized and positioned to match that game's spinner conventions.
- Spin animation: variable spin duration/deceleration, ball bounce/settle animation, then highlight the winning pocket.

## 5. The Board
- Standard roulette betting layout: numbers 0–36 grid, plus outside bets (Red/Black, Odd/Even, 1–18/19–36, Dozens, Columns).
- Board uses the same general screen treatment as the Wheel of Goods "wall" (i.e., its own full-width screen on mobile, positioned alongside the wheel on wider viewports).
- Tapping/clicking a betting zone places the currently selected chip; winning zone is highlighted after each spin.

## 6. Chips
- Multiple chip denominations, visually distinct (color-coded, matching the Wheel of Goods chip/board art style once that reference is available).
- Chip selector/tray always visible during the betting round.
- Chips stack visually when multiple bets are placed on the same or overlapping zones.
- Drag-or-tap placement (tap-to-place recommended for mobile parity with touch-first design already used elsewhere).

## 7. Open Questions
- European (single-zero) vs. American (double-zero) wheel?
- Table limits / starting bankroll — fixed or configurable?
- Any additional bet types (splits, streets, corners, six-line) or outside bets only?
- Should losses/wins persist between sessions, or reset each time?
- Confirm exact wheel size/position, chip art, and board grid to reuse from Wheel of Goods directly (need the source file).
