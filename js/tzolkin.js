export const tones = [
1,2,3,4,5,6,7,8,9,10,11,12,13
]

export const seals = [
"Dragon",
"Wind",
"Night",
"Seed",
"Serpent",
"WorldBridger",
"Hand",
"Star",
"Moon",
"Dog",
"Monkey",
"Human",
"Skywalker",
"Wizard",
"Eagle",
"Warrior",
"Earth",
"Mirror",
"Storm",
"Sun"
]

export function kinFromTS(tone,seal){

return ((seal*13)+tone)%260 +1

}

 tsFromKin(kin){

let tone=(kin-1)%13
let seal=(kin-1)%20

return {tone,seal}

}

 kinToTS(kin){

let tone=(kin-1)%13
let seal=(kin-1)%20

return {tone,seal}

}
