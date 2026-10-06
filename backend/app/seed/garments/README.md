# Catalog sprites

The 25 PNGs in this directory are the source assets for the current catalog.
Every image is 1254 × 1254 pixels with an RGBA alpha channel. The application
installs them under `data/garments/catalog-v2/` and uses them for both the full
catalog image and thumbnail. Original downloads were left unchanged.

Preparation used the built-in `image_gen` tool in background-extraction mode.
`hia_nam.png` already had a usable transparent background and was copied directly.
All other images were edited individually, preserving their supplied colors and
designs even when a filename or catalog description suggests another color.

## Prompt set

Main extraction prompt:

> Remove only the baked-in checkerboard or solid background and any background-only
> corner mark. Make a square PNG catalog sprite with true alpha transparency.
> Center the complete object with modest transparent padding. Preserve the exact
> original colors, silhouette, patterns, embroidery, fabric folds, texture, pose,
> orientation and details. Make holes and gaps transparent. Do not redesign or
> recolor. No background, checkerboard pixels, text, border, ground shadow or extra
> objects.

Accessory cleanup additionally requested removal of residual backdrop, halos and
shadows, preservation of the tote's original print and lettering, and transparent
openings in the carved fan.

The umbrella and hairpin received a final padding edit:

> Keep the identical object and colors. Fit the complete object inside the central
> 85% of a square transparent canvas, leaving at least 7.5% empty transparent space
> on every side. Preserve the entire handle or hanging beads. Remove fringe,
> disconnected scraps and residual background. Keep clean antialiased edges.

Validation checks all 25 images, manifest references, repeated database imports,
catalog filtering, preservation of saved outfits, and PNG responses from the API.
