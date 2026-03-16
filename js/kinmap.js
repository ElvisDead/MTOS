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
map.style.gridTemplateColumns="60px repeat(13,24px)"
map.style.gridAutoRows="24px"

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
  
for(let row=0;row<20;row++){

let label=document.createElement("div")
label.innerText=seals[row]
label.style.fontSize="8px"
label.style.color="#777"
map.appendChild(label)

for(let col=0;col<13;col++){

let kin = row*13 + col + 1

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

let spiral = Math.sin((kin-1)/260 * Math.PI*2) * 6
c.style.transform = "rotate("+spiral+"deg)"

let users = kinUsers[kin] || []
let userList = users.length ? users.join("\n") : "none"

c.title =
"Kin: "+kin+"\n"+
"Seal: "+seals[sealReal]+"\n"+
"Tone: "+(toneReal+1)+"\n"+
"Users:\n"+userList


map.appendChild(c)
cells.push(c)

}

}

highlightCurrentKin(cells)

}

export function highlightCurrentKin(cells){

if(window.currentKin===null) return

let tone0 = (window.currentKin-1)%13
let seal0 = (window.currentKin-1)%20

let harmonic = Math.floor((currentKin-1)/4)
let wave = Math.floor((currentKin-1)/13)

cells.forEach(c=>{

c.style.outline=""
c.style.boxShadow=""

c.style.border=""
c.style.borderTop=""
c.style.borderLeft=""

let kin=parseInt(c.dataset.kin)

// subtle structural grid

if((kin-1)%13===0){
c.style.borderTop="1px solid #444"
}

if((kin-1)%4===0){
c.style.borderLeft="1px solid #333"
}

let waveIndex = Math.floor((kin-1)/13)
let currentWave = Math.floor((currentKin-1)/13)

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

// wave highlight
if(waveIndex === currentWave){

shadows.push("0 0 4px orange")

// wave line
c.style.border="1px solid rgba(255,140,0,0.35)"

}

if(shadows.length>0){
c.style.boxShadow=shadows.join(",")
}

// current
if(kin===currentKin){
c.style.outline="2px solid white"
c.style.boxShadow="0 0 10px white"
}

})

}
