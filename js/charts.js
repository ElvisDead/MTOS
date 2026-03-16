export function drawChart(id,data){

if(charts[id]){
charts[id].destroy()
delete charts[id]
}

let ctx=document.getElementById(id).getContext("2d")

charts[id]=new Chart(ctx,{
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

<script type="module" src="js/charts.js"></script>

}
