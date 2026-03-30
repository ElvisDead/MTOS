const HISTORY_KEY = "mtos_network_history"

export function saveNetworkState(users, memory){

    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")

    history.push({
        t: Date.now(),
        users: JSON.parse(JSON.stringify(users)),
        memory: JSON.parse(JSON.stringify(memory))
    })

    // ограничение (например 200 состояний)
    if(history.length > 200){
        history.shift()
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function loadNetworkHistory(){
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
}

export function clearNetworkHistory(){
    localStorage.removeItem(HISTORY_KEY)
}