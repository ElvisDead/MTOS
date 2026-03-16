export function getColorInferno(v){

const inferno = [
[0,0,4],
[31,12,72],
[85,15,109],
[136,34,106],
[186,54,85],
[227,89,51],
[249,140,10],
[249,201,50],
[252,255,164]
]

let i = Math.min(
inferno.length-1,
Math.floor(v*(inferno.length-1))
)

let c = inferno[i]

return `rgb(${c[0]},${c[1]},${c[2]})`

}
