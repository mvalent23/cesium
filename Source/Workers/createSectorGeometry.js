define([
        '../Core/SectorGeometry',
        '../Scene/PrimitivePipeline',
        './createTaskProcessorWorker'
    ], function(
        SectorGeometry,
        PrimitivePipeline,
        createTaskProcessorWorker) {
    "use strict";

    return function createSectorGeometry(geometry, offset) {
        console.log("sector worker thread");
        //var geometry = SectorGeometry.createGeometry(geometry);
        //PrimitivePipeline.transferGeometry(geometry, transferableObjects);

        return SectorGeometry.createGeometry(geometry);
    };
});