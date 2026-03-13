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

import datetime
import numpy as np
import json
import os

np.random.seed(42)

# ==========================================================
# FILES
# ==========================================================

USERS_FILE="mtos_users.json"
ATTENTION_FILE="mtos_attention_db.json"
FIELD_FILE="mtos_global_field.json"
METRICS_FILE="mtos_metrics.json"

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

def seal_resonance(a,b):

    if b==a: return 0.30
    if b==analog(a): return 0.18
    if b==occult(a): return 0.12
    if b==antipode(a): return -0.28

    return 0

# ==========================================================
# TONE WAVE
# ==========================================================

def tone_wave(tone):

    phase=2*np.pi*(tone/13)

    return 0.06*np.cos(phase)

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

    r=seal_resonance(user_i,day_i)

    tone_effect=tone_wave(day_tone)

    a=a+r+tone_effect

    f=fatigue_step(f,a)

    a=a-f*0.07

    return max(0,min(a,1)),f

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
# DATABASE
# ==========================================================

def load_users():

    if not os.path.exists(USERS_FILE):
        return {}

    with open(USERS_FILE) as f:
        return json.load(f)

def save_users(users):

    with open(USERS_FILE,"w") as f:
        json.dump(users,f,indent=2)

def register_user(name,birth,kin,tone,seal):

    users=load_users()

    users[name]={
        "birth":str(birth),
        "kin":kin,
        "tone":tone,
        "seal":seal
    }

    save_users(users)

# ==========================================================
# ATTENTION DATABASE
# ==========================================================

def load_attention():

    if not os.path.exists(ATTENTION_FILE):
        return []

    with open(ATTENTION_FILE) as f:
        return json.load(f)

def save_attention(db):

    with open(ATTENTION_FILE,"w") as f:
        json.dump(db,f,indent=2)

def store_attention(user,date,kin,attention):

    db=load_attention()

    for d in db:

        if d["user"]==user and d["date"]==str(date):
            return

    db.append({
        "user":user,
        "date":str(date),
        "kin":kin,
        "attention":round(float(attention),3)
    })

    save_attention(db)

# ==========================================================
# GLOBAL ATTENTION FIELD
# ==========================================================

def load_global_field():

    if not os.path.exists(FIELD_FILE):
        return {"field":[0.5]*260}

    with open(FIELD_FILE) as f:
        return json.load(f)

def save_global_field(field):

    with open(FIELD_FILE,"w") as f:
        json.dump(field,f,indent=2)

def global_attention(date):

    kin,_,_,_=kin_from_date(date)
    field=load_global_field()["field"]

    return field[(kin-1)%260]

def update_global_field(date,value):

    kin,_,_,_=kin_from_date(date)

    data=load_global_field()
    field=data["field"]

    field[(kin-1)%260]=(field[(kin-1)%260]*0.9)+(value*0.1)

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

    if trend>0: return 0.01
    if trend<0: return -0.01

    return 0

def adaptive_learning():

    db=load_attention()

    if len(db)<50:
        return 0

    values=[d["attention"] for d in db[-50:]]

    mean=np.mean(values)
    volatility=np.std(values)

    adjust=0

    if mean>0.65:
        adjust+=0.01

    if volatility>0.15:
        adjust-=0.01

    return adjust

# ==========================================================
# SIMULATION
# ==========================================================

def simulate(user_i,user_tone,start,days):

    learn = learning_adjust() + adaptive_learning()

    a = 0.55 + learn
    f = 0.2

    series = []

    for t in range(days):

        date = start + datetime.timedelta(days=t)

        kin,tone,seal,i = kin_from_date(date)

        a,f = attention_step(a,f,user_i,user_tone,i,tone)

        field = global_attention(date)
        a = a + (field - 0.5) * 0.2

        series.append(a)

    return np.array(series)

# ==========================================================
# METRICS
# ==========================================================

def entropy(series):

    hist,_=np.histogram(series,bins=20,range=(0,1))
    p=hist/np.sum(hist)

    p=p[p>0]

    return float(-np.sum(p*np.log(p)))

def chaos(series):

    return float(np.std(np.diff(series)))

def lyapunov(series):

    diffs=np.abs(np.diff(series))
    diffs=diffs[diffs>0]

    if len(diffs)==0:
        return 0

    return float(np.mean(np.log(diffs)))

def predictability(series):

    diffs=np.abs(np.diff(series))

    for i,d in enumerate(diffs):

        if d>0.12:
            return i

    return len(series)

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
        "predictability":predictability(series)
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

    matrix=np.zeros((20,20))

    for u in range(20):
        for d in range(20):

            r=seal_resonance(user_seal,d)

            matrix[u][d]=0.5+r

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

    return matrix.flatten().tolist()

def mtos_phase_matrix():

    matrix=[]

    for k in range(260):

        row=[]

        for t in range(13):

            v=np.sin(k/20)+np.cos(t/13)

            row.append(float(v))

        matrix.extend(row)

    return matrix

def mtos_wave_structure():

    matrix=[]

    for t in range(13):

        for s in range(20):

            matrix.append(
                float(np.sin(t/13)+np.cos(s/20))
            )

    return matrix

def mtos_collective():

    db=load_attention()

    if len(db)<10:

        return {
            "state":"no_data"
        }

    values=[d["attention"] for d in db]

    mean=float(np.mean(values))
    std=float(np.std(values))

    if mean>0.65:
        state="HIGH"
    elif mean<0.35:
        state="LOW"
    else:
        state="NEUTRAL"

    return {
        "mean":mean,
        "volatility":std,
        "state":state
    }

def mtos_user_network():

    users=load_users()

    names=list(users.keys())

    edges=[]

    for i in range(len(names)):
        for j in range(i+1,len(names)):

            a=users[names[i]]
            b=users[names[j]]

            ia=seals.index(a["seal"])
            ib=seals.index(b["seal"])

            r=seal_resonance(ia,ib)

            edges.append({
                "a":names[i],
                "b":names[j],
                "value":r
            })

    return edges

def mtos_climate_atlas():

    matrix=np.zeros((20,20))

    for u in range(20):
        for d in range(20):

            matrix[u][d]=0.5+seal_resonance(u,d)

    return matrix.flatten().tolist()
