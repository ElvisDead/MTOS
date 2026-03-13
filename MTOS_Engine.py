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
# ADAPTIVE LEARNING
# ==========================================================

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


# ==========================================================
# WEB API
# ==========================================================

def run_mtos(name,year,month,day):

    birth=datetime.date(year,month,day)

    kin,tone,seal,i=kin_from_date(birth)

    today=datetime.date.today()

    today_kin,today_tone,today_seal,today_i=kin_from_date(today)

    series=simulate(i,tone,today,30)

    state=climate(series[0])

    return f"""
MTOS RESULT

Name: {name}
Birth: {year}-{month}-{day}

Kin: {kin}
Seal: {seal}
Tone: {tone}

Today:
Kin {today_kin}
Seal {today_seal}
Tone {today_tone}

Current cognitive state:
{state}

Attention level:
{round(float(series[0]),3)}
"""

def mtos_series(name,year,month,day):

    birth=datetime.date(year,month,day)

    kin,tone,seal,i=kin_from_date(birth)

    today=datetime.date.today()

    series=simulate(i,tone,today,30)

    return series.tolist()
