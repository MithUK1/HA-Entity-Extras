"""Entity Extras - extra entities card rows, selectable from the entity picker."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from .const import ATTR_TYPE, DOMAIN, FRONTEND_URL, ROW_TYPES, STATE_DOMAIN

FRONTEND_FILE = Path(__file__).parent / "frontend" / "entity-extras.js"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the frontend module and load it on every dashboard."""
    # cache_headers=False so the browser always asks for the current file
    await hass.http.async_register_static_paths(
        [StaticPathConfig(FRONTEND_URL, str(FRONTEND_FILE), False)]
    )

    # The version in the URL makes browsers fetch the new file after an update
    integration = await async_get_integration(hass, DOMAIN)
    add_extra_js_url(hass, f"{FRONTEND_URL}?v={integration.version}")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Publish one state per row type so they show up in the entity picker."""
    published: list[str] = []

    for row_type, (name, icon) in ROW_TYPES.items():
        entity_id = f"{STATE_DOMAIN}.{row_type}"
        hass.states.async_set(
            entity_id,
            row_type,
            {"friendly_name": name, "icon": icon, ATTR_TYPE: row_type},
        )
        published.append(entity_id)

    # Remember what was published so it can be removed again on unload
    entry.runtime_data = published
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the published states."""
    for entity_id in entry.runtime_data:
        hass.states.async_remove(entity_id)
    return True
