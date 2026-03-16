export function drawLinearKinMap(id,data){

let map=document.getElementById(id)

map.innerHTML=""

map.style.display="grid"
map.style.gridTemplateColumns="repeat(20,12px)"
map.style.gridAutoRows="12px"
  
for(let kin=1; kin<=260; kin++){

let v=data[kin-1] ?? 0

let c=document.createElement("div")
c.className="cell"

if(v>0){

const colors=[
"#ffff00",
"#ffd000",
"#ffa000",
"#ff7000",
"#ff4000",
"#ff0000",
"#cc0000"
]

let index=Math.min(v-1,6)
c.style.background=colors[index]

c.title="Kin "+kin+" ("+v+" users)"

}else{

c.style.background="#111"

}

map.appendChild(c)

}

}
