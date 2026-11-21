"""Sensor entities for Entity Extras, one per row type."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import ATTR_TYPE, DOMAIN, ROW_TYPES


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add one entity for each row type."""
    async_add_entities(
        EntityExtrasRow(row_type, name, icon)
        for row_type, (name, icon) in ROW_TYPES.items()
    )


class EntityExtrasRow(SensorEntity):
    """An entity that stands in for an Entities card row type.

    It does nothing by itself. The frontend module reads the ee_type attribute
    and draws the matching row whenever the entity is added to an Entities card.
    """

    # The state never changes, so there is nothing to poll
    _attr_should_poll = False

    def __init__(self, row_type: str, name: str, icon: str) -> None:
        """Set up the entity for one row type."""
        self._row_type = row_type
        self._attr_unique_id = f"{DOMAIN}_{row_type}"
        self._attr_name = name
        self._attr_icon = icon
        self._attr_native_value = row_type

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Tell the frontend module which row to draw."""
        return {ATTR_TYPE: self._row_type}
