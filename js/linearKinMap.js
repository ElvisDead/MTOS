export function drawLinearKinMap(id,data){

let map=document.getElementById(id)

map.innerHTML=""

map.style.display="grid"
map.style.gridTemplateColumns="repeat(20,24px)"
map.style.gridAutoRows="24px"
  
for(let kin=1; kin<=260; kin++){

let c=document.createElement("div")
c.className="cell"

// 👉 USERS ИЗ MTOS
let users = window.kinUsers && window.kinUsers[kin] ? window.kinUsers[kin] : []
let count = users.length

// 👉 СПИСОК ИМЁН
let userList = count ? users.map(u=>u.name || u).join("\n") : "-"

// 👉 9 УРОВНЕЙ ЦВЕТА
if(count > 0){

const colors = [
"#222222",
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

let index = Math.min(count, 9)
c.style.background = colors[index]

}else{
c.style.background="#111"
}

// 👉 HOVER
c.title = "Kin "+kin+"\nUsers ("+count+"):\n"+userList

// 👉 КЛИК POPUP
c.onclick = () => {

let existing = document.getElementById("kin-popup")
if(existing) existing.remove()

let popup = document.createElement("div")

popup.id="kin-popup"
popup.style.position="fixed"
popup.style.left="50%"
popup.style.top="50%"
popup.style.transform="translate(-50%,-50%)"
popup.style.background="#111"
popup.style.color="#fff"
popup.style.padding="12px"
popup.style.border="1px solid #444"
popup.style.borderRadius="8px"
popup.style.zIndex="9999"
popup.style.whiteSpace="pre-line"

popup.innerHTML = `
<b>Kin ${kin}</b>

Users (${count}):
${userList}
`

document.body.appendChild(popup)
}

map.appendChild(c)
  
}
  
}
