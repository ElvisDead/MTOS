export function drawGlobalKinMap(id){

if(window.__globalMapDrawn) return
window.__globalMapDrawn = true

console.log("DRAW GLOBAL MAP INTO:", id)

let map = document.getElementById(id)

while(map.firstChild){
  map.removeChild(map.firstChild)
}
map.replaceChildren()

map.style.display = "grid"
map.style.gridTemplateColumns = "40px repeat(13,12px)"
map.style.gridAutoRows = "12px"

// пустой угол
map.appendChild(document.createElement("div"))

// заголовки T1–T13
for(let t=0; t<13; t++){
let h=document.createElement("div")
h.innerText="T"+(t+1)
h.style.fontSize="8px"
h.style.color="#aaa"
map.appendChild(h)
}

// подписи печатей
const seals = [
"Dragon","Wind","Night","Seed","Serpent",
"WorldBridger","Hand","Star","Moon","Dog",
"Monkey","Human","Skywalker","Wizard","Eagle",
"Warrior","Earth","Mirror","Storm","Sun"
]

// цвета плотности (до 9 уровней)
const densityColors = [
"#111111", // 0
"#003366",
"#0055aa",
"#0088ff",
"#00ccff",
"#00ffaa",
"#aaff00",
"#ffff00",
"#ff8800",
"#ff0000"
]

for(let seal=0; seal<20; seal++){

// подпись слева
let label=document.createElement("div")
label.innerText=seals[seal]
label.style.fontSize="8px"
label.style.color="#777"
map.appendChild(label)

for(let tone=0; tone<13; tone++){

let kin = ((seal*13)+tone)%260 +1

let users = window.kinUsers && window.kinUsers[kin] ? window.kinUsers[kin] : []
let count = users.length

let c=document.createElement("div")
c.className="cell"

// цвет по плотности
let idx = Math.min(count, 9)
c.style.background = densityColors[idx]

// список имён
let userList = users.length ? users.map(u=>u.name || u).join("\n") : "-"

c.title =
"Kin: "+kin+"\n"+
"Users: "+count+"\n\n"+
userList

map.appendChild(c)

}

}

}
