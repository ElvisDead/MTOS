import { getColor } from "./colors.js"

const seals = [
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

export function drawKinMap(weather){

const map=document.getElementById("kinmap")
map.innerHTML=""

map.style.display="grid"
map.style.gridTemplateColumns="60px repeat(13,18px)"
map.style.gridAutoRows="18px"

let min=Math.min(...weather)
let max=Math.max(...weather)

const cells=[]

// header
map.appendChild(document.createElement("div"))
for(let t=0;t<13;t++){
let h=document.createElement("div")
h.innerText="T"+(t+1)
h.style.fontSize="8px"
h.style.color="#aaa"
map.appendChild(h)
}

// grid

let kin = 1
  
for(let seal=0;seal<20;seal++){

let label=document.createElement("div")
label.innerText=seals[seal]
label.style.fontSize="8px"
label.style.color="#777"
map.appendChild(label)

for(let tone=0;tone<13;tone++){

let v=weather[kin-1] ?? 0
let val=(max===min)?0:(v-min)/(max-min)

let c=document.createElement("div")
c.className="cell"

c.dataset.kin=kin
let toneReal = (kin-1)%13
let sealReal = (kin-1)%20

c.dataset.tone = toneReal
c.dataset.seal = sealReal

c.style.background=getColor(val)

let toneReal = (kin-1)%13
let sealReal = (kin-1)%20

c.dataset.tone = toneReal
c.dataset.seal = sealReal

c.title =
"Kin "+kin+"\n"+
"Seal: "+seals[sealReal]+"\n"+
"Tone: "+(toneReal+1)+"\n"+
"Attention: "+v.toFixed(3)

map.appendChild(c)
cells.push(c)

kin++

}

}

highlightCurrentKin(cells)

}

export function highlightCurrentKin(cells){

if(window.currentKin===null) return

let tone0 = (window.currentKin-1)%13
let seal0 = (window.currentKin-1)%20

let analogSeal = (seal0 + 4) % 20
let antipodeSeal = (seal0 + 10) % 20
let occultSeal = 19 - seal0

let analogKin = window.currentKin - 52
if(analogKin < 1) analogKin += 260
if(analogKin > 260) analogKin -= 260
let antipodeKin = ((tone0 + antipodeSeal*13) % 260) + 1
let occultKin = ((tone0 + occultSeal*13) % 260) + 1

let harmonic = Math.floor((currentKin-1)/4)
let wave = Math.floor((currentKin-1)/13)

cells.forEach(c=>{

c.style.outline=""
c.style.boxShadow=""

let kin=parseInt(c.dataset.kin)

let tone=(kin-1)%13
let seal=(kin-1)%20

let shadows=[]

// same tone
if(tone===tone0){
shadows.push("0 0 3px cyan")
}

// same seal
if(seal===seal0){
shadows.push("0 0 3px #00ff88")
}

// harmonic
if(Math.floor((kin-1)/4)===harmonic){
shadows.push("0 0 4px #00ccff")
}

// wave
if(Math.floor((kin-1)/13)===wave){
shadows.push("0 0 4px orange")
}

if(shadows.length>0){
c.style.boxShadow=shadows.join(",")
}

// analog
if(kin===analogKin){
c.style.outline="2px solid yellow"
}

// antipode
if(kin===antipodeKin){
c.style.outline="2px solid red"
}

// occult
if(kin===occultKin){
c.style.outline: 2px solid #00ffff
box-shadow: 0 0 6px #00ffff
}

// current
if(kin===currentKin){
c.style.outline="2px solid white"
c.style.boxShadow="0 0 10px white"
}

})

}
