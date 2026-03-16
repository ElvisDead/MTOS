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

let v=weather[kin-1] ?? 0
let val=(max===min)?0:(v-min)/(max-min)

let c=document.createElement("div")
c.className="cell"

c.dataset.kin=kin
c.dataset.tone=tone
c.dataset.seal=seal

c.style.background=getColor(val)

c.title=
"Kin "+kin+"\n"+
"Seal: "+seals[seal]+"\n"+
"Tone: "+(tone+1)+"\n"+
"Attention: "+v.toFixed(3)

map.appendChild(c)
cells.push(c)

}

highlightCurrentKin(cells)

}

export function highlightCurrentKin(cells){

if(window.currentKin===null) return

let tone0 = (currentKin-1)%13
let seal0 = (currentKin-1)%20

let analogKin = ((currentKin+52-1)%260)+1
let antipodeKin = ((currentKin+130-1)%260)+1
let occultKin = 261-currentKin

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
c.style.outline="2px solid violet"
}

// current
if(kin===currentKin){
c.style.outline="2px solid white"
c.style.boxShadow="0 0 10px white"
}

})

}
