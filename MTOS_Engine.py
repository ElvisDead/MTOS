print("MTOS ENGINE NEW VERSION")
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

def load_global_users():

    from js import localStorage

    data = localStorage.getItem("mtos_global_users")

    if data is None:
        return []

    try:
        return json.loads(data)
    except:
        return []

def save_global_users(users):

    from js import localStorage

    localStorage.setItem(
        "mtos_global_users",
        json.dumps(users)
    )

import datetime
import numpy as np
import json
import os
import time

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

    print("GMT ACTIVE")

    # --- Gregorian → Julian Day Number ---
    jdn = date.toordinal() + 1721424.5

    # --- GMT correlation ---
    GMT = 584283

    kin = int((jdn - GMT) % 260) + 1

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

    contagion = np.mean(GLOBAL_ATTENTION_BUFFER) - 0.5

    if len(GLOBAL_USERS)>0:
        avg = np.mean([seal_resonance(user_i,ui,day_tone) for _,ui,_ in GLOBAL_USERS])
    else:
        avg = 0

    network_field = avg * 0.025

    noise = np.random.normal(0,0.015)

    a = (
        a*0.72 +
        r*0.18 +
        tone_effect +
        tone_sync +
        memory*0.06 +
        kin_memory*0.04 +
        user_memory*0.08 +
        global_field*0.15 +
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

from js import localStorage

def load_users():

    data = localStorage.getItem("mtos_users")

    if data is None:
    
        return {}

    return json.loads(data)

def save_users(users):

    localStorage.setItem(
    "mtos_users",
    json.dumps(users)
    )


def register_user(name,birth,kin,tone,seal):

    users = load_users()

    users[name] = {
    "birth": str(birth),
    "kin": kin,
    "tone": tone,
    "seal": seal
    }

    save_users(users)

def load_user_memory():

    data = localStorage.getItem("mtos_user_memory")

    if data is None:
        return {}

    try:
        return json.loads(data)
    except:
        return {}

def save_user_memory(mem):

    localStorage.setItem(
        "mtos_user_memory",
        json.dumps(mem)
    )

USER_MEMORY = load_user_memory()

# ==========================================================
# ATTENTION DATABASE
# ==========================================================

def load_attention():

    data = localStorage.getItem("mtos_attention")

    if data is None:

        return []
        
    return json.loads(data)

def save_attention(db):

    localStorage.setItem(
    "mtos_attention",
    json.dumps(db)
    )

def store_attention(user,date,kin,attention):

    db=load_attention()

    db.append({
    "user":user,
    "date":str(date),
    "kin":kin,
    "attention":round(float(attention),3)
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

    data = localStorage.getItem("mtos_global_field")

    if data is None:
        return {"field":[0.5]*260}

    try:
        obj = json.loads(data)

        if obj is None:
            return {"field":[0.5]*260}

        if "field" not in obj:
            return {"field":[0.5]*260}

        return obj

    except:
        return {"field":[0.5]*260}

def load_weather_cache():

    from js import localStorage
    import json

    data = localStorage.getItem("mtos_weather_cache")

    if data is None:
        return {}

    try:
        return json.loads(data)
    except:
        return {}


def save_weather_cache(cache):

    from js import localStorage
    import json

    localStorage.setItem(
        "mtos_weather_cache",
        json.dumps(cache)
    )

def save_global_field(field):

    localStorage.setItem(
        "mtos_global_field",
        json.dumps(field)
    )

def global_attention(date):

    kin,_,_,_=kin_from_date(date)
    field=load_global_field()["field"]

    return field[(kin-1)%260]

def update_global_field(date,value):

    kin,_,_,seal_index = kin_from_date(date)

    data = load_global_field()
    field = data["field"]

    archetype = SEAL_MEMORY[seal_index]

    field[(kin-1)%260] = field[(kin-1)%260]*0.75 + value*0.20 + (archetype-0.5)*0.05

    GLOBAL_ATTENTION_BUFFER.append(value)

    if len(GLOBAL_ATTENTION_BUFFER) > 30:
        GLOBAL_ATTENTION_BUFFER.pop(0)

    save_global_field({"field":field})
    
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
    
    series = []

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
        series.append(a)

    return np.array(series)

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

def tzolkin_attractor_map(user_i,user_tone,start):

    attractor_map = []

    for k in range(260):

        reset_memory()

        date = start + datetime.timedelta(days=k)

        series = simulate(user_i,user_tone,date,40)

        attractors = attention_attractors(series)

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
        "tzolkin_attractors": [],
        "phase_space": phase,
    }

    return json.dumps(result)

def mtos_series(name,year,month,day,days=30):

    birth=datetime.date(year,month,day)

    kin,tone,seal,i=kin_from_date(birth)

    today=datetime.datetime.now(datetime.timezone.utc).date()

    series=simulate(i,tone,today,days)

    return series.tolist()

def mtos_260_weather(name,year,month,day):

    today = datetime.datetime.now(datetime.timezone.utc).date()

    if USE_CACHE:
        cache = load_weather_cache()
        key = f"{name}_{today}"

        if key in cache:
            return cache[key]

    birth=datetime.date(year,month,day)

    kin,tone,seal,i=kin_from_date(birth)

    today=datetime.datetime.now(datetime.timezone.utc).date()

    weather = [0]*260

    for kin in range(1,261):

        

        kin_date = today + datetime.timedelta(days=kin-1)

        memory_backup_seal = SEAL_MEMORY.copy()
        memory_backup_kin = KIN_MEMORY.copy()

        np.random.seed(kin)
        series = simulate(i,tone,kin_date,30,name)

        SEAL_MEMORY[:] = memory_backup_seal
        KIN_MEMORY[:] = memory_backup_kin

        value = float(np.mean(series[:7]))

        value += (series[0] - 0.5) * 0.3

        spiral = np.sin(2*np.pi*(kin-1)/260) * 0.03

        value = value + spiral

        if np.isnan(value):
            value = 0.5
        value = max(0,min(value,1))

        weather[kin-1] = {
            "attention": float(np.mean(series[:7])),
            "activity": float(series[0]),
            "pressure": abs(series[0] - series[1]) if len(series)>1 else 0,
            "conflict": float(np.std(series[:5]))
        }

    if USE_CACHE:

        cache[key] = weather

        # ограничение размера
        if len(cache) > 50:
            cache.pop(next(iter(cache)))

        save_weather_cache(cache)

    # ==========================================
    # FIELD DYNAMICS WITH TIME (NEW)
    # ==========================================

    # --- LOAD PREVIOUS FIELD (CLIMATE MEMORY) ---

    global_data = load_global_field()
    prev_field = np.array(global_data["field"])

    new_field_input = np.array([w["attention"] for w in weather])

    # инерция (память системы)
    INERTIA = 0.6

    field = prev_field * INERTIA + new_field_input * (1 - INERTIA)

    def neighbors(i):
        return [
            (i - 1) % 260,
            (i + 1) % 260,
            (i - 13) % 260,
            (i + 13) % 260
        ]

    # сколько шагов "времени"
    STEPS = 4

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

        if field[i] > 0.58:
            print(f"PEAK Kin {i+1}: {round(field[i],3)}")

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

    return weather

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

    return matrix.flatten().tolist()

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

    for i in range(len(names)):
        for j in range(i + 1, len(names)):

            a = users[names[i]]
            b = users[names[j]]

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

import datetime

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
    press = pressure[kin]

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
                p = pressure[kin-1]

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
            pr = pressure[kin]

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
def mtos_multi_agents_field(users, year, month, day, prev_field=None, prev_state=None):

    import math

    base_field = [0.0 for _ in range(260)]
    new_weights = []

    kin_list = []
    state_list = []

    # ===============================
    # 1. БАЗОВЫЙ ВКЛАД
    # ===============================
    for user in users:

        name = user["name"]
        weight = user.get("weight", 1.0)

        weather = mtos_260_weather(name, year, month, day)
        kin = mtos_current_kin_NEW(name, year, month, day) - 1

        kin_list.append(kin)

        for i in range(260):

            dist = min(abs(i - kin), 260 - abs(i - kin))
            influence = math.exp(-dist / 8.0)

            base_field[i] += weight * weather[i]["attention"] * influence

    # нормализация
    max_val = max(base_field) or 1
    base_field = [v / max_val for v in base_field]

    # ===============================
    # 2. ДИНАМИКА ПОЛЯ (получаем state)
    # ===============================
    field, state = mtos_field_step_from_array(base_field, prev_field, prev_state)

    # собираем состояния агентов
    for kin in kin_list:
        state_list.append(state[kin])

    # ===============================
    # 3. ВЗАИМОДЕЙСТВИЯ (С ЗНАКОМ)
    # ===============================
    for i in range(len(users)):
        for j in range(i+1, len(users)):

            kin_i = kin_list[i]
            kin_j = kin_list[j]

            w_i = users[i].get("weight", 1.0)
            w_j = users[j].get("weight", 1.0)

            state_i = state_list[i]
            state_j = state_list[j]

            dist = min(abs(kin_i - kin_j), 260 - abs(kin_i - kin_j))
            strength = math.exp(-dist / 10.0)

            # ===============================
            # ЗНАК (КЛЮЧ)
            # ===============================
            if state_i == 1 and state_j == 1:
                sign = +1.0      # синергия
            elif state_i == 0 and state_j == 0:
                sign = -0.5      # хаос
            else:
                sign = -1.0      # конфликт

            interaction = sign * w_i * w_j * strength

            # распространяем влияние
            for k in range(260):

                d_i = min(abs(k - kin_i), 260 - abs(k - kin_i))
                d_j = min(abs(k - kin_j), 260 - abs(k - kin_j))

                base_field[k] += interaction * (
                    math.exp(-d_i / 6.0) +
                    math.exp(-d_j / 6.0)
                )

    # ===============================
    # НОРМАЛИЗАЦИЯ
    # ===============================
    max_val = max(base_field) or 1
    base_field = [v / max_val for v in base_field]

    # ===============================
    # 4. ВТОРАЯ ДИНАМИКА (после взаимодействий)
    # ===============================
    field, state = mtos_field_step_from_array(base_field, field, state)

    # ===============================
    # 5. АДАПТИВНЫЕ ВЕСА
    # ===============================
    for idx, user in enumerate(users):

        old_weight = user.get("weight", 1.0)
        kin = kin_list[idx]

        local_phi = field[kin]
        local_state = state[kin]

        boost = 1.0 + 0.5 * local_phi
        penalty = 0.7 if local_state == 0 else 1.0

        new_w = old_weight * boost * penalty
        new_w = max(0.1, min(new_w, 3.0))

        new_weights.append(new_w)

    total = sum(new_weights) or 1
    new_weights = [w / total * len(users) for w in new_weights]

    for i in range(len(users)):
        users[i]["weight"] = new_weights[i]

    # === STABILIZE FIELD ===
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
