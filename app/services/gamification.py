"""
Servicio de Gamificación — Lógica de niveles, puntos y títulos divertidos.
"""

LEVEL_NAMES = {
    1: "Aprendiz del Orden",
    2: "Guerrero del Calendario",
    3: "Mago de la Productividad",
    4: "Estratega Familiar",
    5: "Maestro del Caos Domado",
    6: "Leyenda de la Agenda",
}

def get_level_name(level: int) -> str:
    """Retorna el nombre divertido asociado a un nivel numérico."""
    return LEVEL_NAMES.get(level, LEVEL_NAMES[max(LEVEL_NAMES.keys())] if level > max(LEVEL_NAMES.keys()) else "Aprendiz del Orden")

def calculate_level_from_points(points: int) -> int:
    """Lógica simple: Subir nivel cada 100 puntos."""
    return (points // 100) + 1
