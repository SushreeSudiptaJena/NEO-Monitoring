from datetime import date

import requests
from fastapi import APIRouter, HTTPException
from neo.service import fetch_neo_data, fetch_neo_lookup
from neo.risk import calculate_risk

router = APIRouter(prefix="/neo", tags=["NEO"])


def _choose_nearest_approach_within_window(approaches: list, start_d: date, end_d: date):
    chosen = None
    chosen_date = None
    for a in approaches:
        ds = a.get("close_approach_date")
        if not ds:
            continue
        try:
            d = date.fromisoformat(ds)
        except ValueError:
            continue

        if d < start_d or d > end_d:
            continue
        if chosen_date is None or d < chosen_date:
            chosen = a
            chosen_date = d
    return chosen

@router.get("/today")
def get_today_neos(start_date: str | None = None, end_date: str | None = None):
    today = date.today().isoformat()
    start = start_date or today
    end = end_date or start

    # Parse once for robust comparisons.
    try:
        start_d = date.fromisoformat(start)
        end_d = date.fromisoformat(end)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    try:
        data = fetch_neo_data(start, end)
    except requests.exceptions.HTTPError as e:
        status = getattr(e.response, "status_code", None)
        if status == 429:
            raise HTTPException(
                status_code=429,
                detail="NASA API rate limit reached (429). Set a real `NASA_API_KEY` in docker-compose/.env and retry.",
            )
        raise HTTPException(status_code=502, detail="Failed to fetch NASA NEO feed")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=502, detail="Failed to reach NASA NEO feed")

    results = []

    for date_key in data["near_earth_objects"]:
        for neo in data["near_earth_objects"][date_key]:
            approaches = neo.get("close_approach_data") or []
            if not approaches:
                # Skip malformed items.
                continue

            approach = _choose_nearest_approach_within_window(approaches, start_d, end_d) or approaches[0]

            diameter = neo["estimated_diameter"]["kilometers"]["estimated_diameter_max"]
            velocity = float(approach["relative_velocity"]["kilometers_per_second"])
            miss_distance = float(approach["miss_distance"]["kilometers"])

            risk_score, risk_level = calculate_risk(
                diameter, velocity, miss_distance
            )

            results.append({
                "id": neo["id"],
                "name": neo["name"],
                "diameter_km": diameter,
                "velocity_km_s": velocity,
                "miss_distance_km": miss_distance,
                "close_approach_date": approach.get("close_approach_date"),
                "risk_score": risk_score,
                "risk_level": risk_level,
                "hazardous": neo["is_potentially_hazardous_asteroid"]
            })

    return results


@router.get("/lookup/{neo_id}")
def lookup_neo(neo_id: str, start_date: str | None = None, end_date: str | None = None):
    today = date.today().isoformat()
    start = start_date or today
    end = end_date or start

    try:
        start_d = date.fromisoformat(start)
        end_d = date.fromisoformat(end)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    try:
        neo = fetch_neo_lookup(neo_id)
    except requests.exceptions.HTTPError as e:
        status = getattr(e.response, "status_code", None)
        if status == 429:
            raise HTTPException(
                status_code=429,
                detail="NASA API rate limit reached (429). Set a real `NASA_API_KEY` in docker-compose/.env and retry.",
            )
        if status == 404:
            raise HTTPException(status_code=404, detail="NEO not found")
        raise HTTPException(status_code=502, detail="Failed to fetch NASA NEO lookup")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=502, detail="Failed to reach NASA NEO lookup")

    approaches = neo.get("close_approach_data") or []
    approach = _choose_nearest_approach_within_window(approaches, start_d, end_d) or (approaches[0] if approaches else None)

    diameter = None
    try:
        diameter = neo["estimated_diameter"]["kilometers"]["estimated_diameter_max"]
    except Exception:
        diameter = None

    velocity = None
    miss_distance = None
    close_approach_date = None
    if approach:
        close_approach_date = approach.get("close_approach_date")
        try:
            velocity = float(approach["relative_velocity"]["kilometers_per_second"])
        except Exception:
            velocity = None
        try:
            miss_distance = float(approach["miss_distance"]["kilometers"])
        except Exception:
            miss_distance = None

    risk_score = None
    risk_level = None
    if diameter is not None and velocity is not None and miss_distance is not None:
        risk_score, risk_level = calculate_risk(diameter, velocity, miss_distance)

    return {
        "id": neo.get("id"),
        "name": neo.get("name"),
        "nasa_jpl_url": neo.get("nasa_jpl_url"),
        "hazardous": neo.get("is_potentially_hazardous_asteroid"),
        "diameter_km": diameter,
        "close_approach_date": close_approach_date,
        "velocity_km_s": velocity,
        "miss_distance_km": miss_distance,
        "risk_score": risk_score,
        "risk_level": risk_level,
    }
