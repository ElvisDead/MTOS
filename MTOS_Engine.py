"""
MTOS — Metabolic Tzolkin Operating System
Version 1.2

Computational simulation of attention dynamics
based on Tzolkin temporal structure.

Features:
- 260-day cognitive cycle
- resonance field of archetypes
- fatigue regulation
- tone wave oscillator
- attention dynamics
- attractor analysis
- cognitive climate modeling
- collective cognition model
- interaction networks

Author: MTOS Research
Year: 2026
"""

print("MTOS ENGINE NEW VERSION")

import datetime
import json
import math
from typing import TYPE_CHECKING, Any

import numpy as np

import math

TAU = 2 * math.pi

def wrap_phase(phi):
    return phi % TAU

def phase_distance(a, b):
    d = abs((a - b) % TAU)
    return min(d, TAU - d)

def phase_alignment(a, b):
    return math.cos(a - b)

def phase_coupling_term(phi_i, neighbors, kappa=0.08):
    if not neighbors:
        return 0.0
    return sum(kappa * math.sin(phi_j - phi_i) for phi_j in neighbors) / len(neighbors)

def kin_base_phase(kin):
    # базовая фаза по 260-циклу
    return wrap_phase(TAU * ((kin - 1) / 260.0))

def tone_phase_shift(kin):
    tone = ((kin - 1) % 13) + 1
    return TAU * ((tone - 1) / 13.0)

def seal_phase_shift(kin):
    seal = ((kin - 1) % 20) + 1
    return TAU * ((seal - 1) / 20.0)

def compute_phase_for_kin(kin, attention, pressure, conflict, field=0.5, prev_phi=None):
    base = kin_base_phase(kin)
    tone_shift = tone_phase_shift(kin) * 0.35
    seal_shift = seal_phase_shift(kin) * 0.20

    omega = 0.04 + attention * 0.06 - pressure * 0.03 - conflict * 0.02
    modulation = attention * pressure * 0.25 + field * 0.10 - conflict * 0.08

    phi = base + tone_shift + seal_shift + omega + modulation

    if prev_phi is not None:
        phi = prev_phi * 0.72 + phi * 0.28

    return wrap_phase(phi)

if TYPE_CHECKING:
    class _LocalStorageStub:
        def getItem(self, key: str) -> str | None: ...
        def setItem(self, key: str, value: str) -> None: ...
else:
    _LocalStorageStub = Any


def get_local_storage() -> _LocalStorageStub:
    from js import localStorage
    return localStorage


def load_global_users():
    localStorage = get_local_storage()
    data = localStorage.getItem("mtos_global_users")

    if data is None:
        return []

    try:
        return json.loads(data)
    except:
        return []


def save_global_users(users):
    localStorage = get_local_storage()
    localStorage.setItem(
        "mtos_global_users",
        json.dumps(users)
    )

# ===============================
# NUMERICAL STABILITY CORE
# ===============================

def safe_exp(x):
    import numpy as np
    return np.exp(np.clip(x, -50, 50))

def safe_log(x):
    import numpy as np
    return np.log(np.clip(x, 1e-9, 1e9))

def safe_value(x, default=0.5):
    import numpy as np
    if np.isnan(x) or np.isinf(x):
        return default
    return x

def clamp01(x):
    return max(0.0, min(float(x), 1.0))

USE_CACHE = True
GLOBAL_USERS = load_global_users()
GLOBAL_KIN_DISTRIBUTION = [0.5]*260
GLOBAL_ATTENTION_BUFFER = [0.5]*30

COLLECTIVE_FIELD = [0.5] * 260
COLLECTIVE_WAVE_PHASE = [0.0] * 260
COLLECTIVE_WAVE_VELOCITY = [0.0] * 260

RUNTIME_WEATHER_CACHE = {}
RUNTIME_PRESSURE_CACHE = None
RUNTIME_FIELD_CACHE = {}

# ==========================================================
# FILES
# ==========================================================

USERS_FILE="mtos_users.json"
ATTENTION_FILE="mtos_attention_db.json"
FIELD_FILE="mtos_global_field.json"
METRICS_FILE="mtos_metrics.json"
USER_MEMORY_FILE="mtos_user_memory"

# ==========================================================
# ARCHETYPE MEMORY
# ==========================================================
SEAL_MEMORY = [0.5]*20
KIN_MEMORY = [0.5]*260
ARCHETYPE_WEIGHTS = [1.0]*20
USER_MEMORY = {}

def clamp_signed(x, lo=-1.0, hi=1.0):
    return max(lo, min(float(x), hi))

def metabolic_pressure(attention, fatigue, field, noise=0.0, conflict=0.0):
    base = (
        abs(attention - 0.5) * 0.32 +
        fatigue * 0.28 +
        abs(field - 0.5) * 0.22 +
        abs(noise) * 0.10 +
        conflict * 0.08
    )
    return clamp01(base)

def metabolic_volume(attention):
    return clamp01(attention)

def metabolic_temperature(attention, fatigue, field, wave=0.0, noise=0.0):
    t = (
        0.22 +
        attention * 0.26 +
        fatigue * 0.18 +
        abs(field - 0.5) * 0.18 +
        abs(wave) * 0.10 +
        abs(noise) * 0.06
    )
    return clamp01(t)

def metabolic_phi(pressure, volume):
    return max(0.0, float(pressure) * float(volume))

def metabolic_k(phi, temperature):
    phi = float(phi)
    temperature = float(temperature)

    raw = phi / max(temperature, 1e-6)

    return raw * 0.92

def metabolic_consistency(phi, k, temperature, pressure=0.0, stability=0.5):
    phi = float(phi)
    k = float(k)
    temperature = float(temperature)
    pressure = float(pressure)
    stability = float(stability)

    residual = abs(phi - k * temperature)
    normalized = residual / max(abs(phi), 1e-6)

    normalized += pressure * 0.18
    normalized += (1.0 - stability) * 0.22

    return min(1.0, normalized)

def metabolic_stability(consistency, pressure, temperature):
    s = 1.0 - (
        consistency * 0.50 +
        pressure * 0.25 +
        temperature * 0.25
    )
    return clamp01(s)

def update_seal_memory(seal_index,attention):

    global SEAL_MEMORY
    global ARCHETYPE_WEIGHTS

    old = SEAL_MEMORY[seal_index]

    SEAL_MEMORY[seal_index] = old*0.96 + attention*0.04

    ARCHETYPE_WEIGHTS[seal_index] += (attention - 0.5)*0.02
    ARCHETYPE_WEIGHTS[seal_index] = max(0.5,min(1.5,ARCHETYPE_WEIGHTS[seal_index]))
    
def update_kin_memory(kin,attention):

    global KIN_MEMORY

    old = KIN_MEMORY[kin-1]

    KIN_MEMORY[kin-1] = old*0.98 + attention*0.02

def reset_memory():

    global SEAL_MEMORY
    global KIN_MEMORY

    SEAL_MEMORY = [0.5]*20
    KIN_MEMORY = [0.5]*260

def update_user_memory(user_name,attention):

    global USER_MEMORY

    if user_name not in USER_MEMORY:
        USER_MEMORY[user_name] = 0.5

    old = USER_MEMORY[user_name]

    USER_MEMORY[user_name] = old*0.92 + attention*0.08

    save_user_memory(USER_MEMORY)

# ==========================================================
# TZOLKIN STRUCTURE
# ==========================================================

seals=[
    "Dragon","Wind","Night","Seed","Serpent",
    "Worldbridger","Hand","Star","Moon","Dog",
    "Monkey","Human","Skywalker","Wizard","Eagle",
    "Warrior","Earth","Mirror","Storm","Sun"
]

BASE_DATE=datetime.date(1987,7,26)
BASE_KIN=34

# GMT correlation check

def verify_correlation():

    today = datetime.datetime.now(datetime.timezone.utc).date()

    kin,_,_,_ = kin_from_date(today)

    if kin < 1 or kin > 260:
        print("WARNING: Kin calculation error")

    return kin

# ==========================================================
# KIN ENGINE
# ==========================================================

def kin_from_date(date):

    # --- правильный JDN ---
    a = (14 - date.month)//12
    y = date.year + 4800 - a
    m = date.month + 12*a - 3

    jdn = date.day + ((153*m + 2)//5) + 365*y + y//4 - y//100 + y//400 - 32045

    GMT = 584283

    kin = (jdn - GMT) % 260 + 1

    #print("JDN:", jdn, "KIN:", kin)

    tone = ((kin - 1) % 13) + 1
    seal_index = (kin - 1) % 20

    return kin, tone, seals[seal_index], seal_index

# ==========================================================
# RESONANCE FIELD
# ==========================================================

import math

def seal_resonance(a,b,day_phase=0):

    distance = abs(a-b)
    distance = min(distance, 20-distance)

    base = (1 - distance*0.05) * ARCHETYPE_WEIGHTS[b]

    angle = (a + b + day_phase) * 0.5
    wave = math.sin(angle) * 0.18

    value = base + wave

    value = (value + 0.1) / 1.2

    if value < 0:
        value = 0
    elif value > 1:
        value = 1

    return value

# ==========================================================
# TONE WAVE
# ==========================================================

def tone_wave(tone):

    phase = 2*np.pi*((tone-1)/13)

    return 0.05*np.sin(phase)

# ==========================================================
# TONE RESONANCE
# ==========================================================

def tone_resonance(user_tone,day_tone):

    if user_tone == day_tone:
        return 0.08

    if abs(user_tone - day_tone) == 1:
        return 0.04

    if abs(user_tone - day_tone) == 6:
        return -0.05

    return 0

# ==========================================================
# FATIGUE MODEL
# ==========================================================

def fatigue_step(f,a):

    f=f+a*0.05
    f=f-0.03

    return max(0,min(f,1))

# ==========================================================
# ATTENTION DYNAMICS
# ==========================================================

def attention_step(a,f,user_i,user_tone,day_i,day_tone,kin,user_name=None):

    r = seal_resonance(user_i, day_i, day_tone)

    tone_effect = tone_wave(day_tone)

    tone_sync = tone_resonance(user_tone,day_tone)

    memory = SEAL_MEMORY[day_i] - 0.5

    kin_memory = KIN_MEMORY[kin-1] - 0.5

    user_memory = USER_MEMORY.get(user_name,0.5) - 0.5 if user_name else 0

    global_field = GLOBAL_KIN_DISTRIBUTION[kin-1] - 0.5
    
    collective_field = COLLECTIVE_FIELD[kin-1] - 0.5

    contagion = np.mean(GLOBAL_ATTENTION_BUFFER) - 0.5

    if len(GLOBAL_USERS)>0:
        avg = np.mean([seal_resonance(user_i,ui,day_tone) for _,ui,_ in GLOBAL_USERS])
    else:
        avg = 0

    network_field = avg * 0.025

    noise = np.random.normal(0,0.028)

    a = (
        a*0.72 +
        r*0.18 +
        tone_effect +
        tone_sync +
        memory*0.06 +
        kin_memory*0.04 +
        user_memory*0.08 +
        global_field*0.10 +
        collective_field*0.22 +
        network_field +
        contagion*0.20 +
        noise
    )

    # Lotka–Volterra style dynamics

    alpha = 0.18
    beta = 0.28
    gamma = 0.08
    delta = 0.22

    da = alpha*a - beta*a*f
    df = -gamma*f + delta*a*f

    a = a + da
    f = f + df

    # nonlinear normalization
    a = 1/(1+safe_exp(-1.2*(a-0.5)))

    if np.isnan(a) or np.isinf(a):
        a = 0.5

    if np.isnan(f) or np.isinf(f):
        f = 0.2

    a = clamp01(a)
    f = clamp01(f)

    return a,f

# ==========================================================
# CLIMATE STATE
# ==========================================================

def climate(a):

    if a>0.72: return "FOCUS"
    if a>0.60: return "FLOW"
    if a>0.48: return "NEUTRAL"
    if a>0.36: return "FATIGUE"

    return "RECOVERY"

# ==========================================================
# USERS DATABASE (localStorage)
# ==========================================================

def load_users():
    localStorage = get_local_storage()
    data = localStorage.getItem("mtos_users")

    if data is None:
        return {}

    try:
        return json.loads(data)
    except:
        return {}


def save_users(users):
    localStorage = get_local_storage()
    localStorage.setItem(
        "mtos_users",
        json.dumps(users)
    )


def register_user(name, birth, kin, tone, seal):
    users = load_users()

    users[name] = {
        "birth": str(birth),
        "kin": kin,
        "tone": tone,
        "seal": seal
    }

    save_users(users)


def load_user_memory():
    localStorage = get_local_storage()
    data = localStorage.getItem("mtos_user_memory")

    if data is None:
        return {}

    try:
        return json.loads(data)
    except:
        return {}


def save_user_memory(mem):
    localStorage = get_local_storage()
    localStorage.setItem(
        "mtos_user_memory",
        json.dumps(mem)
    )


USER_MEMORY = load_user_memory()

# ==========================================================
# ATTENTION DATABASE
# ==========================================================

def load_attention():
    localStorage = get_local_storage()
    data = localStorage.getItem("mtos_attention")

    if data is None:
        return []

    try:
        return json.loads(data)
    except:
        return []


def save_attention(db):
    localStorage = get_local_storage()
    localStorage.setItem(
        "mtos_attention",
        json.dumps(db)
    )


def store_attention(user, date, kin, attention):
    db = load_attention()

    db.append({
        "user": user,
        "date": str(date),
        "kin": kin,
        "attention": round(float(attention), 3)
    })

    save_attention(db)


def export_experiment():
    db = load_attention()

    return json.dumps({
        "records": db,
        "count": len(db)
    })

# ==========================================================
# GLOBAL ATTENTION FIELD (Browser Storage)
# ==========================================================

def load_global_field():
    localStorage = get_local_storage()
    data = localStorage.getItem("mtos_global_field")

    if data is None:
        return {"field": [0.5] * 260}

    try:
        obj = json.loads(data)

        if obj is None:
            return {"field": [0.5] * 260}

        if "field" not in obj:
            return {"field": [0.5] * 260}

        return obj

    except:
        return {"field": [0.5] * 260}
    
def load_collective_field():
    localStorage = get_local_storage()
    data = localStorage.getItem("mtos_collective_field")

    if data is None:
        return {
            "field": [0.5] * 260,
            "phase": [0.0] * 260,
            "velocity": [0.0] * 260
        }

    try:
        obj = json.loads(data)

        field = obj.get("field", [0.5] * 260)
        phase = obj.get("phase", [0.0] * 260)
        velocity = obj.get("velocity", [0.0] * 260)

        if len(field) != 260:
            field = [0.5] * 260
        if len(phase) != 260:
            phase = [0.0] * 260
        if len(velocity) != 260:
            velocity = [0.0] * 260

        return {
            "field": field,
            "phase": phase,
            "velocity": velocity
        }
    except:
        return {
            "field": [0.5] * 260,
            "phase": [0.0] * 260,
            "velocity": [0.0] * 260
        }


def save_collective_field(field, phase, velocity):
    localStorage = get_local_storage()
    localStorage.setItem(
        "mtos_collective_field",
        json.dumps({
            "field": field,
            "phase": phase,
            "velocity": velocity
        })
    )

def update_collective_field(users, weather_map_by_user, network_feedback=None, attractor_state=None):
    global COLLECTIVE_FIELD
    global COLLECTIVE_WAVE_PHASE
    global COLLECTIVE_WAVE_VELOCITY

    if network_feedback is None:
        network_feedback = {}

    if attractor_state is None:
        attractor_state = {
            "type": "unknown",
            "intensity": 0.0
        }

    stored = load_collective_field()

    field = np.array(stored["field"], dtype=float)
    phase = np.array(stored["phase"], dtype=float)
    velocity = np.array(stored["velocity"], dtype=float)

    source = np.zeros(260, dtype=float)
    counts = np.zeros(260, dtype=float)

    for user in users:
        name = user["name"]
        kin = int(user.get("kin", 1)) - 1
        weight = float(user.get("weight", 1.0))

        weather = weather_map_by_user.get(name)
        if not weather:
            continue

        for i in range(260):
            dist = min(abs(i - kin), 260 - abs(i - kin))
            spread = np.exp(-dist / 10.0)

            att = float(weather[i]["attention"])
            act = float(weather[i]["activity"])
            pr = float(weather[i]["pressure"])
            cf = float(weather[i]["conflict"])

            value = (
                att * 0.52 +
                act * 0.18 +
                (1.0 - pr) * 0.18 +
                (1.0 - cf) * 0.12
            )

            source[i] += value * spread * weight
            counts[i] += spread * weight

    for i in range(260):
        if counts[i] > 1e-9:
            source[i] /= counts[i]
        else:
            source[i] = 0.5

    density = float(network_feedback.get("density", 0) or 0)
    mean_strength = float(network_feedback.get("meanStrength", 0) or 0)
    conflict_ratio = float(network_feedback.get("conflictRatio", 0) or 0)
    support_ratio = float(network_feedback.get("supportRatio", 0) or 0)

    source *= (1.0 + density * 0.10 + support_ratio * 0.06)
    source -= conflict_ratio * 0.06

    attractor_type = str(attractor_state.get("type", "unknown") or "unknown").lower()
    attractor_intensity = float(attractor_state.get("intensity", 0) or 0)

    if attractor_type == "chaos":
        source += np.random.normal(0, 0.03 * attractor_intensity, 260)
    elif attractor_type == "cycle":
        source += np.array([
            np.sin((2 * np.pi * i) / 20.0) * 0.035 * attractor_intensity
            for i in range(260)
        ])
    elif attractor_type == "trend":
        source += np.linspace(0, 0.05 * attractor_intensity, 260)
    elif attractor_type == "stable":
        source = source * 0.82 + np.mean(source) * 0.18

    inertia = 0.84
    field = field * inertia + source * (1.0 - inertia)

    field = np.clip(field, 0.0, 1.0)

    COLLECTIVE_FIELD = field.tolist()
    COLLECTIVE_WAVE_PHASE = phase.tolist()
    COLLECTIVE_WAVE_VELOCITY = velocity.tolist()

    save_collective_field(
        COLLECTIVE_FIELD,
        COLLECTIVE_WAVE_PHASE,
        COLLECTIVE_WAVE_VELOCITY
    )

    return COLLECTIVE_FIELD

def propagate_collective_wave(field, phase, velocity, attractor_state=None, steps=4):
    if attractor_state is None:
        attractor_state = {
            "type": "unknown",
            "intensity": 0.0
        }

    field = np.array(field, dtype=float)
    phase = np.array(phase, dtype=float)
    velocity = np.array(velocity, dtype=float)

    attractor_type = str(attractor_state.get("type", "unknown") or "unknown").lower()
    attractor_intensity = float(attractor_state.get("intensity", 0) or 0)

    base_k = 0.16
    base_damping = 0.92
    base_phase_gain = 0.05

    if attractor_type == "chaos":
        base_k += 0.03
        base_damping -= 0.05
        base_phase_gain += 0.03 * attractor_intensity
    elif attractor_type == "cycle":
        base_phase_gain += 0.05 * attractor_intensity
    elif attractor_type == "trend":
        base_k += 0.02
    elif attractor_type == "stable":
        base_damping += 0.03

    for _ in range(steps):
        next_field = field.copy()
        next_phase = phase.copy()
        next_velocity = velocity.copy()

        for i in range(260):
            left = field[(i - 1) % 260]
            right = field[(i + 1) % 260]
            center = field[i]

            laplacian = left - 2.0 * center + right

            forcing = np.sin(phase[i]) * base_phase_gain
            next_velocity[i] = velocity[i] * base_damping + laplacian * base_k + forcing
            next_field[i] = center + next_velocity[i]

            next_phase[i] = phase[i] + 0.04 + center * 0.06

        field = np.clip(next_field, 0.0, 1.0)
        phase = next_phase
        velocity = np.clip(next_velocity, -0.15, 0.15)

    return field.tolist(), phase.tolist(), velocity.tolist()

def load_weather_cache():
    localStorage = get_local_storage()
    data = localStorage.getItem("mtos_weather_cache")

    if data is None:
        return {}

    try:
        return json.loads(data)
    except:
        return {}


def save_weather_cache(cache):
    localStorage = get_local_storage()
    localStorage.setItem(
        "mtos_weather_cache",
        json.dumps(cache)
    )


def save_global_field(field):
    localStorage = get_local_storage()
    localStorage.setItem(
        "mtos_global_field",
        json.dumps(field)
    )


def global_attention(date):
    kin, _, _, _ = kin_from_date(date)
    field = load_global_field()["field"]
    return field[(kin - 1) % 260]


def update_global_field(date, value):
    kin, _, _, seal_index = kin_from_date(date)

    data = load_global_field()
    field = data["field"]

    archetype = SEAL_MEMORY[seal_index]

    field[(kin - 1) % 260] = field[(kin - 1) % 260] * 0.75 + value * 0.20 + (archetype - 0.5) * 0.05

    GLOBAL_ATTENTION_BUFFER.append(value)

    if len(GLOBAL_ATTENTION_BUFFER) > 30:
        GLOBAL_ATTENTION_BUFFER.pop(0)

    save_global_field({"field": field})
    
# ==========================================================
# LEARNING
# ==========================================================

def learning_adjust():

    db=load_attention()

    if len(db)<10:
    
        return 0

    values=[d["attention"] for d in db[-30:]]

    trend=np.mean(np.diff(values))

    if trend > 0: return 0.01
    if trend < 0: return -0.01

    return 0

def adaptive_learning():

    db=load_attention()

    if len(db)<50:
    
        return 0

    values=[d["attention"] for d in db[-50:]]

    mean=np.mean(values)
    volatility=np.std(values)

    adjust = 0

    if mean > 0.65:
        adjust += 0.01

    if volatility > 0.15:
        adjust -= 0.01

    return adjust

# ==========================================================
# COLLECTIVE WAVE
# ==========================================================

def collective_wave():

    if len(GLOBAL_USERS) == 0:
        return 0

    wave = 0

    for _,ui,ut in GLOBAL_USERS:
        wave += np.sin((ui + ut)*0.3)

    wave = wave / len(GLOBAL_USERS)

    return wave * 0.05

# ==========================================================
# SIMULATION
# ==========================================================

def simulate(user_i,user_tone,start,days,user_name=None):

    seed = (user_i * 13 + user_tone * 17 + start.toordinal()) % 2**32
    np.random.seed(int(seed))

    global GLOBAL_USERS

    if user_name and user_name not in [u[0] for u in GLOBAL_USERS]:
        GLOBAL_USERS.append((user_name,user_i,user_tone))
        GLOBAL_USERS = GLOBAL_USERS[-30:]
        save_global_users(GLOBAL_USERS)

    if user_name and np.random.rand() < 0.02:
        reset_memory()

# ограничение памяти сети
    if user_name:
        GLOBAL_USERS = GLOBAL_USERS[-30:]
        save_global_users(GLOBAL_USERS)

    learn = learning_adjust() + adaptive_learning()

    a = 0.45 + learn
    f = 0.2
    stability = 0.5
    
    series = []
    pressure_series = []
    temperature_series = []
    phi_series = []
    k_series = []
    consistency_series = []
    stability_series = []

    collective = collective_wave()

    for t in range(days):

        date = start + datetime.timedelta(days=t)

        kin,tone,seal,i = kin_from_date(date)

        a,f = attention_step(a,f,user_i,user_tone,i,tone,kin,user_name)

        if user_name:
            update_seal_memory(i,a)
            update_kin_memory(kin,a)
            update_user_memory(user_name,a)

        a = a + collective*0.04

        wave_phase = (t + user_tone) % 13
        wave = np.sin(2*np.pi*wave_phase/13)
        
        a = a + wave*0.04

        cycle260 = np.sin(2*np.pi*t/260) * 0.025
        
        a = a + cycle260

        tone_boost = (user_tone/13)*0.03
        a = a + tone_boost

        env_noise = np.random.normal(0,0.01)
        a = a + env_noise

        a = 1/(1+safe_exp(-1.5*(a-0.5)))

        field = global_attention(date)

        a = a + (field - 0.5) * 0.35

        learning = (field - 0.5) * 0.05

        a = a + learning
        
        a = safe_value(a, 0.5)
        a = clamp01(a)
        f = clamp01(f)
        
        conflict = clamp01(
            abs(field - a) * 0.55 +
            max(0.0, f - a) * 0.45
        )
        
        P = metabolic_pressure(
            attention=a,
            fatigue=f,
            field=field,
            noise=env_noise,
            conflict=conflict
        )
        
        V = metabolic_volume(a)
        
        T = metabolic_temperature(
            attention=a,
            fatigue=f,
            field=field,
            wave=wave,
            noise=env_noise
        )
        
        Phi = metabolic_phi(P, V)
        k_val = metabolic_k(Phi, T)
        consistency = metabolic_consistency(Phi, k_val, T, P, stability)
        stability = metabolic_stability(consistency, P, T)
        
        series.append(a)
        pressure_series.append(P)
        temperature_series.append(T)
        phi_series.append(Phi)
        k_series.append(k_val)
        consistency_series.append(consistency)
        stability_series.append(stability)
        
    return {
            "attention": np.array(series, dtype=float),
            "pressure": np.array(pressure_series, dtype=float),
            "temperature": np.array(temperature_series, dtype=float),
            "phi": np.array(phi_series, dtype=float),
            "k": np.array(k_series, dtype=float),
            "consistency": np.array(consistency_series, dtype=float),
            "stability": np.array(stability_series, dtype=float)
        }

# ==========================================================
# METRICS
# ==========================================================

def entropy(series):

    hist,_=np.histogram(series,bins=20,range=(0,1))
    s = np.sum(hist)

    if s == 0:

        return 0

    p = hist.astype(float) / s
    p=p[p>0]

    p = np.clip(p,1e-9,1)
    v = -np.sum(p*np.log(p))

    if np.isnan(v):

        return 0

    return float(v)

def chaos(series):

    v = np.mean(np.abs(np.diff(series)))

    if np.isnan(v):
        return 0

    return float(v)

def lyapunov(series):

    diffs=np.abs(np.diff(series))
    diffs=diffs[diffs>1e-6]

    if len(diffs)==0:

        return 0

    if diffs[0] <= 1e-9:
        return 0

    safe = diffs / max(diffs[0], 1e-9)
    safe = np.clip(safe, 1e-9, 1e9)

    v = np.mean(safe_log(safe))
    if np.isnan(v) or np.isinf(v):
        return 0

    if np.isnan(v):

        return 0

    return float(v)

def predictability(series):

    import numpy as np

    if len(series) < 5:
        return len(series)

    # ===============================
    # 1. локальные изменения
    # ===============================
    diffs = np.abs(np.diff(series))

    # сглаживание
    window = 5
    smooth = np.convolve(diffs, np.ones(window)/window, mode='valid')

    # ===============================
    # 2. энтропия (структура сигнала)
    # ===============================
    hist, _ = np.histogram(series, bins=20, range=(0,1))
    p = hist / np.sum(hist)

    p = p[p > 0]
    entropy = -np.sum(p * np.log(p))

    # нормализация (примерно 0–3)
    entropy_norm = entropy / 3.0

    # ===============================
    # 3. накопление нестабильности
    # ===============================
    instability = 0
    threshold = 0.015   # чувствительный порог

    for i, d in enumerate(smooth):

        # чем больше скачок — тем больше вклад
        instability += max(0, d - threshold)

        # если накопилось достаточно — предел предсказуемости
        if instability > 0.25:
            return i + window

    # ===============================
    # 4. fallback: через энтропию
    # ===============================
    # чем выше энтропия — тем меньше предсказуемость
    length = len(series)

    predict = int(length * (1 - entropy_norm))

    return max(5, min(length, predict))

def phase_space(series):

    points = []

    for i in range(len(series)-1):

        x = float(series[i])
        y = float(series[i+1])

        points.append({
            "x": x,
            "y": y
        })

    return points

def phase_density(series):

    grid = np.zeros((20,20))

    for i in range(len(series)-1):

        x = min(19,max(0,int(series[i]*19)))
        y = min(19,max(0,int(series[i+1]*19)))

        grid[y][x] += 1

    if np.max(grid) > 0:
        grid = grid / np.max(grid)

    return grid.flatten().tolist()

def attention_attractors(series):

    hist,_ = np.histogram(series,bins=12,range=(0,1))

    mean = np.mean(hist)
    std = np.std(hist)

    attractors = []

    for i,v in enumerate(hist):

        if v > mean + std:

            center = (i+0.5)/12
            attractors.append(float(center))

    return attractors

def detect_attractor_state(series):
    series = np.array(series, dtype=float)

    if len(series) < 12:
        return {
            "type": "unknown",
            "intensity": 0.0,
            "score": 0.0
        }

    diffs = np.diff(series)
    volatility = float(np.std(diffs))
    mean_shift = float(np.mean(diffs))
    amplitude = float(np.max(series) - np.min(series))

    centered = series - np.mean(series)
    autocorr = np.correlate(centered, centered, mode="full")
    autocorr = autocorr[len(autocorr)//2:]

    if len(autocorr) > 0 and autocorr[0] != 0:
        autocorr = autocorr / autocorr[0]

    cycle_score = 0.0
    if len(autocorr) > 8:
        cycle_score = float(np.max(autocorr[3:min(30, len(autocorr))]))

    chaos_score = volatility * 1.8 + amplitude * 0.4
    trend_score = abs(mean_shift) * 8.0 + max(0.0, amplitude - volatility)
    stable_score = max(0.0, 1.0 - volatility * 3.5 - amplitude * 0.8)

    if chaos_score > 0.22 and chaos_score > trend_score and chaos_score > cycle_score:
        kind = "chaos"
        intensity = min(1.0, chaos_score)
        score = chaos_score
    elif cycle_score > 0.55 and cycle_score > trend_score:
        kind = "cycle"
        intensity = min(1.0, cycle_score)
        score = cycle_score
    elif trend_score > 0.18:
        kind = "trend"
        intensity = min(1.0, trend_score)
        score = trend_score
    else:
        kind = "stable"
        intensity = min(1.0, max(stable_score, 0.0))
        score = stable_score

    return {
        "type": kind,
        "intensity": float(intensity),
        "score": float(score),
        "volatility": float(volatility),
        "amplitude": float(amplitude),
        "cycleScore": float(cycle_score),
        "trendScore": float(trend_score),
        "chaosScore": float(chaos_score)
    }


def build_attractor_field(weather, selected_kin=None):
    N = 260

    base = np.array([
        float(w["attention"]) * 0.55 +
        float(w["activity"]) * 0.20 +
        (1.0 - float(w["pressure"])) * 0.15 +
        (1.0 - float(w["conflict"])) * 0.10
        for w in weather
    ], dtype=float)

    base = np.clip(base, 0.0, 1.0)

    field = base.copy()
    memory = np.array(KIN_MEMORY, dtype=float)

    # память kin усиливает устойчивые зоны
    field = field * 0.72 + memory * 0.28

    # локальная диффузия
    smoothed = field.copy()
    for i in range(N):
        left = field[(i - 1) % N]
        selfv = field[i]
        right = field[(i + 1) % N]
        smoothed[i] = selfv * 0.58 + (left + right) * 0.21

    field = smoothed.copy()

    # усиление локальных максимумов
    boosted = field.copy()
    for i in range(N):
        left = field[(i - 1) % N]
        selfv = field[i]
        right = field[(i + 1) % N]

        contrast = selfv - (left + right) * 0.5
        if contrast > 0:
            boosted[i] += contrast * 0.45

    field = boosted

    # мягкая воронка вокруг выбранного kin
    if selected_kin is not None:
        idx = int(selected_kin) - 1
        for i in range(N):
            dist = min(abs(i - idx), N - abs(i - idx))
            field[i] += np.exp(-dist / 10.0) * 0.12

    min_v = float(np.min(field))
    max_v = float(np.max(field))
    rng = max(1e-9, max_v - min_v)

    field = (field - min_v) / rng
    field = np.clip(field, 0.0, 1.0)

    return field.tolist()

def tzolkin_attractor_map(user_i,user_tone,start):

    attractor_map = []

    for k in range(260):

        reset_memory()

        date = start + datetime.timedelta(days=k)

        series = simulate(user_i,user_tone,date,40)

        attractors = attention_attractors(series)

        attractor_state = detect_attractor_state(series)

        attractor_map.append({
            "kin": k+1,
            "attractors": attractors
        })

    return attractor_map

# ==========================================================
# WEB API
# ==========================================================

def run_mtos(name,year,month,day):

    verify_correlation()

    import json
    import datetime

    birth = datetime.date(year,month,day)

    kin,tone,seal,i = kin_from_date(birth)

    today = datetime.datetime.now(datetime.timezone.utc).date()

    today_kin,today_tone,today_seal,today_i = kin_from_date(today)

    series = simulate(i,tone,today,260,name)

    baseline = SEAL_MEMORY[i] + (tone/13)*0.1
    series[0] = max(0,min(1, series[0] + (baseline-0.5)*0.3))

    phase = phase_space(series)

    # attractor_map = tzolkin_attractor_map(i,tone,today)

    attractors = attention_attractors(series)

    state = climate(series[0])

    register_user(name,birth,kin,tone,seal)
    store_attention(name,today,kin,series[0])
    update_global_field(today,series[0])

    GLOBAL_KIN_DISTRIBUTION[kin-1] += 0.05
    GLOBAL_KIN_DISTRIBUTION[kin-1] = min(1, GLOBAL_KIN_DISTRIBUTION[kin-1])

    result = {
        "name":name,
        "kin":kin,
        "seal":seal,
        "tone":tone,
        "today_kin":today_kin,
        "today_seal":today_seal,
        "today_tone":today_tone,
        "attention":float(series[0]),
        "state":state,
        "entropy":entropy(series),
        "chaos":chaos(series),
        "lyapunov":lyapunov(series),
        "predictability":predictability(series),
        "attractors": attractors,
        "attractor_state": attractor_state,
        "tzolkin_attractors": [],
        "phase_space": phase,
    }

    return json.dumps(result)

def mtos_series(name,year,month,day,days=30):

    birth=datetime.date(year,month,day)
    _, tone, seal, i = kin_from_date(birth)

    today=datetime.datetime.now(datetime.timezone.utc).date()

    series=simulate(i,tone,today,days)

    return series.tolist()

def mtos_260_weather(name,year,month,day):

    global RUNTIME_WEATHER_CACHE

    today = datetime.datetime.now(datetime.timezone.utc).date()
    cache_key = f"{name}_{year}_{month}_{day}_{today.isoformat()}"

    if cache_key in RUNTIME_WEATHER_CACHE:
        return RUNTIME_WEATHER_CACHE[cache_key]

    today = datetime.datetime.now(datetime.timezone.utc).date()

    birth=datetime.date(year,month,day)
    _, tone, seal, i = kin_from_date(birth)

    # =========================
    # 1. ГЕНЕРАЦИЯ ТОЧЕК
    # =========================

    weather = [None]*260

    for k in range(1, 261, 13):
        kin_date = today + datetime.timedelta(days=k - 1)
        
        memory_backup_seal = SEAL_MEMORY.copy()
        memory_backup_kin = KIN_MEMORY.copy()
        
        np.random.seed(k)
        
        sim = simulate(i, tone, kin_date, 8, name)
        
        series = sim["attention"]
        
        value = float(np.mean(series[:3]))
        value += (series[0] - 0.5) * 0.18
        
        SEAL_MEMORY[:] = memory_backup_seal
        KIN_MEMORY[:] = memory_backup_kin
        
        spiral = np.sin(2*np.pi*(k-1)/260) * 0.03
        value += spiral
        
        if np.isnan(value):
            value = 0.5          
        value = max(0,min(value,1))         
        weather[k-1] = {
            "attention": float(value),
            "activity": float(series[0]),
            "pressure": abs(series[0] - series[1]) if len(series)>1 else 0,
            "conflict": float(np.std(series[:5]))
        }

    # =========================
    # 2. ИНТЕРПОЛЯЦИЯ
    # =========================

    full_weather = [None]*260

    for k in range(0,260):
        if weather[k] is not None:
            full_weather[k] = weather[k]

    for k in range(260):

        if full_weather[k] is None:

            left = (k // 8) * 8
            right = left + 8 if left + 8 < 260 else left

            left_val = full_weather[left]
            right_val = full_weather[right]

            if left_val and right_val and right != left:

                alpha = (k - left) / (right - left)

                full_weather[k] = {
                    "attention": float(left_val["attention"]*(1-alpha) + right_val["attention"]*alpha),
                    "activity": float(left_val["activity"]*(1-alpha) + right_val["activity"]*alpha),
                    "pressure": float(left_val["pressure"]*(1-alpha) + right_val["pressure"]*alpha),
                    "conflict": float(left_val["conflict"]*(1-alpha) + right_val["conflict"]*alpha)
                }

            elif left_val:
                full_weather[k] = left_val

            elif right_val:
                full_weather[k] = right_val

            else:
                full_weather[k] = {
                    "attention": 0.5,
                    "activity": 0.5,
                    "pressure": 0,
                    "conflict": 0
                }

    weather = full_weather
                   
    # ==========================================
    # FIELD DYNAMICS WITH TIME (NEW)
    # ==========================================

    # --- LOAD PREVIOUS FIELD (CLIMATE MEMORY) ---

    global_data = load_global_field()
    prev_field = np.array(global_data["field"])

    new_field_input = np.array([w["attention"] if w and "attention" in w else 0.5 for w in weather])

    # инерция (память системы)
    INERTIA = 0.35

    field = prev_field * INERTIA + new_field_input * (1 - INERTIA)

    def neighbors(i):
        return [
            (i - 1) % 260,
            (i + 1) % 260,
            (i - 13) % 260,
            (i + 13) % 260
        ]

    # сколько шагов "времени"
    STEPS = 3

    for step in range(STEPS):

        new_field = field.copy()

        for i in range(260):
            nb = neighbors(i)

            # --- diffusion ---
            avg = np.mean([field[j] for j in nb])
            diffusion = field[i]*0.85 + avg*0.15

            # --- flow (gradient) ---
            delta = sum((field[j] - field[i]) for j in nb)
            flow = field[i] + delta * 0.18

            # --- interaction ---
            influence = 0
            for j in nb:
                diff = field[j] - field[i]
                influence += np.tanh(diff * 3)

            influence /= len(nb)
            interaction = field[i] + influence * 0.30

            # --- combine ---
            new_val = (
                diffusion * 0.4 +
                flow * 0.3 +
                interaction * 0.3
            )

            new_field[i] = new_val

        # нормализация после шага
        field = np.clip(new_field, 0, 1)

    # ==========================================
    # APPLY BACK TO WEATHER
    # ==========================================

    for i in range(260):
        weather[i]["attention"] = float(field[i])

        nb = neighbors(i)
        gradient = np.mean([abs(field[i] - field[j]) for j in nb])

        weather[i]["pressure"] = float(
        weather[i]["pressure"]*0.5 + gradient*0.5
    )

    # --- SAVE GLOBAL FIELD (CLIMATE) ---
    field *= 0.995
    field = np.clip(field, 0.01, 0.99)
    save_global_field({
        "field": field.tolist()
    })
    
    # 🔥 ЖЁСТКАЯ ОЧИСТКА WEATHER
    
    weather = [
        w if isinstance(w, dict) and "attention" in w else {
            "attention": 0.5,
            "activity": 0.5,
            "pressure": 0,
            "conflict": 0
        }
        for w in weather
    ]

    attractor_field = build_attractor_field(weather)
    attractor_state = detect_attractor_state(
        np.array([w["attention"] for w in weather], dtype=float)
    )
    
    try:
        from js import window
        window._attractorField = attractor_field
        window.mtosAttractorState = attractor_state
        
    except:
        
        pass

    if USE_CACHE:
        cache = load_weather_cache()
        key = f"{name}_{year}_{month}_{day}_{today}"
        cache[key] = weather

        if len(cache) > 50:
            first_key = next(iter(cache))
            del cache[first_key]

        save_weather_cache(cache)

    result_weather = weather if isinstance(weather, list) else [
        {
            "attention": 0.5,
            "activity": 0.5,
            "pressure": 0,
            "conflict": 0
        } for _ in range(260)
    ]


    # runtime cache (быстрый)
    RUNTIME_WEATHER_CACHE[cache_key] = result_weather

    return result_weather

def mtos_user_climate(user_seal):

    today = datetime.datetime.now(datetime.timezone.utc).date()
    _, day_tone, _, _ = kin_from_date(today)

    matrix = np.zeros((20,20))

    for a in range(20):
        for b in range(20):

            r = seal_resonance(a,b,day_tone)

            matrix[a][b] = r

    return matrix.flatten().tolist()

def mtos_attractor_map(name,year,month,day):

    birth=datetime.date(year,month,day)
    _,tone,_,i=kin_from_date(birth)
    today=datetime.datetime.now(datetime.timezone.utc).date()
    series=simulate(i,tone,today,260)

    matrix = np.zeros((20,20))

    for i in range(len(series)-1):

        a = series[i]
        b = series[i+1]

        x = min(19,max(0,int(a*19)))
        y = min(19,max(0,int(b*19)))

        matrix[y][x] += 1

    if np.max(matrix)>0:
        matrix = matrix/np.max(matrix)

    return matrix.flatten().tolist()

def mtos_pressure_map():

    global RUNTIME_PRESSURE_CACHE

    if RUNTIME_PRESSURE_CACHE is not None:
        return RUNTIME_PRESSURE_CACHE

    matrix = np.zeros((20,13))

    a=0.55
    f=0.2

    prev=None

    for k in range(260):

        tone = ((k) % 13) + 1
        seal = (k) % 20

        np.random.seed(int(k+1))
        a,f = attention_step(a,f,seal,tone,seal,tone,k+1)

        if prev is not None:
            delta = abs(a-prev)
        else:
            delta = 0

        matrix[seal][tone-1] = delta

        prev=a

    maxv=np.max(matrix)

    if maxv>0:
        matrix = matrix/maxv

    RUNTIME_PRESSURE_CACHE = matrix.flatten().tolist()
    return RUNTIME_PRESSURE_CACHE

def pressure_at_kin(pressure_flat, kin):
    idx = kin - 1
    tone = idx % 13
    seal = idx % 20
    return float(pressure_flat[seal * 13 + tone])

def mtos_pressure_gradient():

    base = mtos_pressure_map()

    gradient = [0]*260

    prev = base[0]

    for i in range(260):

        cur = base[i]

        gradient[i] = abs(cur - prev)

        prev = cur

    matrix = np.zeros((20,13))

    for kin in range(260):

        tone = kin % 13
        seal = kin % 20

        matrix[seal][tone] = gradient[kin]

    maxv = np.max(matrix)

    if maxv > 0:
        matrix = matrix / maxv

    return matrix.flatten().tolist()

def mtos_phase_matrix():

    matrix = []

    for tone in range(13):
        
        for seal in range(20):
    
            kin = ((seal * 13) + tone) % 260 + 1
            value = np.sin(kin/260 * 2*np.pi)

            value = (value + 1) / 2
            matrix.append(float(value))

    return matrix

def mtos_wave_structure():

    today = datetime.datetime.now(datetime.timezone.utc).date()

    _,_,_,today_i = kin_from_date(today)

    matrix = np.zeros((20,13))

    a = 0.55
    f = 0.2

    today_kin,_,_,_ = kin_from_date(today)
    
    for step in range(260):

        kin = (today_kin + step -1) % 260 +1

        tone = (kin-1) % 13 + 1
        seal = (kin-1) % 20

        np.random.seed(kin)

        a,f = attention_step(
            a,f,
            seal,
            tone,
            seal,
            tone,
            kin
        )

        matrix[int(seal)][int(tone-1)] = float(a)

    return matrix.flatten().tolist()

def mtos_collective():

    db = load_attention()

    if len(db) == 0:
        result = {
            "mean": 0.5,
            "volatility": 0,
            "state": "NEUTRAL"
        }
        return json.dumps(result)

    values = [d["attention"] for d in db]

    mean = float(np.mean(values))
    std = float(np.std(values))

    if mean > 0.65:
        state = "HIGH"
    elif mean < 0.35:
        state = "LOW"
    else:
        state = "NEUTRAL"

    result = {
        "mean": mean,
        "volatility": std,
        "state": state
    }

    return json.dumps(result)

def mtos_phase_space(name,year,month,day):

    birth=datetime.date(year,month,day)
    _,tone,_,i=kin_from_date(birth)
    today=datetime.datetime.now(datetime.timezone.utc).date()
    series=simulate(i,tone,today,260)

    delay = 3
    
    xs=[]
    ys=[]

    for i in range(len(series)-delay):

        x = series[i]
        y = series[i+delay]

        xs.append(float(x))
        ys.append(float(y))

    return {
        "x":xs,
        "y":ys
    }

def mtos_phase_density(name,year,month,day):

    birth = datetime.date(year,month,day)
    _,tone,_,i = kin_from_date(birth)

    today = datetime.datetime.now(datetime.timezone.utc).date()

    np.random.seed(i*13 + tone)
    series = simulate(i,tone,today,260)
    return phase_density(series)

def mtos_user_network():

    users = load_users()

    today = datetime.datetime.now(datetime.timezone.utc).date()
    today_kin, today_tone, today_seal, today_i = kin_from_date(today)

    names = list(users.keys())
    edges = []

    localStorage = get_local_storage()
    
    locked = json.loads(localStorage.getItem("mtos_locked_relations") or "{}")
    memory = json.loads(localStorage.getItem("collective_relations_memory") or "{}")

    for i in range(len(names)):
        for j in range(i + 1, len(names)):

            a = users[names[i]]
            b = users[names[j]]

            key1 = names[i] + "->" + names[j]
            key2 = names[j] + "->" + names[i]

            # ЕСЛИ УДАЛЕНО — НЕ РИСУЕМ
            if locked.get(key1) or locked.get(key2):
                continue

            ia = seals.index(a["seal"])
            ib = seals.index(b["seal"])

            r = (seal_resonance(ia, ib) - 0.5) * 1.4

            day_effect = (
                seal_resonance(ia, today_i) +
                seal_resonance(ib, today_i)
            ) * 0.15

            tone_effect = (
                tone_resonance(a["tone"], today_tone) +
                tone_resonance(b["tone"], today_tone)
            ) * 0.1

            import random
            noise = random.gauss(0, 0.05)

            r = r + day_effect*0.5 + tone_effect*0.4 + noise

            r = r / 2

            if r >= 0.6:
                label = "STRONG SYNERGY"
            elif r >= 0.35:
                label = "COLLABORATE"
            elif r >= 0.15:
                label = "SUPPORT"
            elif r > -0.15:
                label = "NEUTRAL"
            elif r > -0.35:
                label = "TENSION"
            else:
                label = "AVOID"

            edges.append({
                "a": names[i],
                "b": names[j],
                "value": r,
                "label": label
            })

    return json.dumps(edges)
    
# ==========================================================
# GLOBAL KIN DISTRIBUTION
# ==========================================================

def mtos_global_kin_map():
    
    users = load_users()
    
    kin_counts = [0]*260
    
    for name,data in users.items():
        
        kin = data["kin"]
        
        kin_counts[kin-1] += 1
        
    return json.dumps(kin_counts)

def mtos_climate_atlas():

    today = datetime.datetime.now(datetime.timezone.utc).timetuple().tm_yday
    day_phase = today % 13

    matrix = np.zeros((20,20))

    for a in range(20):
        for b in range(20):
            matrix[a][b] = seal_resonance(a,b,day_phase)

    # НОРМАЛИЗАЦИЯ
    min_v = np.min(matrix)
    max_v = np.max(matrix)

    if max_v - min_v > 0:
        matrix = (matrix - min_v) / (max_v - min_v)

    return matrix.flatten().tolist()

def mtos_tzolkin_structure():
    
    matrix=[]
    
    for tone in range(13):
        for seal in range(20):
            
            kin = ((seal + tone*20) % 260) + 1
            value = np.sin(tone/13) + np.cos(seal/20)
            
            matrix.append(float(value))

    return matrix

def mtos_users_by_kin():

    users = load_users()

    kin_map = {i: [] for i in range(1,261)}

    for name,data in users.items():

        kin = data["kin"]
        tone = data["tone"]
        seal = data["seal"]

        kin_map[kin].append({
            "name": name,
            "kin": kin,
            "seal": seal,
            "tone": tone
        })

    return json.dumps(kin_map)

def mtos_kin_activity():

    db = load_attention()

    kin_activity = [0]*260

    for d in db[-500:]:

        kin = d["kin"]

        kin_activity[kin-1] += 1

    return json.dumps(kin_activity)

# ===============================
# GMT CORRELATION (584283)
# ===============================
def mtos_current_kin_NEW(name, year, month, day):

    import datetime

    date = datetime.date(year, month, day)

    kin, _, _, _ = kin_from_date(date)

    return kin

# ===============================
# SUMMARY BLOCK
# ===============================
def mtos_summary(name, year, month, day):

    weather = mtos_260_weather(name, year, month, day)
    pressure = mtos_pressure_map()

    # текущий kin
    kin = mtos_current_kin_NEW(name, year, month, day) - 1

    w = weather[kin]

    # простые метрики (как было раньше)
    attention = w["attention"]
    press = pressure_at_kin(pressure, kin + 1)

    noise = abs(w["conflict"] - press)
    lyapunov = (attention * press) - noise

    # состояние
    if attention > 0.6 and press < 0.4:
        state = "FLOW"
    elif press > 0.7:
        state = "PRESSURE"
    elif noise > 0.5:
        state = "CHAOS"
    else:
        state = "BALANCE"

    return {
        "state": state,
        "attention": attention,
        "pressure": press,
        "noise": noise,
        "lyapunov": lyapunov
    }
# ===============================
# EXTRACT NODE FUNCTIONS (DATA-DRIVEN)
# ===============================
def mtos_node_functions(name, year, month, day):

    weather = mtos_260_weather(name, year, month, day)
    pressure = mtos_pressure_map()

    # 20 узлов
    nodes = []

    for seal in range(20):

        att_vals = []
        press_vals = []
        noise_vals = []

        for kin in range(1, 261):

            if (kin - 1) % 20 == seal:

                w = weather[kin-1]
                p = pressure_at_kin(pressure, kin)

                att = w["attention"]
                pr = p

                noise = abs(att - pr)

                att_vals.append(att)
                press_vals.append(pr)
                noise_vals.append(noise)

        # агрегаты
        att_mean = sum(att_vals) / len(att_vals)
        press_mean = sum(press_vals) / len(press_vals)
        noise_mean = sum(noise_vals) / len(noise_vals)

        # устойчивость (простая метрика)
        stability = att_mean - noise_mean

        nodes.append({
            "seal": seal,
            "flow": att_mean,
            "pressure": press_mean,
            "noise": noise_mean,
            "stability": stability
        })

    return nodes

# ===============================
# FIELD EQUATION (Φ)
# ===============================
def mtos_field_step(name, year, month, day, prev_field=None, prev_state=None):

    import math

    weather = mtos_260_weather(name, year, month, day)
    pressure = mtos_pressure_map()

    # ===============================
    # SOURCE
    # ===============================
    source2D = [[0 for _ in range(20)] for _ in range(13)]

    for t in range(13):
        for s in range(20):

            kin = (s * 13 + t) % 260

            att = weather[kin]["attention"]
            pr = pressure_at_kin(pressure, kin + 1)

            S = 0.6 * att + 0.4 * pr
            source2D[t][s] = S

    # ===============================
    # INIT
    # ===============================
    if prev_field is None:
        field = [source2D[t][s] for t in range(13) for s in range(20)]
        state = [0 for _ in range(260)]
        return field, state

    # reshape
    prev2D = [[0]*20 for _ in range(13)]
    prevState2D = [[0]*20 for _ in range(13)]

    k = 0
    for t in range(13):
        for s in range(20):
            prev2D[t][s] = prev_field[k]
            prevState2D[t][s] = prev_state[k]
            k += 1

    # ===============================
    # PARAMETERS
    # ===============================
    D = 0.08
    decay = 0.02
    gamma = 0.5

    # hysteresis thresholds
    phi_on  = 0.6
    phi_off = 0.4

    new2D = [[0]*20 for _ in range(13)]
    newState2D = [[0]*20 for _ in range(13)]

    # ===============================
    # EVOLUTION
    # ===============================
    for t in range(13):
        for s in range(20):

            phi = prev2D[t][s]
            state = prevState2D[t][s]

            up    = prev2D[(t-1) % 13][s]
            down  = prev2D[(t+1) % 13][s]
            left  = prev2D[t][(s-1) % 20]
            right = prev2D[t][(s+1) % 20]

            laplacian = (up + down + left + right - 4 * phi)

            diffusion = D * laplacian
            source = source2D[t][s]

            nonlinear = gamma * phi * (1 - phi)

            # ===============================
            # HYSTERESIS (ключ)
            # ===============================
            if state == 0 and phi > phi_on:
                state = 1
            elif state == 1 and phi < phi_off:
                state = 0

            # влияние состояния
            hysteresis_boost = 0.25 if state == 1 else -0.1

            new_val = phi + diffusion + source - decay * phi + nonlinear + hysteresis_boost

            new2D[t][s] = new_val
            newState2D[t][s] = state

    # flatten
    field = []
    state = []

    for t in range(13):
        for s in range(20):
            field.append(new2D[t][s])
            state.append(newState2D[t][s])

    # === STABILIZE FIELD ===
    field = [safe_value(v, 0.5) for v in field]
    field = [clamp01(v) for v in field]

    return field, state

# ===============================
# MULTI-AGENT FIELD
# ===============================

# ===============================
# GOAL-DRIVEN AGENTS
# ===============================
def clamp_signed(x, lo=-1.0, hi=1.0):
    return max(lo, min(float(x), hi))

def safe_goal_name(goal):
    g = str(goal or "stability").strip().lower()

    if g in ("stability", "growth", "social", "explore"):
        return g

    return "stability"

def goal_target_profile(goal):
    g = safe_goal_name(goal)

    if g == "stability":
        return {
            "preferred_attention": 0.62,
            "preferred_pressure": 0.22,
            "preferred_conflict": 0.18,
            "preferred_field": 0.58,
            "preferred_weight_gain": 0.10
        }

    if g == "growth":
        return {
            "preferred_attention": 0.72,
            "preferred_pressure": 0.46,
            "preferred_conflict": 0.30,
            "preferred_field": 0.66,
            "preferred_weight_gain": 0.16
        }

    if g == "social":
        return {
            "preferred_attention": 0.60,
            "preferred_pressure": 0.28,
            "preferred_conflict": 0.20,
            "preferred_field": 0.62,
            "preferred_weight_gain": 0.14
        }

    # explore
    return {
        "preferred_attention": 0.58,
        "preferred_pressure": 0.38,
        "preferred_conflict": 0.26,
        "preferred_field": 0.64,
        "preferred_weight_gain": 0.12
    }

def goal_alignment_score(goal, attention, pressure, conflict, field_value, network_feedback=None):
    profile = goal_target_profile(goal)

    density = float((network_feedback or {}).get("density", 0) or 0)
    support = float((network_feedback or {}).get("supportRatio", 0) or 0)
    conflict_ratio = float((network_feedback or {}).get("conflictRatio", 0) or 0)

    a_term = 1.0 - abs(float(attention) - profile["preferred_attention"]) / 1.0
    p_term = 1.0 - abs(float(pressure) - profile["preferred_pressure"]) / 1.0
    c_term = 1.0 - abs(float(conflict) - profile["preferred_conflict"]) / 1.0
    f_term = 1.0 - abs(float(field_value) - profile["preferred_field"]) / 1.0

    score = (
        a_term * 0.34 +
        p_term * 0.24 +
        c_term * 0.18 +
        f_term * 0.24
    )

    g = safe_goal_name(goal)

    if g == "social":
        score += support * 0.12
        score -= conflict_ratio * 0.12

    elif g == "stability":
        score -= float(pressure) * 0.10
        score -= float(conflict) * 0.10

    elif g == "growth":
        score += max(0.0, float(attention) - 0.55) * 0.12
        score += min(float(pressure), 0.55) * 0.06

    elif g == "explore":
        score += density * 0.06
        score += max(0.0, float(field_value) - 0.50) * 0.10

    return clamp_signed(score, 0.0, 1.0)

def goal_feedback_label(score):
    if score >= 0.68:
        return "good"
    if score <= 0.42:
        return "bad"
    return "neutral"

def apply_goal_pull_to_field(base_field, kin, goal, goal_weight):
    g = safe_goal_name(goal)
    w = clamp01(goal_weight)

    out = base_field[:]

    for i in range(260):
        dist = min(abs(i - kin), 260 - abs(i - kin))
        local = math.exp(-dist / 11.0)

        if g == "stability":
            # мягкая, локальная, сглаживающая цель
            out[i] += 0.05 * w * local

        elif g == "growth":
            # усиливаем пики и активные зоны
            out[i] += 0.08 * w * local

        elif g == "social":
            # более широкое коллективное влияние
            out[i] += 0.06 * w * math.exp(-dist / 16.0)

        elif g == "explore":
            # толчок в более дальние зоны
            ring = math.exp(-abs(dist - 9) / 5.0)
            out[i] += 0.07 * w * ring

    return out

def mtos_multi_agents_field(
    users,
    year,
    month,
    day,
    prev_field=None,
    prev_state=None,
    locked=None,
    memory=None,
    network_feedback=None,
    attractor_state=None
):

    if locked is None:
        locked = {}

    if memory is None:
        memory = {}

    if network_feedback is None:
        network_feedback = {}

    if attractor_state is None:
        attractor_state = {
            "type": "unknown",
            "intensity": 0,
            "score": 0
        }

    density = float(network_feedback.get("density", 0) or 0)
    mean_strength = float(network_feedback.get("meanStrength", 0) or 0)
    conflict_ratio = float(network_feedback.get("conflictRatio", 0) or 0)
    support_ratio = float(network_feedback.get("supportRatio", 0) or 0)

    attractor_type = str(attractor_state.get("type", "unknown") or "unknown").lower()
    attractor_intensity = float(attractor_state.get("intensity", 0) or 0)

    import math

    base_field = [0.0 for _ in range(260)]
    new_weights = []

    kin_list = []
    state_list = []

    # ===============================
    # 1. БАЗОВЫЙ ВКЛАД + GOAL PULL
    # ===============================
    weather_cache = {}

    for user in users:

        name = user["name"]
        weight = float(user.get("weight", 1.0))
        goal = safe_goal_name(user.get("goal", "stability"))
        goal_weight = clamp01(user.get("goalWeight", 0.65))

        if name not in weather_cache:
            weather_cache[name] = mtos_260_weather(name, year, month, day)[:]

        weather = weather_cache[name]
        kin_value = int(user.get("kin", 1))
        kin = kin_value - 1

        kin_list.append(kin)

        local_field = [0.0 for _ in range(260)]

        for i in range(260):
            dist = min(abs(i - kin), 260 - abs(i - kin))
            influence = math.exp(-dist / 8.0)
            local_field[i] += weight * weather[i]["attention"] * influence

        local_field = apply_goal_pull_to_field(
            local_field,
            kin,
            goal,
            goal_weight
        )

        for i in range(260):
            base_field[i] += local_field[i]

    # ===============================
    # НОРМАЛИЗАЦИЯ БАЗОВОГО ПОЛЯ
    # ===============================
    mean_val = sum(base_field) / len(base_field)
    base_field = [v / (mean_val + 1e-6) for v in base_field]

    # ===============================
    # COLLECTIVE FIELD / WAVE
    # ===============================
    collective_field = update_collective_field(
        users,
        weather_cache,
        network_feedback=network_feedback,
        attractor_state=attractor_state
    )

    stored_collective = load_collective_field()

    wave_field, wave_phase, wave_velocity = propagate_collective_wave(
        collective_field,
        stored_collective["phase"],
        stored_collective["velocity"],
        attractor_state=attractor_state,
        steps=5
    )

    save_collective_field(
        wave_field,
        wave_phase,
        wave_velocity
    )

    for i in range(260):
        base_field[i] = (
            base_field[i] * 0.72 +
            wave_field[i] * 0.28
        )

    # ===============================
    # GLOBAL NETWORK → FIELD FEEDBACK
    # ===============================
    network_gain = 1.0
    network_gain += density * 0.18
    network_gain += mean_strength * 0.12
    network_gain += support_ratio * 0.08
    network_gain -= conflict_ratio * 0.10

    base_field = [v * network_gain for v in base_field]

    # ===============================
    # ATTRACTOR → FIELD CLIMATE
    # ===============================
    if attractor_type == "chaos":
        for i in range(260):
            jitter = np.random.normal(0, 0.05 * attractor_intensity)
            base_field[i] += jitter
            base_field[i] -= conflict_ratio * 0.06
            base_field[i] += math.sin(i * 0.37) * 0.01

    elif attractor_type == "cycle":
        for i in range(260):
            phase_wave = math.sin((2 * math.pi * i) / 20.0)
            harmonic = math.sin((2 * math.pi * i) / 13.0)
            base_field[i] += phase_wave * 0.04 * attractor_intensity
            base_field[i] += harmonic * 0.025 * attractor_intensity
            base_field[i] += support_ratio * 0.03

    elif attractor_type == "trend":
        for i in range(260):
            slope = i / 259.0
            base_field[i] += slope * 0.07 * attractor_intensity

            if i > 0:
                base_field[i] += (base_field[i] - base_field[i - 1]) * 0.08

    elif attractor_type == "stable":
        mean_base = sum(base_field) / len(base_field)
        base_field = [0.78 * v + 0.22 * mean_base for v in base_field]

    # ===============================
    # NETWORK MEMORY → FIELD FEEDBACK
    # ===============================
    for i in range(len(users)):
        for j in range(i + 1, len(users)):

            u1 = users[i]
            u2 = users[j]

            key1 = f"{u1['name']}->{u2['name']}"
            key2 = f"{u2['name']}->{u1['name']}"

            if locked.get(key1) or locked.get(key2):
                continue

            if memory.get(key1) == 0 or memory.get(key2) == 0:
                continue

            score = (
                float(memory.get(key1, 0)) +
                float(memory.get(key2, 0))
            ) / 2.0

            if abs(score) < 1e-9:
                continue

            kin_i = kin_list[i]
            kin_j = kin_list[j]

            dist = min(abs(kin_i - kin_j), 260 - abs(kin_i - kin_j))
            pair_strength = math.exp(-dist / 12.0)

            signed_feedback = score * pair_strength

            if attractor_type == "chaos":
                if signed_feedback > 0:
                    signed_feedback *= (1.0 - 0.15 * attractor_intensity)
                elif signed_feedback < 0:
                    signed_feedback *= (1.0 + 0.20 * attractor_intensity)

            elif attractor_type == "cycle":
                signed_feedback *= (1.0 + 0.10 * attractor_intensity)

            elif attractor_type == "trend":
                if abs(signed_feedback) > 0.2:
                    signed_feedback *= (1.0 + 0.12 * attractor_intensity)

            elif attractor_type == "stable":
                signed_feedback *= (1.0 - 0.06 * attractor_intensity)

            for k in range(260):
                d_i = min(abs(k - kin_i), 260 - abs(k - kin_i))
                d_j = min(abs(k - kin_j), 260 - abs(k - kin_j))

                influence = (
                    math.exp(-d_i / 6.0) +
                    math.exp(-d_j / 6.0)
                )

                base_field[k] += signed_feedback * 0.25 * influence

    # ===============================
    # 2. ДИНАМИКА ПОЛЯ (получаем state)
    # ===============================
    field, state = mtos_field_step_from_array(base_field, prev_field, prev_state)

    for kin in kin_list:
        state_list.append(state[kin])

    # ===============================
    # 3. ВЗАИМОДЕЙСТВИЯ (С ЗНАКОМ)
    # ===============================
    for i in range(len(users)):
        for j in range(i + 1, len(users)):

            u1 = users[i]
            u2 = users[j]

            key1 = f"{u1['name']}->{u2['name']}"
            key2 = f"{u2['name']}->{u1['name']}"

            if locked.get(key1) or locked.get(key2) or memory.get(key1) == 0 or memory.get(key2) == 0:
                kin_i = kin_list[i]
                kin_j = kin_list[j]

                base_field[kin_i] *= 0.2
                base_field[kin_j] *= 0.2
                continue

            kin_i = kin_list[i]
            kin_j = kin_list[j]

            w_i = float(users[i].get("weight", 1.0))
            w_j = float(users[j].get("weight", 1.0))

            state_i = state_list[i]
            state_j = state_list[j]

            dist = min(abs(kin_i - kin_j), 260 - abs(kin_i - kin_j))

            if dist > 30:
                continue

            strength = math.exp(-dist / 10.0)

            if state_i == 1 and state_j == 1:
                sign = +1.0
            elif state_i == 0 and state_j == 0:
                sign = -0.5
            else:
                sign = -1.0

            if attractor_type == "chaos":
                if sign > 0:
                    sign *= (1.0 - 0.18 * attractor_intensity)
                else:
                    sign *= (1.0 + 0.20 * attractor_intensity)

            elif attractor_type == "cycle":
                if sign > 0:
                    sign *= (1.0 + 0.12 * attractor_intensity)

            elif attractor_type == "trend":
                sign *= (1.0 + 0.08 * attractor_intensity)

            elif attractor_type == "stable":
                sign *= (1.0 - 0.05 * attractor_intensity)

            interaction = sign * w_i * w_j * strength

            for k in range(260):
                d_i = min(abs(k - kin_i), 260 - abs(k - kin_i))
                d_j = min(abs(k - kin_j), 260 - abs(k - kin_j))

                base_field[k] += interaction * 0.3 * (
                    math.exp(-d_i / 4.0) +
                    math.exp(-d_j / 4.0)
                )

    # ===============================
    # НОРМАЛИЗАЦИЯ
    # ===============================
    mean_val = sum(base_field) / len(base_field)
    base_field = [v / (mean_val + 1e-6) for v in base_field]

    base_field = [safe_value(v, 0.5) for v in base_field]
    base_field = [clamp01(v) for v in base_field]

    # ===============================
    # 4. ВТОРАЯ ДИНАМИКА (после взаимодействий)
    # ===============================
    field, state = mtos_field_step_from_array(base_field, field, state)

    # ===============================
    # 5. АДАПТИВНЫЕ ВЕСА + GOAL SCORE
    # ===============================
    for idx, user in enumerate(users):

        old_weight = float(user.get("weight", 1.0))
        kin = kin_list[idx]

        local_phi = float(field[kin])
        local_state = state[kin]

        local_weather = weather_cache.get(user["name"], None)
        local_pressure = 0.0
        local_conflict = 0.0
        local_attention = local_phi

        if local_weather and 0 <= kin < len(local_weather):
            local_attention = float(local_weather[kin]["attention"])
            local_pressure = float(local_weather[kin]["pressure"])
            local_conflict = float(local_weather[kin]["conflict"])

        goal = safe_goal_name(user.get("goal", "stability"))
        goal_weight = clamp01(user.get("goalWeight", 0.65))

        goal_score = goal_alignment_score(
            goal,
            local_attention,
            local_pressure,
            local_conflict,
            local_phi,
            network_feedback=network_feedback
        )

        boost = 1.0 + 0.40 * local_phi
        penalty = 0.7 if local_state == 0 else 1.0

        goal_gain = 1.0 + goal_score * goal_weight * goal_target_profile(goal)["preferred_weight_gain"]
        goal_penalty = 1.0

        if goal_score <= 0.42:
            goal_penalty -= 0.18 * goal_weight

        new_w = old_weight * boost * penalty * goal_gain * goal_penalty
        new_w = max(0.1, min(new_w, 3.0))

        user["goal"] = goal
        user["goalWeight"] = goal_weight
        user["goalScore"] = float(round(goal_score, 4))
        user["goalFeedback"] = goal_feedback_label(goal_score)
        user["goalState"] = {
            "attention": float(round(local_attention, 4)),
            "pressure": float(round(local_pressure, 4)),
            "conflict": float(round(local_conflict, 4)),
            "field": float(round(local_phi, 4))
        }

        new_weights.append(new_w)

    total = sum(new_weights) or 1
    new_weights = [w / total * len(users) for w in new_weights]

    for i in range(len(users)):
        users[i]["weight"] = new_weights[i]

        kin_value = int(users[i].get("kin", 1))
        users[i]["kin"] = kin_value
        users[i]["baseKin"] = int(users[i].get("baseKin", kin_value))

        users[i]["goal"] = safe_goal_name(users[i].get("goal", "stability"))
        users[i]["goalWeight"] = clamp01(users[i].get("goalWeight", 0.65))
        users[i]["goalScore"] = float(users[i].get("goalScore", 0.5))
        users[i]["goalFeedback"] = str(users[i].get("goalFeedback", "neutral"))

    field = [safe_value(v, 0.5) for v in field]
    field = [clamp01(v) for v in field]

    return field, state, users

def mtos_field_step_from_array(source_array, prev_field, prev_state):

    import math

    # reshape source
    source2D = [[0]*20 for _ in range(13)]

    k = 0
    for t in range(13):
        for s in range(20):
            source2D[t][s] = source_array[k]
            k += 1

    if prev_field is None:
        return source_array, [0]*260

    prev2D = [[0]*20 for _ in range(13)]
    prevState2D = [[0]*20 for _ in range(13)]

    k = 0
    for t in range(13):
        for s in range(20):
            prev2D[t][s] = prev_field[k]
            prevState2D[t][s] = prev_state[k]
            k += 1

    D = 0.08
    decay = 0.02
    gamma = 0.5

    phi_on = 0.6
    phi_off = 0.4

    new2D = [[0]*20 for _ in range(13)]
    newState2D = [[0]*20 for _ in range(13)]

    for t in range(13):
        for s in range(20):

            phi = prev2D[t][s]
            state = prevState2D[t][s]

            up    = prev2D[(t-1)%13][s]
            down  = prev2D[(t+1)%13][s]
            left  = prev2D[t][(s-1)%20]
            right = prev2D[t][(s+1)%20]

            laplacian = (up + down + left + right - 4*phi)

            diffusion = D * laplacian
            source = source2D[t][s]

            nonlinear = gamma * phi * (1 - phi)

            if state == 0 and phi > phi_on:
                state = 1
            elif state == 1 and phi < phi_off:
                state = 0

            hysteresis = 0.25 if state == 1 else -0.1

            new_val = phi + diffusion + source - decay*phi + nonlinear + hysteresis

            new2D[t][s] = new_val
            newState2D[t][s] = state

    field = []
    state = []

    for t in range(13):
        for s in range(20):
            field.append(new2D[t][s])
            state.append(newState2D[t][s])

    # === STABILIZE FIELD ===
    field = [safe_value(v, 0.5) for v in field]
    field = [clamp01(v) for v in field]

    return field, state
