export function drawActivity(id, weather){

    const root = document.getElementById(id)
    root.innerHTML = ""

    let sum = 0

    weather.forEach(w=>{
        sum += w.attention
    })

    const avg = sum / weather.length

    root.innerHTML = `
        Activity: ${avg.toFixed(3)}
    `
}
