/*global define*/
define([
        '../Core/RingGeometry',
        '../Scene/PrimitivePipeline',
        './createTaskProcessorWorker'
    ], function(
        RingGeometry,
        PrimitivePipeline,
        createTaskProcessorWorker) {
    "use strict";

    function createRingGeometry(parameters, transferableObjects) {
        var geometry = RingGeometry.createGeometry();
        PrimitivePipeline.transferGeometry(geometry, transferableObjects);

        return {
            geometry : geometry,
            index : parameters.index
        };
    }

    return createTaskProcessorWorker(createRingGeometry);
});