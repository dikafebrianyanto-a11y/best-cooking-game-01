# Warung Cepat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/dikafebrianyanto-a11y/best-cooking-game-01/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/dikafebrianyanto-a11y/best-cooking-game-01/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Warung Cepat is an original Indonesian street-food kitchen game: run a busy
warung for one 3-minute shift, cooking Nasi Goreng, Mie Goreng, Sate Ayam, Es
Teh Manis and Gado-Gado to order. Grab ingredients from the crates, chop them
on the talenan (hold E), cook them in the wajan before they burn, assemble
each dish on the plate in recipe order, and serve it at the window before the
ticket's patience runs out. Served dishes build a combo multiplier, wrong
serves and expired tickets cost strikes (three ends the shift early), and the
last 30 seconds are a rush with double coins.

Move with WASD or the arrow keys, interact with E or Space, or click a
station to walk to it; P pauses and M mutes the synthesized WebAudio sound
effects and pentatonic music loop. All art is drawn in code on a canvas, with
no external assets and no network requests.

Run it with `node serve.ts` and open http://localhost:8080, or serve the
`game/` directory with any static HTTP server. Build the entry output with
`MAKEFUN_OUTPUT_DIR=out node main.ts`.
