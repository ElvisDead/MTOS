export function analog(i){
return (i + 4) % 20
}

function kinFromTS(tone,seal){

return ((seal*13)+tone)%260 +1

}

function tsFromKin(kin){

let tone=(kin-1)%13
let seal=(kin-1)%20

return {tone,seal}

}

function kinToTS(kin){

let tone=(kin-1)%13
let seal=(kin-1)%20

return {tone,seal}

}
