# v0.25.1 — FBX, Gölbaşı terrain and component visuals

## Helicopter
- Source: user-uploaded Jandarma_AB205_Referans_Model.fbx, SHA256 4e8b8e4de73c (full digest embedded in asset). Identical duplicate excluded. Other uploaded FBXs are photo reliefs, not aircraft meshes.
- 146 meshes; 54,986 triangles after polygon triangulation. Source names and eight materials retained. Unused vertices removed. Binary FBX conversion script included under scripts/assets.
- Local axes converted from nose -X/up +Z to nose +X/up +Y; skid datum normalized. Rotor diameter scaled to 14.71168 m. Visual proportions remain the submitted reconstruction, not certified CAD.
- Main/tail rotor pivots, blade groups, separate cabin/cockpit/skids/engine/mast/control groups. Tail fin, stabilizer and tail rotor parented to tail boom so detachment moves the complete assembly.
- Swashplate rings, three approximate servo rods, pitch links, cockpit seats/panel and controls added. Visual collective feathering and swash tilt follow actual controls; no control input or aerodynamic coefficient is changed by animation.
- Sources visually reviewed: uploaded AB-205 SISTEMLER PDF pages 6–7 (two-blade semi-rigid rotor, hub, mast, pitch-change components, tail rotor) and previous operator/maintenance evidence. Dimensions/placement of added details are illustrative, not maintenance measurements.
- Damage: current component analysis drives deformation, detached rotor fragments, tail assembly separation, cockpit marks and transient dust. Dust does not imply fire. A 100% vertical contact score does not automatically separate the airframe. Existing approximate contact envelopes are not replaced by a high-resolution mesh collision solver.

## Terrain
- Origin: 39.713081 N, 32.775265 E. Local +X east, +Z south, north = -Z. Extent 6 x 6 km; 201 x 201 grid, 30 m sampling; center source elevation approximately 991.75 m, rendered relative to center.
- Downloaded 2026-10-19 from https://s3.amazonaws.com/elevation-tiles-prod/terrarium/12/{2420,2421}/{1554,1555}.png. Decode (R*256+G+B/256)-32768, geographic sampling and bilinear interpolation. Grid spacing is not a claim of vertical accuracy. Outside 6 km grid elevation clamps to boundary.
- Terrain Tiles accessed 2026-10-19 from https://registry.opendata.aws/terrain-tiles/ . SRTM/GMTED2010 courtesy USGS; Europe terrain produced using Copernicus data and information funded by EU (EU-DEM). Attribution: https://github.com/tilezen/joerd/blob/master/docs/attribution.md . Exact per-pixel source provenance unavailable.
- OpenStreetMap API bbox 32.765,39.702,32.785,39.724: 2 roads, 7 building footprints, wetland and residential polygons. © OpenStreetMap contributors, ODbL https://www.openstreetmap.org/copyright . Source subset remains in golbasi-osm.js. No claim of completeness beyond this bbox. Building heights inferred (3 m if absent); ground colors, stones and vegetation procedural. No satellite photo texture used.
- Google Earth at the requested coordinate was attempted in cloud browser; WebGL unsupported, so imagery was not inspected or copied. This is NOT a Google Earth photogrammetric replica.
- Rendered elevation, site picking, AGL and ground contact use the same DEM to avoid floating/underground aircraft. This changes terrain-dependent contact times and ground effect; aerodynamic coefficients and decisions unchanged. High wind/low starts can hit rising terrain even before engine failure.
- Existing flat-terrain tests were updated to use actual terrain-relative elevation and airborne intervals; wind test now checks relative numerical tolerance at free-air height.

## Limits / next visual work
- Exact reference match and photorealism not completed. Missing original production mesh, UV/PBR texture set and surveyed local orthoimage.
- Imported rotor geometry/visual added parts not a validated dynamic structural model. Collision envelopes remain approximate; buildings/vegetation are visual scenery, not obstacle collision objects. No new fire/explosion inference.
- CPU fallback simplifies lighting/materials. WebGL testing unavailable in current cloud browser; test compatibility view and report limitation.

## Final visual corrections
- WebGL-only translucent rotor sweep at spinning RPM; hidden on contact.
- CPU terrain near-plane clipping fixes missing foreground triangles.
- Tail rotor deformation fully resets on rewind; independent regression check.
- Live cloud browser checked FBX appearance and map terrain in Canvas compatibility mode; WebGL and native fullscreen unavailable in this environment.
