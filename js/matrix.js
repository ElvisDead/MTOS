import { seals } from "./tzolkin.js"

export function drawMatrix(id,data){

console.log("MY MATRIX FILE")

const map=document.getElementById(id)
map.innerHTML=""

map.style.display="grid"
map.style.gridTemplateColumns="40px repeat(13,12px)"
map.style.gridAutoRows="12px"

map.appendChild(document.createElement("div"))

for(let t=0;t<13;t++){
let h=document.createElement("div")
h.innerText="T"+(t+1)
h.style.fontSize="8px"
h.style.color="#aaa"
map.appendChild(h)
}

for(let kin=1;kin<=260;kin++){

let tone=(kin-1)%13
let seal=(kin-1)%20

if(tone===0){

let label=document.createElement("div")
label.innerText=seals[seal]
label.style.fontSize="8px"
label.style.color="#777"
map.appendChild(label)

}

let v=data[kin-1] ?? 0

let c=document.createElement("div")
c.className="cell"

c.style.background=v? "#ffaa00":"#111"
c.title="Kin "+kin+" ("+v+")"

map.appendChild(c)

}

}
