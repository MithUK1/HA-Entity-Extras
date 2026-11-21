"""Constants for Entity Extras."""

from __future__ import annotations

from homeassistant.const import Platform

DOMAIN = "entity_extras"

# The rows are offered as sensor entities
PLATFORMS: list[Platform] = [Platform.SENSOR]

# Row types offered as entities: type -> (display name, picker icon)
ROW_TYPES: dict[str, tuple[str, str]] = {
    "divider": ("Divider", "mdi:minus"),
    "spacer": ("Spacer", "mdi:arrow-expand-vertical"),
    "section": ("Section", "mdi:format-title"),
    "weblink": ("Web link", "mdi:link-variant"),
}

# State attribute the frontend module reads to decide how to draw a row
ATTR_TYPE = "ee_type"

# Where the frontend module is served from
FRONTEND_URL = "/entity_extras/entity-extras.js"
