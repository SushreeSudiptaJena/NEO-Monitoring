from fastapi import APIRouter
from neo.service import fetch_neo_data
from neo.risk import calculate_risk

router = APIRouter(prefix="/neo", tags=["NEO"])

@router.get("/today")
def get_today_neos():
    data = fetch_neo_data("2026-02-07", "2026-02-07")
    results = []

    for date in data["near_earth_objects"]:
        for neo in data["near_earth_objects"][date]:
            approach = neo["close_approach_data"][0]

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
                "risk_score": risk_score,
                "risk_level": risk_level,
                "hazardous": neo["is_potentially_hazardous_asteroid"]
            })

    return results
