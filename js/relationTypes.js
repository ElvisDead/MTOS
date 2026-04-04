export function getRelationLabel(score){
    const s = Number(score ?? 0)

    if (s >= 0.9) {
        return { label: "Ultra Synergy", color: "#00ffd5" }
    }

    if (s >= 0.75) {
        return { label: "Strong", color: "#00cc66" }
    }

    if (s >= 0.6) {
        return { label: "Collaborate", color: "#33ff66" }
    }

    if (s >= 0.45) {
        return { label: "Support", color: "#99ff99" }
    }

    if (s >= 0.3) {
        return { label: "Weak Support", color: "#cccccc" }
    }

    if (s >= 0.15) {
        return { label: "Neutral", color: "#888888" }
    }

    if (s >= 0) {
        return { label: "Tension", color: "#ffcc00" }
    }

    if (s >= -0.3) {
        return { label: "Conflict", color: "#ff6600" }
    }

    return { label: "Strong Conflict", color: "#ff0000" }
}

export function getRelationProfile(score, pressure = 0, urgency = 0, isTodayRealContact = false){
    const base = getRelationLabel(score)

    let variant = base.label

    if (isTodayRealContact) {
        variant = pressure >= 0.72 || urgency >= 0.62
            ? `${base.label} · Active Contact`
            : `${base.label} · Light Contact`
    } else {
        if (pressure >= 0.78 && score < 0) {
            variant = `${base.label} · Conflict Spike`
        } else if (pressure >= 0.62 && score > 0.6) {
            variant = `${base.label} · Focused`
        } else if (pressure >= 0.50 && Math.abs(score) < 0.2) {
            variant = `${base.label} · Unstable`
        }
    }

    return {
        ...base,
        variant
    }
}