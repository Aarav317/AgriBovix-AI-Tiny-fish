# Visual assets and provenance

## Original logo

`frontend/public/logo/agribovix-original.png` is a byte-for-byte copy of the supplied `Screenshot 2026-10-20 101321.png`. The supplied file is the only standalone logo artwork provided. Its original pale background, dimensions, aspect ratio and pixels are preserved. CSS contains it proportionally; no filter, recoloring, background removal, redrawing or generated replacement is used. Other plant/cattle pictograms are interface icons, not substitutes for this logo.

## Local photographic assets

The following are generated editorial-style illustrations for the interface, **not documentary photos of actual farms, diagnostic examples, or evidence of model performance**. They were created with the built-in imagegen tool, then copied into the project. Prompts:

### `frontend/public/images/farmer-hero.png`

Use case: photorealistic-natural. Asset type: wide agricultural website hero photograph, approximately 16:9 landscape. Primary request: photorealistic editorial photograph of an Indian farmer inspecting healthy green crop leaves with a smartphone in a lush rural field. Composition: farmer on far right, seen from behind at three quarter angle, light cotton turban and sage work shirt, holding phone toward a leaf, natural believable hands, green crop foliage across frame, left half soft out-of-focus dark green foliage with ample negative space for overlay text. Warm morning sunlight from upper right, authentic rural India, premium natural photography, realistic texture. No text, no lettering, no logos, no UI overlays, no watermarks.

### `frontend/public/images/cattle.png`

Use case: photorealistic-natural. Asset type: livestock workspace card photograph. Landscape 3:2 editorial agricultural photo of one healthy golden brown Indian Sahiwal cow standing in a lush green pasture, head facing camera, body on right with room for natural grass left, ears and muzzle clear, distant soft trees, warm gentle morning sun. Realistic premium rural photography. No branding, no graphics, no text, no watermarks.

### `frontend/public/images/crop-leaves.png`

Use case: photorealistic-natural. Asset type: crop health workspace card photography, landscape 3:2. Close-up editorial photo of fresh healthy green tomato plant leaves growing outdoors in an Indian farm. One large vivid veined serrated leaf in clear sharp focus near center-right, other leaves layered behind, softly blurred green field, sunlight filtering through, authentic farming photography. Premium natural photograph. No fruit necessary, no potatoes, no graphics, no text, no overlays, no watermarks.

The local `fallback.svg` is a simple in-code fallback landscape with an explicit image-unavailable label. Photographic assets are not loaded from a remote service at runtime.

## Fonts and icons

DM Sans variable font is self-hosted at `frontend/public/fonts/DMSans-Variable.ttf`, obtained from the official [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/dmsans). Its SIL Open Font License is included as `frontend/public/fonts/OFL.txt`. The system font stack provides an offline fallback. Lucide icons are installed through `lucide-react` under its ISC license. `CowIcon.tsx` is a small original code-native interface pictogram.

## Educational references

- [FAO integrated pest management](https://www.fao.org/pest-and-pesticide-management/ipm/integrated-pest-management/en/)
- [FAO Farmer Field Schools](https://www.fao.org/farmer-field-schools/themes/integrated-pest-management/)
- [MSD Veterinary Manual: screening and care in beef cattle](https://www.msdvetmanual.com/management-and-nutrition/preventative-health-care-and-husbandry-of-beef-cattle/disease-screening-treatment-and-surveillance-in-beef-cattle)
- [MSD Veterinary Manual: esophageal obstruction, including emergency bloat](https://www.msdvetmanual.com/digestive-system/disorders-of-the-esophagus-in-large-animals/esophageal-obstruction-in-large-animals)

These sources support the limited general guide content. They are not endorsements, validated model sources, or evidence for a particular scan result.
