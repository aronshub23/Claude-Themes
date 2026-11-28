import type { Look } from './look.js'
import { LOOK as neonCircuit } from './neon-circuit.js'
import { LOOK as turbineHall } from './turbine-hall.js'

// Every look, in the order `/look` lists and cycles them. The first is the
// one a new install starts with. To add a look, write its module beside
// these and list it here.
export const LOOKS: readonly Look[] = [neonCircuit, turbineHall]

export type { Look }
