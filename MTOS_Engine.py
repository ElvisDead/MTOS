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
GLOBAL_USERS = []
GLOBAL_KIN_DISTRIBUTION = [0.5]*260
GLOBAL_ATTENTION_BUFFER = [0.5]*30

import datetime
import numpy as np
import json
import os

# ==========================================================
# FILES
# ==========================================================

USERS_FILE="mtos_users.json"
ATTENTION_FILE="mtos_attention_db.json"
FIELD_FILE="mtos_global_field.json"
METRICS_FILE="mtos_metrics.json"

# ==========================================================
# ARCHETYPE MEMORY
# ==========================================================
SEAL_MEMORY = [0.5]*20
KIN_MEMORY = [0.5]*260
ARCHETYPE_WEIGHTS = [1.0]*20

def update_seal_memory(seal_index,attention):

    global SEAL_MEMORY
    global ARCHETYPE_WEIGHTS

    old = SEAL_MEMORY[seal_index]

    SEAL_MEMORY[seal_index] = old*0.9 + attention*0.1

    ARCHETYPE_WEIGHTS[seal_index] += (attention - 0.5)*0.02
    ARCHETYPE_WEIGHTS[seal_index] = max(0.5,min(1.5,ARCHETYPE_WEIGHTS[seal_index]))
    
def update_kin_memory(kin,attention):

    global KIN_MEMORY

    old = KIN_MEMORY[kin-1]

    KIN_MEMORY[kin-1] = old*0.95 + attention*0.05

def reset_memory():

    global SEAL_MEMORY
    global KIN_MEMORY

    SEAL_MEMORY = [0.5]*20
    KIN_MEMORY = [0.5]*260

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

# ==========================================================
# KIN ENGINE
# ==========================================================

def kin_from_date(date):

    delta=(date-BASE_DATE).days
    kin=((BASE_KIN+delta-1)%260)+1

    tone=((kin-1)%13)+1
    seal_index=(kin-1)%20

    return kin,tone,seals[seal_index],seal_index

# ==========================================================
# TZOLKIN GEOMETRY
# ==========================================================

def analog(i): return (i+7)%20
def antipode(i): return (i+10)%20
def occult(i): return (19-i)%20

# ==========================================================
# RESONANCE FIELD
# ==========================================================

import math

def seal_resonance(a,b,day_phase=0):

    distance = abs(a-b)

    base = (1 - distance/20) * ARCHETYPE_WEIGHTS[b]

    wave = math.sin((a+b+day_phase)*0.5)*0.35

    value = base + wave

    value = (value + 0.2) / 1.4

    value = max(0, min(value, 1))

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

def attention_step(a,f,user_i,user_tone,day_i,day_tone):

    r = seal_resonance(user_i, day_i, day_tone)

    tone_effect = tone_wave(day_tone)

    tone_sync = tone_resonance(user_tone,day_tone)

    memory = SEAL_MEMORY[day_i] - 0.5

    kin_memory = KIN_MEMORY[(day_i*13 + day_tone - 1) % 260] - 0.5

    global_field = GLOBAL_KIN_DISTRIBUTION[(day_i*13 + day_tone - 1) % 260] - 0.5

    network_field = 0
    contagion = np.mean(GLOBAL_ATTENTION_BUFFER) - 0.5
    for ui, ut in GLOBAL_USERS:
        network_field += seal_resonance(user_i,ui,day_tone)*0.02

    noise = np.random.normal(0,0.03)

    a = (
        a*0.82 +
        r*0.18 +
        tone_effect +
        tone_sync +
        memory*0.06 +
        kin_memory*0.04 +
        global_field*0.05 +
        network_field +
        contagion*0.06 +
        noise
    )

    # Lotka–Volterra style dynamics

    da = 0.12*a - 0.18*a*f
    df = -0.05*f + 0.12*a*f

    a = a + da
    f = f + df

    # nonlinear normalization
    a = 1/(1+np.exp(-4*(a-0.5)))
    f = max(0,min(f,1))

    return a,f

# ==========================================================
# CLIMATE STATE
# ==========================================================

def climate(a):

    if a>0.8: return "FOCUS"
    if a>0.65: return "FLOW"
    if a>0.45: return "NEUTRAL"
    if a>0.3: return "FATIGUE"

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

    kin,_,_,_ = kin_from_date(date)

    data = load_global_field()
    field = data["field"]

    field[(kin-1)%260] = field[(kin-1)%260]*0.9 + value*0.1

    GLOBAL_ATTENTION_BUFFER.append(value)

    if len(GLOBAL_ATTENTION_BUFFER) > 30:
        GLOBAL_ATTENTION_BUFFER.pop(0)

    save_global_field({"field":field})
    
# ==========================================================
# LEARNING
# ==========================================================

def learning_adjust():

    db=load_attention()

    if len(db)<30:
    
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

    for ui,ut in GLOBAL_USERS:
        wave += np.sin((ui + ut)*0.3)

    wave = wave / len(GLOBAL_USERS)

    return wave * 0.05

# ==========================================================
# SIMULATION
# ==========================================================

def simulate(user_i,user_tone,start,days):

    if (user_i,user_tone) not in GLOBAL_USERS:
        GLOBAL_USERS.append((user_i,user_tone))

    learn = learning_adjust() + adaptive_learning()

    a = 0.45 + learn
    f = 0.2

    series = []

    wave = collective_wave()

    for t in range(days):

        date = start + datetime.timedelta(days=t)

        kin,tone,seal,i = kin_from_date(date)

        a,f = attention_step(a,f,user_i,user_tone,i,tone)

        update_seal_memory(i,a)
        update_kin_memory(kin,a)

        a = a + wave*0.07

        a = a + np.sin(2*np.pi*t/13)*0.02

        env_noise = np.random.normal(0,0.01)
        a = a + env_noise

        a = 1/(1+np.exp(-4*(a-0.5)))

        field = global_attention(date)

        a = a + (field - 0.5) * 0.2

        learning = (field - 0.5) * 0.05

        a = a + learning

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

    p = hist / s
    p=p[p>0]

    v = -np.sum(p*np.log(p))

    if np.isnan(v):

        return 0

    return float(v)

def chaos(series):

    v = np.std(np.diff(series))

    if np.isnan(v):

        return 0

    return float(v)

def lyapunov(series):

    diffs=np.abs(np.diff(series))
    diffs=diffs[diffs>0]

    if len(diffs)==0:

        return 0

    v = np.mean(np.log(diffs))

    if np.isnan(v):

        return 0

    return float(v)

def predictability(series):

    diffs=np.abs(np.diff(series))

    for i,d in enumerate(diffs):

        if d>0.12:

            return i

    return len(series)

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

def attention_attractors(series):

    hist,_ = np.histogram(series,bins=12,range=(0,1))

    mean = np.mean(hist)

    attractors = []

    for i,v in enumerate(hist):

        if v > mean*1.3:

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

    import json
    import datetime

    birth = datetime.date(year,month,day)

    kin,tone,seal,i = kin_from_date(birth)

    today = datetime.date.today()

    today_kin,today_tone,today_seal,today_i = kin_from_date(today)

    series = simulate(i,tone,today,260)

    phase = phase_space(series)

    attractor_map = tzolkin_attractor_map(i,tone,today)

    attractors = attention_attractors(series)

    state = climate(series[0])

    register_user(name,birth,kin,tone,seal)
    store_attention(name,today,kin,series[0])
    update_global_field(today,series[0])

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
        "tzolkin_attractors": attractor_map,
        "phase_space": phase,
    }

    return json.dumps(result)

def mtos_series(name,year,month,day,days=30):

    birth=datetime.date(year,month,day)

    kin,tone,seal,i=kin_from_date(birth)

    today=datetime.date.today()

    series=simulate(i,tone,today,days)

    return series.tolist()

def mtos_260_weather(name,year,month,day):

    birth=datetime.date(year,month,day)

    kin,tone,seal,i=kin_from_date(birth)

    today=datetime.date.today()

    series=simulate(i,tone,today,260)

    return series.tolist()

def mtos_user_climate(user_seal):

    today = datetime.date.today()
    _, day_tone, _, day_i = kin_from_date(today)

    matrix = np.zeros((20,20))

    for u in range(20):
        for d in range(20):

            r = seal_resonance(user_seal, d, day_tone)

            matrix[u][d] = r

    return matrix.flatten().tolist()

def mtos_attractor_map():

    matrix=np.zeros((20,20))

    for us in range(20):
        
        for ds in range(20):

            total=0

            for ut in range(13):
        
                for dt in range(13):

                    a=0.55
                    f=0.2

                    for _ in range(40):

                        a,f=attention_step(
                        a,f,
                        us,ut+1,
                        ds,dt+1
                        )

                    total+=a

                matrix[us][ds]=total/(13*13)
                
    min_v = np.min(matrix)
    max_v = np.max(matrix)
                
    if max_v - min_v > 0:
        matrix = (matrix - min_v) / (max_v - min_v)

    return matrix.flatten().tolist()

def mtos_phase_matrix():

    matrix = []

    for tone in range(13):
        
        for seal in range(20):
    
            kin = tone*20 + seal
            value = np.sin(kin/260 * 2*np.pi)

            value = (value + 1) / 2
            matrix.append(float(value))

    return matrix

def mtos_wave_structure():

    matrix=[]

    for t in range(13):

        for s in range(20):

            value = np.sin(t/13) + np.cos(s/20)
            value = (value + 2) / 4
            matrix.append(float(value))

    return matrix

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

def mtos_user_network():

    users = load_users()

    today = datetime.date.today()
    today_kin, today_tone, today_seal, today_i = kin_from_date(today)

    names = list(users.keys())

    edges = []

    for i in range(len(names)):
        for j in range(i + 1, len(names)):

            a = users[names[i]]
            b = users[names[j]]

            ia = seals.index(a["seal"])
            ib = seals.index(b["seal"])

            r = seal_resonance(ia, ib)

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

            r = r + day_effect + tone_effect + noise

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

    today = datetime.datetime.utcnow().timetuple().tm_yday
    day_phase = today % 13

    matrix = np.zeros((20,20))

    for u in range(20):
        for d in range(20):
            matrix[u][d] = seal_resonance(u,d,day_phase)

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
            
            kin = (tone + seal*13) % 260
            value = np.sin(tone/13) + np.cos(seal/20)
            
            matrix.append(float(value))

    return matrix
