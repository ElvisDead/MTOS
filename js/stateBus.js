// js/stateBus.js

window.MTOS_STATE = {
    todayKin: null,
    selectedKin: null,
    weather: null,
    collective: null,
    network: null,
    events: [],
    decision: null,
    memory: {
        contactsToday: {},
        relationHistory: {},
        decisions: [],
        outcomes: []
    }
}

window.setMTOSState = function (patch) {
    window.MTOS_STATE = {
        ...window.MTOS_STATE,
        ...patch
    }
    window.dispatchEvent(new CustomEvent("mtos:state-updated", {
        detail: window.MTOS_STATE
    }))
}

window.updateMTOSBranch = function (branchName, patch) {
    const current = window.MTOS_STATE[branchName] || {}
    window.MTOS_STATE[branchName] = {
        ...current,
        ...patch
    }
    window.dispatchEvent(new CustomEvent("mtos:state-updated", {
        detail: window.MTOS_STATE
    }))
}