// Renderer-independent contract for the NEXT 3D phase. No flight dynamics implied.
export const SCENE_SPEC=Object.freeze({
 version:1,units:'metres',upAxis:'y',
 terrain:{widthM:2000*0.3048,lengthM:8000*0.3048,geography:'Ankara-inspired',georeferenced:false,dimensionAssumption:'Both values are horizontal dimensions; user confirmation pending'},
 camera:{mode:'orbit',target:'helicopter',rotate:'left-drag',zoom:'wheel',pan:'right-drag',minDistanceM:8,maxDistanceM:1500},
 physicalStateStatus:'not-implemented',
 // positionM, attitudeRad, rotorRpm must remain null until an explicitly labelled
 // illustrative or a source-validated dynamics provider is connected.
 requiredFutureState:['positionM','attitudeRad','rotorRpm','skidAglFt','iasKt','systems'],
 rewindPolicy:'Pure state from time/config/decisions; never integrate backwards',
 terrainPolicy:'Procedural illustrative terrain first; do not claim real Ankara elevation data'
});
