## Documented limitations (not blocking, revisit only if it becomes a real problem):

- Long-run wake drift from top/bottom boundary asymmetry: noted in README, low priority.
- Sponge layer: the more robust absorbing-boundary upgrade, only worth building if reflections resurface at higher speeds or new geometry.
- BGK's Reynolds ceiling (τ clamp): documented tradeoff; MRT collision operator would be the real fix if you ever need higher achievable Re, but that's a significant rewrite, not a tweak.
## Nice-to-have, cheap, do whenever:

- Modest resolution bump (512×256 → ~640×320) for visual smoothness — explicitly not a physics fix, just cleaner edges.
- Factor the duplicated feq() out of equilibrium.frag / collision.frag into a shared GLSL snippet pure code cleanliness, zero behavior change.
- Corner-pixel edge case (where left/top boundary conditions overlap) currently silently resolved by if-chain order, harmless, not worth touching.
## Real upcoming features, roughly in order of what unlocks the most:
- Environmental controls (humidity/altitude/temperature) doing now.
- Force integration (Cl/Cd from momentum exchange around the obstacle)  the next big physics milestone, turns this from "pretty visualization" into "actually measures something."
- UI sliders wired to real units (km/h, not raw lattice numbers)  needed to make the UnitSystem actually usable by a person instead of console.log.
- Additional test shapes (airfoil, flat plate) before jumping to full car geometry.
- Full F1 car model with movable wings/DRS/ground-effect modes the original stretch goal, comes last.