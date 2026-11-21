"""Entity Extras - extra entities card rows, selectable from the entity picker."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from .const import DOMAIN, FRONTEND_URL, PLATFORMS

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
    """Add the row entities."""
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the row entities."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
