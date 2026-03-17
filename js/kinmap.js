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

window.kinUsers = window.kinUsers || {}

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

let kin = row + 20 * (((2*(col - row)) % 13 + 13) % 13) + 1

let v = weather && weather.length===260 ? weather[kin-1] : Math.random()
let val=(max===min)?0:(v-min)/(max-min)

let c=document.createElement("div")
c.className="cell"

c.dataset.kin=kin
let toneReal = (kin-1)%13
let sealReal = (kin-1)%20

c.dataset.tone = toneReal
c.dataset.seal = sealReal

c.style.background=getColor(val)

let users = window.kinUsers && window.kinUsers[kin] ? window.kinUsers[kin] : []
let userList = users.length ? users.map(u=>u.name || u).join("\n") : "-"

let clarity = (window.currentKin === kin)
? 1
: 1 - Math.abs(kin - window.currentKin)/130

clarity = Math.max(0, Math.min(1, clarity))

c.title =
"Kin: "+kin+"\n"+
"Seal: "+seals[sealReal]+"\n"+
"Tone: "+(toneReal+1)+"\n"+
"Clarity: "+clarity.toFixed(3)+"\n"+
"Users:\n"+userList

c.onclick = () => {

let existing = document.getElementById("kin-popup")
if(existing) existing.remove()

let popup = document.createElement("div")
popup.id = "kin-popup"

popup.style.position = "fixed"
popup.style.left = "50%"
popup.style.top = "50%"
popup.style.transform = "translate(-50%, -50%)"
popup.style.background = "#111"
popup.style.color = "#fff"
popup.style.padding = "14px"
popup.style.border = "1px solid #444"
popup.style.borderRadius = "8px"
popup.style.zIndex = "9999"
popup.style.fontSize = "14px"
popup.style.maxWidth = "260px"
popup.style.whiteSpace = "pre-line"

popup.innerText =
"Kin: "+kin+"\n"+
"Seal: "+seals[sealReal]+"\n"+
"Tone: "+(toneReal+1)+"\n"+
"Clarity: "+clarity.toFixed(3)+"\n\n"+
"Users:\n"+userList

let close = document.createElement("div")
close.innerText = "×"
close.style.position = "absolute"
close.style.top = "6px"
close.style.right = "10px"
close.style.cursor = "pointer"

close.onclick = () => popup.remove()

popup.appendChild(close)
document.body.appendChild(popup)

}


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
