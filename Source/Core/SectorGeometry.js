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
        './Ellipsoid',
        './Math',
        './Matrix3',
        './Quaternion',
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
        Ellipsoid,
        CesiumMath,
        Matrix3,
        Quaternion,
        DeveloperError) {
    "use strict";

    function computeSector(options) {

        var granularity = options.granularity;
        var radius = options.radius;
        var rotation = CesiumMath.toRadians(options.rotation);
        var sectorAngle = options.sectorAngle;

        var numPts = 1 + Math.ceil(sectorAngle / granularity);
        var theta = sectorAngle / (numPts - 1);

        var i;
        var cosTheta = Math.cos(theta);
        var sinTheta = Math.sin(theta);
        var tmp;

        // start position of the sector along unit circle
        var x = Math.cos(rotation);
        var y = Math.sin(rotation);

        // We include the origin of the sector in the positions
        var positions = new Float64Array((numPts + 1) * 3);
        positions[0] = 0.0;
        positions[1] = 0.0;
        positions[2] = 0.0;

        for(i = 3; i < positions.length; i++) {
            // start at the angle of rotation
            positions[i] = (x * radius);
            positions[++i] = (y * radius);
            positions[++i] = 0.0;

            // compute new position along the sector in cartesian coordinates
            tmp = x;
            x = (cosTheta * tmp) - (sinTheta * y);
            y = (sinTheta * tmp) + (cosTheta * y);
        }

        // we have the positions at this point.  Make the indices
        // for all the positions, it will go:
        // (center, p1, p2)
        // (center, p2, p3)
        // ...
        // (center, pn-1, pn)
        var indices = new Uint16Array((numPts-1) * 3);
        var j;
        i = 1;
        for(j = 0; j < indices.length; j++) {
            indices[j] = 0;
            indices[++j] = i;
            indices[++j] = ++i;
        }


        // populate the geometry data
        var attributes = new GeometryAttributes({
            position: new GeometryAttribute({
                componentDatatype : ComponentDatatype.DOUBLE,
                componentsPerAttribute : 3,
                values : positions
            })
        });

        return new Geometry({
            attributes : attributes,
            indices : indices,
            primitiveType: PrimitiveType.TRIANGLES,
            boundingSphere : new BoundingSphere(new Cartesian3(0.0, 0.0, 0.0), radius)
        });
    }

    /**
     * A description of a sector placed on an ellipsoid
     * @alias SectorGeometry
     * @constructor
     *
     * @param {Object} options The options for creating the sector
     * @param {Number} options.radius The radius, in meters, of the circle sector
     * @param {Number} options.sectorAngle The angle, in degrees, of the sector
     * @param {Number} [options.rotation=0.0] The angle to rotate the sector. 0 represents the
     * East unit vector in the Ellipsoid's coordinate frame.
     * @param {Number} [options.granularity=0.02] The granularity of the sector arc
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid on which
     *  to draw the sector
     *
     * @exception {DeveloperError} Thrown if the radius is not specified, is not a number,
     * or is not a positive number.
     * @exception {DeveloperError} Thrown if sectorAngle is not specified, is not a number,
     * or is not between 0 and 360.0
     * @exception {DeveloperError} Thrown if the overriding rotation angle is not between 0.0
     * and 360.0 degrees
     * @exception {DeveloperError} Thrown if the overriding granularity is less than 0.0
     *
     * @example
     * // Create a Sector.
     * var sector = new Cesium.SectorGeometry({
     *      radius: 1000.0,
     *      sectorAngle: 45.0,
     *      rotation: 60.0
     * });
     *
     * var sectorInstance = new Cesium.GeometryInstance({
     *      geometry : sector,
     *      modelMatrix : Cesium.Matrix4.multiplyByTranslation(
     *          mm2,
     *          new Cesium.Cartesian3(0.0, 0.0, 10000.0),
     *          mm2),
     *      attributes: {
     *          color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)
     *      }
     * });
     *
     * scene.primitives.add(new Cesium.Primitive({
     *      geometryInstances: sectorInstance,
     *      appearance: new Cesium.PerInstanceColorAppearance({
     *          translucent: false,
     *          flat: true
     *      })
     * }));
     *
     * // Get the defining geometry for the SectorGeometry
     * var sectorGeometry = Cesium.SectorGeometry.createGeometry(sector);
     */
    var SectorGeometry = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var radius = options.radius;
        var sectorAngle = CesiumMath.toRadians(options.sectorAngle);
        var granularity = defaultValue(options.granularity, 0.02);
        var ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        var rotation = defaultValue(options.rotation, 0.0);


        if(!defined(radius)) {
            throw new DeveloperError("radius must be specified!");
        }else if(typeof radius !== "number") {
            throw new DeveloperError("radius must be a number!");
        } else if(radius <= 0.0) {
            throw new DeveloperError("radius must be a positive number");
        }

        if(!defined(sectorAngle)) {
            throw new DeveloperError("sectorAngle must be specified!");
        }else if(typeof sectorAngle !== "number") {
            throw new DeveloperError("sectorAngle must be a number!");
        } else if(sectorAngle <= 0.0 || sectorAngle >= CesiumMath.TWO_PI) {
            throw new DeveloperError("sectorAngle must be a positive number and less than 360");
        }

        if(rotation < 0.0 || rotation > 360.0) {
            throw new DeveloperError("rotation angle must be between 0 and 360 degrees");
        }

        if (granularity <= 0.0) {
            throw new DeveloperError('granularity must be greater than zero.');
        }

        this._radius = radius;
        this._sectorAngle = sectorAngle;
        this._rotation = rotation;
        this._granularity = granularity;

        this._workerName = 'createSectorGeometry';
    };

    /**
     * Creates a {Geometry} object containing the positions and other geometric information
     * for the sector.
     * @param {SectorGeometry} sectorGeometry The SectorGeometry descriptor for which to create
     * the Geometry
     * @returns {Geometry} The Geometry specifying the sector to instantiate
     *
     * @example
     * // Create a Sector.
     * var sector = new Cesium.SectorGeometry({
     *      radius: 1000.0,
     *      sectorAngle: 45.0,
     *      rotation: 60.0
     * });
     *
     * // Get the defining geometry for the SectorGeometry
     * var sectorGeometry = Cesium.SectorGeometry.createGeometry(sector);
     */
    SectorGeometry.createGeometry = function(sectorGeometry) {
        var options = {
            radius : sectorGeometry._radius,
            sectorAngle : sectorGeometry._sectorAngle,
            rotation : sectorGeometry._rotation,
            granularity : sectorGeometry._granularity
        };
        var geometry;

        geometry = computeSector(options);
        return geometry;
    };

    return SectorGeometry;
});
