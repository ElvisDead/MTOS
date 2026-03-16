export function drawPhaseSpace(data){

let ctx=document.getElementById("phaseSpace")

if(window.charts["phaseSpace"]) charts["phaseSpace"].destroy()

window.charts["phaseSpace"] = new Chart(ctx,{
type:"scatter",
data:{
datasets:[{
data:data.x.map((v,i)=>({x:v,y:data.y[i]})),
pointRadius:2,
borderColor:"cyan"
}]
},
options:{
scales:{
x:{suggestedMin:0,suggestedMax:1},
y:{suggestedMin:0,suggestedMax:1}
}
}
})

}
