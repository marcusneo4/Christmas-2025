# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/vanilla JS (plain script files, no ES modules and no build step, so it also works when index.html is opened directly), deployed on GitHub Pages at https://marcusneo4.github.io/Christmas-2025/. Chosen to stay zero-build so it can also run by opening `index.html` or `START_SERVER.bat`.

## Users

One host (family member) runs the app from a laptop plugged into a large TV at the Soon family Christmas party. The audience is the whole family, from grandparents to kids, watching from across the room. The host needs to set up participants quickly and drive the reveals with as little fiddling as possible.

## Product Purpose

A live lucky draw for the Soon Family Christmas 2025. It randomly picks winners from the family list and reveals them one by one in a suspenseful, cheer-worthy sequence, plus a picker that chooses players for party games. Success: the room is watching the TV and cheering at every reveal, and the draw is visibly fair.

## Positioning

A family-owned party ritual, not a generic raffle tool: it carries the Soon family's own names, prizes and in-jokes, and is built to be performed on a TV, not used on a phone.

## Operating Context

- Laptop → big TV, viewed from several metres away; text must read at distance.
- Host drives with a mouse or keyboard; the audience never touches it.
- Sound plays through the TV speakers.
- One draw per night; a reload mid-draw must not lose who has already won.

## Capabilities and Constraints

- Participants: typed (one per line), uploaded CSV/TXT, or the built-in family list (kept in the repo by the owner's decision).
- Prize ladder: 17 winners — 10 main prizes counted down from 10th to 1st, with 7 "after Nth" bonus prizes in between. Default list lives in code; the host can edit prizes on the setup screen.
- Duplicate names are removed; each person can win at most once.
- The game-player picker chooses players one at a time from the same participant list, without repeats until the list is exhausted.
- Winners are chosen live at the moment of each reveal, never in advance.
- Results can be downloaded as a text file.
- Sound is synthesized with Web Audio (no audio assets). No looping music; sound must stay soft and musical (the host found loud synth fanfares annoying).

## Brand Commitments

- Name: "Soon Family Christmas Lucky Draw 2025".
- Tone: suspense and delight, festive, for all ages. Pacing should build tension; fast reveals felt flat.

## Evidence on Hand

- Family participant list: `js/data.js` (`DEFAULT_NAMES`).
- Default prize list: `js/data.js` (`DEFAULT_PRIZES`).
- No photos, logos or other brand assets exist; do not invent them.

## Product Principles

1. The TV is the stage: everything is designed to be read and felt from across the room.
2. Suspense before reveal: the prize is announced, then the winner — never both at once.
3. Visibly fair: randomness should be real and nothing should look rigged.
4. The host never gets stuck: one obvious next action at every moment, keyboard-drivable.

## Accessibility & Inclusion

Large type and high contrast for older relatives viewing at distance; respect `prefers-reduced-motion`; all controls keyboard-operable.
