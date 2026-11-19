/*
 * Entity Extras - frontend module
 *
 * The integration publishes entities (ee.divider, ee.spacer, ...) that carry
 * an "ee_type" attribute. When an Entities card is given one of them, this
 * module swaps the entity row for the matching row type, so picking "Divider"
 * from the entity list is the same as writing "- type: divider" in YAML.
 *
 * Section and web link rows are set up from the row's pencil dialog: the text
 * lives in the row's "name" and the web address in a "url" tap action.
 */

const ATTR_TYPE = "ee_type";

// Browsers offer saved logins and past searches in boxes they take for login or
// search fields. An unrecognised autocomplete value is the one setting they all
// leave alone, so it is used on every box this module adds.
const NO_AUTOFILL = { text: { autocomplete: "nope" } };

// The latest hass object, read from the root Home Assistant element
const getHass = () => document.querySelector("home-assistant")?.hass;

// The Entity Extras type of an entity ("divider", "section", ...) or undefined
const getRowType = (entityId) =>
  getHass()?.states?.[entityId]?.attributes?.[ATTR_TYPE];

/* ------------------------------------------------------------------------ */
/* Spacer row                                                               */
/* ------------------------------------------------------------------------ */

// Spacer is not a built-in row type, so it is drawn as a small empty row
class EntityExtrasSpacerRow extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.style.display = "block";
    this.style.height = "16px";
  }

  // The card passes hass to every row, a spacer has nothing to do with it
  set hass(_hass) {}
}

if (!customElements.get("ee-spacer-row")) {
  customElements.define("ee-spacer-row", EntityExtrasSpacerRow);
}

/* ------------------------------------------------------------------------ */
/* Swapping entity rows for real row types                                  */
/* ------------------------------------------------------------------------ */

// The name typed on the row, or the entity's own name when none is set
const getRowName = (row, entityId) =>
  typeof row?.name === "string" && row.name
    ? row.name
    : getHass().states[entityId].attributes.friendly_name;

// Turn an Entity Extras row into the real row config, or return it untouched
const convertRow = (row) => {
  const entityId = typeof row === "string" ? row : row?.entity;
  const rowType = entityId && getRowType(entityId);
  if (!rowType) return row;

  const attributes = getHass().states[entityId].attributes;

  switch (rowType) {
    case "divider":
      return { type: "divider" };
    case "spacer":
      return { type: "custom:ee-spacer-row" };
    case "section":
      return { type: "section", label: getRowName(row, entityId) };
    case "weblink":
      return {
        type: "weblink",
        name: getRowName(row, entityId),
        // A web link row errors without an address, so use a placeholder
        url: row?.tap_action?.url_path || "#",
        icon: row?.icon || attributes.icon,
      };
    default:
      return row;
  }
};

// The entities card is loaded on demand, so wait for it to be registered
customElements.whenDefined("hui-entities-card").then(() => {
  const EntitiesCard = customElements.get("hui-entities-card");
  const originalSetConfig = EntitiesCard.prototype.setConfig;

  EntitiesCard.prototype.setConfig = function (config) {
    if (config && Array.isArray(config.entities)) {
      config = { ...config, entities: config.entities.map(convertRow) };
    }
    return originalSetConfig.call(this, config);
  };
});

/* ------------------------------------------------------------------------ */
/* The pencil dialog for section and web link rows                          */
/* ------------------------------------------------------------------------ */

// The card editor rejects unknown keys on a row, so the URL box saves the
// address as a "url" tap action, which every row is allowed to have
const urlToTapAction = (config) => {
  const { url, ...rest } = config;
  if (url) return { ...rest, tap_action: { action: "url", url_path: url } };
  if (rest.tap_action?.action === "url") delete rest.tap_action;
  return rest;
};

// Change the dialog for section and web link rows to use plain text boxes
const addRowFields = (editor) => {
  const config = editor._config;
  const rowType = getRowType(config?.entity);
  if (rowType !== "weblink" && rowType !== "section") return;

  const form = editor.shadowRoot?.querySelector("ha-form");
  if (!form || !Array.isArray(form.schema)) return;

  // Turn the URL box back into a tap action before the editor saves the row
  if (!editor._extrasWrapped) {
    const dispatch = editor.dispatchEvent.bind(editor);
    editor.dispatchEvent = (event) => {
      if (event.type === "config-changed" && event.detail?.config) {
        event = new CustomEvent("config-changed", {
          detail: { config: urlToTapAction(event.detail.config) },
          bubbles: true,
          composed: true,
        });
      }
      return dispatch(event);
    };
    editor._extrasWrapped = true;
  }

  // Show the saved address in the URL box
  if (rowType === "weblink") {
    form.data = { ...config, url: config.tap_action?.url_path ?? "" };
  }

  // The boxes only need swapping once
  if (form.schema.some((field) => field.name === "name" && field.selector?.text)) {
    return;
  }

  // A plain text box replaces the Name box, which is awkward for static text
  const schema = form.schema.map((field) =>
    field.name === "name" ? { name: "name", selector: NO_AUTOFILL } : field
  );
  if (rowType === "weblink") {
    const nameIndex = schema.findIndex((field) => field.name === "name");
    schema.splice(nameIndex + 1, 0, { name: "url", selector: NO_AUTOFILL });
  }

  const labels = { name: rowType === "weblink" ? "Text" : "Heading", url: "URL" };
  const originalLabel = form.computeLabel;
  form.computeLabel = (field, ...rest) =>
    labels[field.name] ?? originalLabel?.(field, ...rest);

  form.schema = schema;
};

// The row editor is loaded on demand, so wait for it to be registered
customElements.whenDefined("hui-generic-entity-row-editor").then(() => {
  const RowEditor = customElements.get("hui-generic-entity-row-editor");
  const originalUpdated = RowEditor.prototype.updated;

  RowEditor.prototype.updated = function (changed) {
    originalUpdated?.call(this, changed);
    addRowFields(this);
  };
});
