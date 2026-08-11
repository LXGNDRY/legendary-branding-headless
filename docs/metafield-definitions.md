# Metafield Definitions

All custom metafields used by the Legendary Branding headless storefront.

These need to be created in the Shopify admin under **Settings → Custom data**
(or via the Shopify Admin / Metafield API).

---

## Product Metafields

| Namespace | Key | Type | Description | Used on |
|---|---|---|---|---|
| `custom` | `material` | `single_line_text_field` | Fabric / material composition | PDP details section |
| `custom` | `fit` | `single_line_text_field` | Fit description (e.g. "Regular fit") | PDP details section |
| `custom` | `care` | `multi_line_text_field` | Care instructions (wash, dry, etc.) | PDP details section |
| `custom` | `size_chart` | `file_reference` (image) | Size chart image | PDP size chart modal |
| `custom` | `new_drop` | `boolean` | Mark as new drop (used in New Drops collection) | DropTimer + collection |
| `custom` | `lookbook_images` | `list.file_reference` | Additional editorial images | PDP gallery + Lookbook |
| `custom` | `waitlist_available` | `boolean` | Enable waitlist for out-of-stock products | PDP waitlist form |
| `custom` | `accents` | `list.single_line_text_field` | Product feature highlights | PDP features list |

---

## Collection Metafields

| Namespace | Key | Type | Description | Used on |
|---|---|---|---|---|
| `custom` | `drop_date` | `date_time` | Drop release date for timers | DropTimer section |
| `custom` | `hero_image` | `file_reference` (image) | Custom hero image for collection page | Collection hero |
| `custom` | `lookbook_layout` | `single_line_text_field` | Layout style: "editorial" / "grid" | Lookbook section |

---

## Page Metafields

| Namespace | Key | Type | Description | Used on |
|---|---|---|---|---|
| `custom` | `content_blocks` | `json` | Array of content block objects | /pages/:handle content |

### Content blocks JSON schema

```json
[
  {
    "type": "heading",
    "title": "Section title",
    "text": "Optional subheading text"
  },
  {
    "type": "rich_text",
    "text": "<p>HTML content here</p>"
  },
  {
    "type": "image_text",
    "image": "https://cdn.shopify.com/...",
    "title": "Image + Text block",
    "text": "Body copy on the right side",
    "position": "left"
  },
  {
    "type": "quote",
    "quote": "The quote text",
    "attribution": "Speaker name"
  },
  {
    "type": "cta",
    "title": "Call to action headline",
    "text": "Supporting text below the headline",
    "button_text": "Shop Now",
    "button_link": "/collections/all"
  }
]
```

Block types: `heading`, `rich_text`, `image_text`, `quote`, `cta`.

---

## Customer Metafields

| Namespace | Key | Type | Description | Used on |
|---|---|---|---|---|
| `custom` | `wishlist` | `json` | Saved product handles + metadata | Wishlist sync (logged-in) |
| `custom` | `size_preferences` | `json` | Saved size per product type | PDP size recommendations |

---

## How to create metafields in Shopify

1. Go to **Settings → Custom data**
2. Select the resource type (Products, Collections, Pages, Customers)
3. Click **Add definition**
4. Fill in Name, Namespace and key, and Type (matching the table above)
5. Save

Once created, content teams can edit the values directly on each product /
collection / page in the Shopify admin — no code changes needed.

---

## Validation rules

- `material`, `fit` — single line, up to 80 chars
- `care` — multi-line, supports basic HTML
- `size_chart` — image only (JPEG/PNG, max 5MB)
- `content_blocks` — must be valid JSON array of block objects
- `drop_date` — ISO 8601 date-time string
