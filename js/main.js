import { drawWeatherMap } from "./weatherMap.js"
import { drawNetwork } from "./network.js"
import { initTimeControls } from "./timeController.js"

let pyodide = null

let fieldState = null
let fieldMode = null
let users = []
let selectedAgent = null

let learningMemory = {}
let agentCounter = 0

const MAX_AGENTS = 10
const MIN_AGENTS = 2

const AGENT_TYPES = ["explorer","stabilizer","amplifier","disruptor"]

// ===============================
// INIT
// ===============================
export async function initMTOS(){

    const status = document.getElementById("status")

    try{
        status.innerText = "Loading Pyodide..."

        pyodide = await loadPyodide()
        await pyodide.loadPackage("numpy")

        const code = await fetch("./MTOS_Engine.py").then(r => r.text())
        pyodide.runPython(code)

        status.innerText = "Ready"

    }catch(e){
        console.error(e)
        status.innerText = "INIT ERROR"
    }
}

// ===============================
// RUN
// ===============================
export async function runMTOS(){

    const status = document.getElementById("status")

    const name  = document.getElementById("name").value
    const year  = parseInt(document.getElementById("year").value)
    const month = parseInt(document.getElementById("month").value)
    const day   = parseInt(document.getElementById("day").value)

    let weather = []
    let pressure = []
    let userKin = 1
    let todayKin = 1

    try{

        status.innerText = "Running..."

        userKin = Number(pyodide.runPython(`
mtos_current_kin("${name}", ${year}, ${month}, ${day})
`))

        const now = new Date()

        todayKin = Number(pyodide.runPython(`
mtos_current_kin("today", ${now.getFullYear()}, ${now.getMonth()+1}, ${now.getDate()})
`))

        weather = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_260_weather("${name}", ${year}, ${month}, ${day}))
`))

        pressure = JSON.parse(pyodide.runPython(`mtos_pressure_map()`))

        users = [
            createAgent(name,1.0),
            createAgent("Alice",0.8),
            createAgent("Bob",0.6)
        ]

        users = enrichAgents(users, year, month, day)

        const result = JSON.parse(pyodide.runPython(`
import json
users = ${JSON.stringify(users)}
f,s,u = mtos_multi_agents_field(users, ${year}, ${month}, ${day})
json.dumps([f,s,u])
`))

        fieldState = result[0]
        fieldMode  = result[1]
        users      = result[2]

        window.currentUsers = users

        status.innerText = "Done"

    }catch(e){
        console.error(e)
        status.innerText = "ERROR"
    }

    renderAll(weather, pressure, userKin, todayKin)

    let baseYear = year
    let baseMonth = month
    let baseDay = day

    function step(offset){

        try{

            const d = new Date(baseYear, baseMonth - 1, baseDay)
            d.setDate(d.getDate() + offset)

            const y = d.getFullYear()
            const m = d.getMonth() + 1
            const dd = d.getDate()

            const weather = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_260_weather("${name}", ${y}, ${m}, ${dd}))
`))

            const kin = Number(pyodide.runPython(`
mtos_current_kin("${name}", ${y}, ${m}, ${dd})
`))

            const pressure = JSON.parse(pyodide.runPython(`mtos_pressure_map()`))

            users = enrichAgents(users, y, m, dd)

            const result = JSON.parse(pyodide.runPython(`
import json
users = ${JSON.stringify(users)}
f,s,u = mtos_multi_agents_field(
    users,
    ${y},
    ${m},
    ${dd},
    ${JSON.stringify(fieldState)},
    ${JSON.stringify(fieldMode)}
)
json.dumps([f,s,u])
`))

            fieldState = result[0]
            fieldMode  = result[1]
            users      = result[2]

            // ===============================
            // LEARNING + ROLE BEHAVIOR
            // ===============================
            const decay = 0.85

            users = users.map(u=>{

                const kinIndex = u.kin - 1
                const phi = fieldState[kinIndex]

                if(!learningMemory[u.name]){
                    learningMemory[u.name] = 0
                }

                learningMemory[u.name] =
                    decay * learningMemory[u.name] +
                    (1 - decay) * phi

                const gain = Math.tanh(learningMemory[u.name])

                let newWeight = u.weight

                // ===============================
                // РОЛЕВОЕ ПОВЕДЕНИЕ
                // ===============================
                if(u.type === "amplifier"){
                    newWeight *= (1 + 0.6 * gain)
                }
                else if(u.type === "stabilizer"){
                    newWeight *= (1 + 0.2 * gain)
                }
                else if(u.type === "explorer"){
                    newWeight *= (1 + 0.3 * Math.random())
                }
                else if(u.type === "disruptor"){
                    newWeight *= (1 - 0.4 * gain)
                }

                newWeight = Math.max(0.2, Math.min(newWeight, 3))

                return {...u, weight:newWeight}
            })

            users = evolveAgents(users)

            window.currentUsers = users

            renderAll(weather, pressure, userKin, kin)

        }catch(e){
            console.error("STEP ERROR:", e)
        }
    }

    initTimeControls(step)
}

// ===============================
// CREATE AGENT
// ===============================
function createAgent(name, weight){

    const type = AGENT_TYPES[
        Math.floor(Math.random() * AGENT_TYPES.length)
    ]

    return {name, weight, type}
}

// ===============================
// ENRICH
// ===============================
function enrichAgents(users, y, m, d){

    return users.map(u=>{

        const kin = Number(pyodide.runPython(`
mtos_current_kin("${u.name}", ${y}, ${m}, ${d})
`))

        const phase = (kin % 20) * Math.PI / 10

        return {...u, kin, phase}
    })
}

// ===============================
// EVOLUTION
// ===============================
function evolveAgents(users){

    users = users.filter(u => u.weight > 0.25 || users.length <= MIN_AGENTS)

    let newAgents = []

    users.forEach(u=>{

        if(u.weight > 1.6 && users.length + newAgents.length < MAX_AGENTS){

            const child = createAgent("Agent_" + (++agentCounter), u.weight*0.5)

            newAgents.push(child)
        }
    })

    users = [...users, ...newAgents]

    users = users.map(u=>({

        ...u,
        phase: u.phase + (Math.random()-0.5)*0.2,
        weight: u.weight + (Math.random()-0.5)*0.05
    }))

    const total = users.reduce((s,u)=>s+u.weight,0)||1

    return users.map(u=>({
        ...u,
        weight: Math.max(0.2, Math.min(3, u.weight / total * users.length))
    }))
}

// ===============================
// RENDER
// ===============================
function renderAll(weather, pressure, userKin, currentKin){

    drawWeatherMap(
        "weatherMap",
        weather,
        userKin,
        currentKin,
        pressure,
        fieldState,
        selectedAgent
    )

    drawNetwork("networkMap", users, (agent)=>{
        selectedAgent = agent
    })
}
