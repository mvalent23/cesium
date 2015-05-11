define(['./defaultValue',
        './defined',
        './Cartesian3',
        './ComponentDatatype',
        './PrimitiveType',
        './BoundingSphere',
        './GeometryAttribute',
        './GeometryAttributes',
        './GeometryPipeline',
        './VertexFormat',
        './Geometry',
        './EllipseOutlineGeometry',
        './PolygonGeometry',
        './DeveloperError'
    ], function(
        defaultValue,
        defined,
        Cartesian3,
        ComponentDatatype,
        PrimitiveType,
        BoundingSphere,
        GeometryAttribute,
        GeometryAttributes,
        GeometryPipeline,
        VertexFormat,
        Geometry,
        EllipseOutlineGeometry,
        PolygonGeometry,
        DeveloperError) {
    "use strict";

    /**
     * A description of a ring on the ellipsoid
     *
     * @alias RingGeometry
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {Cartesian3} options.center The circle's center point in the fixed frame.
     * @param {Number} options.innerRadius The ring's inner radius in meters.
     * @param {Number} options.outerRadius The ring's outer radius in meters.
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid the circle will be on.
     * @param {Number} [options.height=0.0] The height above the ellipsoid.
     * @param {Number} [options.granularity=0.02] The angular distance between points on the circle in radians.
     * @param {Number} [options.extrudedHeight=0.0] The height of the extrusion relative to the ellipsoid.
     * @param {Number} [options.numberOfVerticalLines=16] Number of lines to draw between the top and bottom of an extruded circle.
     *
     * @exception {DeveloperError} inner or outer radius must be specified
     * @exception {DeveloperError} inner or outer radius must be a number
     * @exception {DeveloperError} inner or outer radius must be greater than 0
     * @exception {DeveloperError} inner radius must be smaller than outer radius
     * @exception {DeveloperError} granularity must be greater than zero.
     *
     * @see RingGeometry.createGeometry
     *
     * @example
     * // Create a Ring.
     * var ring = new Cesium.RingGeometry({
     *      center: Cesium.Cartesian3.fromDegrees(-103, 40.0),
     *      innerRadius: 30000.0,
     *      outerRadius: 110000.0
     * });
     *
     * var ringGeom = Cesium.RingGeometry.createGeometry(ring);
     *
     */
    var RingGeometry = function(options) {

        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var outerRadius = options.outerRadius;
        var innerRadius = options.innerRadius;

        // TODO check to ensure solidRatio is a number between 0 and 1, or throw a
        // DeveloperError otherwise

        if(!defined(outerRadius)) {
            throw new DeveloperError("outerRadius must be specified!");
        }else if(typeof outerRadius !== "number") {
            throw new DeveloperError("outerRadius must be a number!");
        } else if(outerRadius <= 0.0) {
            throw new DeveloperError("outerRadius must be a positive number");
        }

        if(!defined(innerRadius)) {
            throw new DeveloperError("innerRadius must be specified!");
        }else if(typeof innerRadius !== "number") {
            throw new DeveloperError("innerRadius must be a number!");
        } else if(innerRadius <= 0.0 || innerRadius >= outerRadius) {
            throw new DeveloperError("innerRadius must be a positive number and less than outerRadius");
        }

        var innerEllipseGeometryOptions = {
            center : options.center,
            semiMajorAxis : innerRadius,
            semiMinorAxis : innerRadius,
            ellipsoid : options.ellipsoid,
            height : options.height,
            extrudedHeight : options.extrudedHeight,
            granularity : options.granularity,
            numberOfVerticalLines : options.numberOfVerticalLines
        };

        var outerEllipseGeometryOptions = {
            center : options.center,
            semiMajorAxis : outerRadius,
            semiMinorAxis : outerRadius,
            ellipsoid : options.ellipsoid,
            height : options.height,
            extrudedHeight : options.extrudedHeight,
            granularity : options.granularity,
            numberOfVerticalLines : options.numberOfVerticalLines
        };

        this._innerEllipseGeometry = new EllipseOutlineGeometry(innerEllipseGeometryOptions);
        this._outerEllipseGeometry = new EllipseOutlineGeometry(outerEllipseGeometryOptions);

        this._workerName = 'createRingGeometry';
    };

    /**
     *
     * @param {RingGeometry} ringGeometry A description of the RingGeometry
     * @returns {Object} Returns an object which contains 2 arrays. One array for positions
     * defining the outer polygon (Circle), and one array containing the positions of the
     * holes (another Circle).  These are to be used when creating a Polygon entity.
     *
     * @example
     * // Create a Ring.
     * var ring = new Cesium.RingGeometry({
     *      center: Cesium.Cartesian3.fromDegrees(-103, 40.0),
     *      innerRadius: 30000.0,
     *      outerRadius: 110000.0
     * });
     *
     * // Get the defining geometry for the polygon
     * var ringGeom = Cesium.RingGeometry.createGeometry(ring);
     *
     * // use the Geometry when adding an entity to the viewer
     * var redRing = viewer.entities.add({
     *     name: "Red Ring",
     *     polygon: {
     *         hierarchy: {
     *             positions: ringGeom.positions,
     *             holes: [{
     *                 positions: ringGeom.holes
     *             }]
     *         },
     *
     *         material : Cesium.Color.RED.withAlpha(0.6),
     *         outline : true,
     *         outlineColor : Cesium.Color.BLACK
     *     }
     * });
     */
    RingGeometry.createGeometry = function(ringGeometry) {
        var innerGeom = EllipseOutlineGeometry.createGeometry(ringGeometry._innerEllipseGeometry);
        var outerGeom = EllipseOutlineGeometry.createGeometry(ringGeometry._outerEllipseGeometry);
        var innerVals = innerGeom.attributes.position.values;
        var outerVals = outerGeom.attributes.position.values;

        var innerIndices = innerGeom.indices;
        var outerIndices = outerGeom.indices;

        var numElements = innerVals.length / 3;
        var numElements2 = outerVals.length / 3;

        var cart3s = [];
        var outerCart3s = [];

        for(var i = 0; i < numElements; i++) {
            var j = i*3;
            var cart3 = Cartesian3.fromElements(innerVals[j],
                                                       innerVals[j+1],
                                                       innerVals[j+2]);

            cart3s.push(cart3);
        }

        for(var k = 0; k < numElements2; k++) {
            var m = k*3;
            var c3 = Cartesian3.fromElements(outerVals[m],
                                                    outerVals[m+1],
                                                    outerVals[m+2]);

            outerCart3s.push(c3);
        }

        var innerPositions = [];
        var outerPositions = [];
        for(i = 0; i < innerIndices.length; i++) {
            innerPositions.push(cart3s[innerIndices[i]]);
        }

        for(i = 0; i < outerIndices.length; i++) {
            outerPositions.push(outerCart3s[outerIndices[i]]);
        }

        var poly = new PolygonGeometry({
            polygonHierarchy: {
                positions: outerPositions,
                holes: [{
                    positions: innerPositions
                }]
            }
        });

        return {
            positions: outerPositions,
            holes: innerPositions
        };
    };

    return RingGeometry;
});