import math, httpx
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/location", tags=["location"])

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

CATEGORY_TAGS = {
    "Supermarket": '"shop"="supermarket"',
    "Grocery store": '"shop"="convenience"',
    "Pharmacy": '"amenity"="pharmacy"',
    "Restaurant": '"amenity"="restaurant"',
    "Cafe": '"amenity"="cafe"',
    "College": '"amenity"="college"',
    "School": '"amenity"="school"',
    "Office": '"office"',
    "Shopping mall": '"shop"="mall"',
    "Petrol station": '"amenity"="fuel"',
    "Bank": '"amenity"="bank"',
    "Gym": '"leisure"="fitness_centre"',
    "Library": '"amenity"="library"',
    "Hospital": '"amenity"="hospital"',
}

# Standard curated places for robust offline/demo fallbacks
FALLBACK_PLACES = [
    {"name": "Reliance Fresh Supermarket", "category": "Supermarket", "lat": 13.0072, "lng": 80.1192, "address": "Grand Trunk Rd, Chennai"},
    {"name": "Nilgiris Supermarket", "category": "Supermarket", "lat": 13.0085, "lng": 80.1170, "address": "Market Complex, Chennai"},
    {"name": "Apollo Pharmacy 24/7", "category": "Pharmacy", "lat": 13.0055, "lng": 80.1180, "address": "Hospital Road, Chennai"},
    {"name": "MedPlus Chemist", "category": "Pharmacy", "lat": 13.0090, "lng": 80.1195, "address": "Corner Avenue, Chennai"},
    {"name": "University Campus & Library", "category": "College", "lat": 13.0040, "lng": 80.1165, "address": "Academic Block A, Chennai"},
    {"name": "Gold's Fitness Gym", "category": "Gym", "lat": 13.0078, "lng": 80.1205, "address": "Fitness Hub, Chennai"},
    {"name": "Starbucks Coffee & Cafe", "category": "Cafe", "lat": 13.0062, "lng": 80.1201, "address": "Central Plaza, Chennai"},
    {"name": "Express Avenue Shopping Mall", "category": "Shopping mall", "lat": 13.0105, "lng": 80.1150, "address": "Express Way, Chennai"},
]

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # meters
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

@router.get("/search")
async def search_places(query: str, lat: float = 13.0067, lng: float = 80.1187):
    """
    Search places by text query using OpenStreetMap Nominatim with local fallback.
    """
    results = []
    try:
        url = "https://nominatim.openstreetmap.org/search"
        headers = {"User-Agent": "SmartTaskApp/2.0 (student-project@smarttask.app)"}
        params = {"q": query, "format": "json", "addressdetails": 1, "limit": 10}
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                for item in data:
                    plat = float(item["lat"])
                    plng = float(item["lon"])
                    results.append({
                        "name": item.get("display_name", "").split(",")[0],
                        "address": item.get("display_name", ""),
                        "lat": plat,
                        "lng": plng,
                        "distance_m": round(haversine(lat, lng, plat, plng)),
                    })
    except Exception:
        pass

    # Merge matched fallback places
    q_lower = query.lower()
    for fp in FALLBACK_PLACES:
        if q_lower in fp["name"].lower() or q_lower in fp["category"].lower():
            dist = round(haversine(lat, lng, fp["lat"], fp["lng"]))
            if not any(r["name"] == fp["name"] for r in results):
                results.append({
                    "name": fp["name"],
                    "address": fp["address"],
                    "lat": fp["lat"],
                    "lng": fp["lng"],
                    "distance_m": dist,
                })

    results.sort(key=lambda x: x["distance_m"])
    return {"query": query, "results": results[:12]}

@router.get("/nearby")
async def nearby(lat: float, lng: float, category: str = "Supermarket", radius: int = 2000):
    """Real Overpass API lookup for places of a category near coordinates, with fallback."""
    tag = CATEGORY_TAGS.get(category, CATEGORY_TAGS["Supermarket"])
    query = f"""
    [out:json][timeout:10];
    node[{tag}](around:{radius},{lat},{lng});
    out body {25};
    """
    data = None
    for url in OVERPASS_URLS:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, data={"data": query})
                if resp.status_code == 200:
                    data = resp.json()
                    break
        except Exception:
            continue

    places = []
    if data and "elements" in data:
        for el in data.get("elements", []):
            name = el.get("tags", {}).get("name", category)
            plat, plng = el.get("lat"), el.get("lon")
            if plat is None or plng is None: continue
            places.append({
                "name": name,
                "lat": plat,
                "lng": plng,
                "address": el.get("tags", {}).get("addr:street", f"Near {name}"),
                "distance_m": round(haversine(lat, lng, plat, plng))
            })

    # If Overpass returned few or zero places, supplement with curated places
    if len(places) < 2:
        for fp in FALLBACK_PLACES:
            if fp["category"].lower() == category.lower() or category == "All":
                dist = round(haversine(lat, lng, fp["lat"], fp["lng"]))
                places.append({
                    "name": fp["name"],
                    "lat": fp["lat"],
                    "lng": fp["lng"],
                    "address": fp["address"],
                    "distance_m": dist,
                })

    places.sort(key=lambda p: p["distance_m"])
    return {"category": category, "count": len(places), "places": places[:20]}

@router.get("/reminders", response_model=list[schemas.LocationOut])
def list_reminders(db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    return db.query(models.LocationReminder).filter(models.LocationReminder.user_id == user.id).all()

@router.put("/reminders/{rid}", response_model=schemas.LocationOut)
def update_reminder(rid: int, status_val: str, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    r = db.query(models.LocationReminder).filter(models.LocationReminder.id == rid, models.LocationReminder.user_id == user.id).first()
    if not r: raise HTTPException(404, "Location reminder not found.")
    r.status = status_val
    if status_val == "monitoring":
        r.is_inside = False
    db.commit(); db.refresh(r)
    return r

@router.post("/reminders/{rid}/reset")
def reset_reminder(rid: int, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    """Reset a triggered reminder back to monitoring and re-arm geofence."""
    r = db.query(models.LocationReminder).filter(models.LocationReminder.id == rid, models.LocationReminder.user_id == user.id).first()
    if not r: raise HTTPException(404, "Location reminder not found.")
    r.status = "monitoring"
    r.is_inside = False
    db.commit()
    return {"ok": True, "status": "monitoring"}

@router.delete("/reminders/{rid}")
def delete_reminder(rid: int, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    r = db.query(models.LocationReminder).filter(models.LocationReminder.id == rid, models.LocationReminder.user_id == user.id).first()
    if not r: raise HTTPException(404, "Location reminder not found.")
    db.delete(r); db.commit()
    return {"ok": True}

@router.post("/check")
def check_geofences(lat: float, lng: float, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    """
    CORE GEOFENCE ENGINE & FINITE STATE MACHINE:
    Evaluates every active location reminder for the user at coordinates (lat, lng).
    
    State Machine Rules (Prevents Duplicate Notifications):
    1. OUTSIDE -> INSIDE (dist <= radius and not is_inside):
       - State changes to INSIDE (is_inside = True)
       - Fires a real notification!
       - Marks reminder as triggered
       - Returns is_new_entry = True
    2. INSIDE -> INSIDE (dist <= radius and is_inside):
       - Remains inside
       - Does NOT fire duplicate notifications!
       - Returns is_new_entry = False
    3. INSIDE -> OUTSIDE (dist > radius and is_inside):
       - State changes to OUTSIDE (is_inside = False)
       - Re-arms reminder back to 'monitoring' so it can trigger next time user arrives!
    """
    triggered = []
    reminders_state = []
    reminders = db.query(models.LocationReminder).filter(
        models.LocationReminder.user_id == user.id,
        models.LocationReminder.status != "disabled"
    ).all()

    for r in reminders:
        dist = haversine(lat, lng, r.lat, r.lng)
        was_inside = bool(r.is_inside)
        is_inside_now = dist <= r.radius_m

        if is_inside_now:
            if not was_inside:
                # TRANSITION: OUTSIDE -> INSIDE
                r.is_inside = True
                r.status = "triggered"
                r.last_entered_at = datetime.utcnow()
                task = r.task
                task_title = task.title if task else "Your task"
                msg = f"📍 You're near {r.label} — \"{task_title}\" is ready!"
                note = models.Notification(user_id=user.id, task_id=r.task_id, type="location", message=msg)
                db.add(note)
                triggered.append({
                    "reminder_id": r.id,
                    "label": r.label,
                    "task_title": task_title,
                    "distance_m": round(dist),
                    "radius_m": r.radius_m,
                    "message": msg,
                    "is_new_entry": True
                })
            else:
                # ALREADY INSIDE: Suppress duplicate notification
                pass
        else:
            if was_inside:
                # TRANSITION: INSIDE -> OUTSIDE (Re-arm geofence)
                r.is_inside = False
                r.status = "monitoring"

        reminders_state.append({
            "id": r.id,
            "label": r.label,
            "distance_m": round(dist),
            "radius_m": r.radius_m,
            "is_inside": bool(r.is_inside),
            "status": r.status
        })

    db.commit()
    return {
        "current_coords": {"lat": lat, "lng": lng},
        "triggered": triggered,
        "reminders": reminders_state,
        "active_count": len(reminders)
    }
