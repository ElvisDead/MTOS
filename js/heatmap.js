import { seals, tones } from "./tzolkin.js"
import { getColor } from "./colors.js"

export function drawHeatmap(id,data,cols,rows=cols){

let map=document.getElementById(id)
map.innerHTML=""

map.style.display="grid"
map.style.gridTemplateColumns=`40px repeat(${cols},12px)`
map.style.gridTemplateRows=`repeat(${rows+1},14px)`

map.appendChild(document.createElement("div"))

let headers = cols==20 ? seals : tones

headers.forEach(s=>{

let h=document.createElement("div")
h.style.fontSize="8px"
h.style.color="#aaa"
h.innerText=s

map.appendChild(h)

})

for(let y=0;y<rows;y++){

let label=document.createElement("div")
label.style.fontSize="8px"
label.style.color="#aaa"
label.innerText = rows==13 ? tones[y] : seals[y]

map.appendChild(label)

for(let x=0;x<cols;x++){

let kin = x + y*13 + 1

let v=data[kin-1] ?? 0

let val=v
if(val<0) val=0
if(val>1) val=1

let c=document.createElement("div")
c.className="cell"

c.style.background=getColor(val)

c.title=`${Number(v).toFixed(2)}`

map.appendChild(c)

}

}

}
