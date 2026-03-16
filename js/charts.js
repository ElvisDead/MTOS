export function drawChart(id,data){

if(window.charts[id]){
window.charts[id].destroy()
delete window.charts[id]
}

let ctx=document.getElementById(id).getContext("2d")

window.charts[id]=new Chart(ctx,{
type:"line",
data:{
labels:data.map((_,i)=>{
let d=new Date()
d.setDate(d.getDate()+i)
return d.toISOString().slice(5,10)
}),
datasets:[{
data:data,
borderColor:"cyan",
fill:false
}]
},
options:{
plugins:{legend:{display:false}},
scales:{
y:{
type:"linear",
min:0,
max:1
}
}
}
})

}
