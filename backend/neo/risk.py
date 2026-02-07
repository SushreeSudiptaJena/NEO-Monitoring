def calculate_risk(diameter_km, velocity_km_s, miss_distance_km):
    score = (
        (diameter_km * 30) +
        (velocity_km_s * 5) -
        (miss_distance_km / 1_000_000)
    )

    score = max(0, min(100, score))

    if score < 20:
        level = "Safe"
    elif score < 50:
        level = "Moderate"
    elif score < 75:
        level = "High Risk"
    else:
        level = "Critical"

    return score, level
