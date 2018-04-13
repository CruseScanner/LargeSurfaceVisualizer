import Object from 'osg/Object';
import Plane from 'osg/Plane';
import utils from 'osg/utils';
import { vec4 } from 'osg/glMatrix';
import PooledArray from 'osg/PooledArray';

/*jshint bitwise: false */
/**
 * Polytope class for representing convex clipping volumes made up of a set of planes.
 * When adding planes, their normals should point inwards (into the volume)
 * @class Polytope
 */
var Polytope = function() {
    this._clippingMask = 0x0;

    this._planeList = [
        Plane.create(),
        Plane.create(),
        Plane.create(),
        Plane.create(),
        Plane.create(),
        Plane.create()
    ];
    this._vertexList = [];

    // stack of clipping masks
    this._maskStack = new PooledArray();

    // init with a clear mask
    this._resultMask = 0;
    this._maskStack.push(this._resultMask);
};

utils.createPrototypeObject(
    Polytope,
    utils.objectInherit(Object.prototype, {
        getPlanes: function() {
            return this._planeList;
        },

        setPlanes: function(pl) {
            this._planeList = pl;
            this.setupMask();
        },

        clear: function() {
            this._clippingMask = 0x0;
            if (this._planeList) {
                for (var i = 0, l = this._planeList.length; i < l; ++i) {
                    Plane.init(this._planeList[i]);
                }
            }
            this._vertexList = [];
            this.setupMask();
        },

        /** Create a Polytope which is a cube, centered at 0,0,0, with sides of 2 units.*/
        setToUnitFrustum: function(withNear, withFar) {
            if (withNear === undefined) withNear = true;

            if (withFar === undefined) withFar = true;

            this._planeList.length = 0;
            this._planeList.push(vec4.set(Plane.create(), 1.0, 0.0, 0.0, 1.0)); // left plane.
            this._planeList.push(vec4.set(Plane.create(), -1.0, 0.0, 0.0, 1.0)); // right plane.
            this._planeList.push(vec4.set(Plane.create(), 0.0, 1.0, 0.0, 1.0)); // bottom plane.
            this._planeList.push(vec4.set(Plane.create(), 0.0, -1.0, 0.0, 1.0)); // top plane.
            if (withNear) this._planeList.push(vec4.set(Plane.create(), 0.0, 0.0, 1.0, 1.0)); // near plane
            if (withFar) this._planeList.push(vec4.set(Plane.create(), 0.0, 0.0, -1.0, 1.0)); // far plane
            this.setupMask();
        },

        /** Create a Polytope which is a equivalent to BoundingBox.*/
        setToBoundingBox: function(bb) {
            this._planeList.length = 0;
            this._planeList.push(vec4.set(Plane.create(), 1.0, 0.0, 0.0, -bb.getMin()[0])); // left plane.
            this._planeList.push(vec4.set(Plane.create(), -1.0, 0.0, 0.0, bb.getMax()[0])); // right plane.
            this._planeList.push(vec4.set(Plane.create(), 0.0, 1.0, 0.0, -bb.getMin()[1])); // bottom plane.
            this._planeList.push(vec4.set(Plane.create(), 0.0, -1.0, 0.0, bb.getMax()[1])); // top plane.
            this._planeList.push(vec4.set(Plane.create(), 0.0, 0.0, 1.0, -bb.getMin()[2])); // near plane
            this._planeList.push(vec4.set(Plane.create(), 0.0, 0.0, -1.0, bb.getMax()[2])); // far plane
            this.setupMask();
        },

        setAndTransformProvidingInverse: function(pt, matrix) {
            this._referenceVertexList = pt._referenceVertexList;
            var polytopBackIndex = this._maskStack.getLength() - 1;
            var resultMask = pt._maskStack[polytopBackIndex];
            if (resultMask === 0) {
                this._maskStack.getArray()[polytopBackIndex] = 0;
                this._resultMask = 0;
                this._planeList.length = 0;
                return;
            }
            var selectorMask = 0x1;

            var numActivePlanes = 0;
            // count number of active planes.
            var i;
            for (i = 0; i !== pt._planeList.length; ++i) {
                if (resultMask & selectorMask) ++numActivePlanes;
                selectorMask <<= 1;
            }

            this._planeList.length = numActivePlanes;
            this._resultMask = 0;
            selectorMask = 0x1;
            var index = 0;
            for (i = 0; i !== pt._planeList.length; ++i) {
                if (resultMask & selectorMask) {
                    this._planeList[index] = pt._planeList[i];
                    Plane.transformProvidingInverse(this._planeList[index++], matrix);
                    this._resultMask = (this._resultMask << 1) | 1;
                }
                selectorMask <<= 1;
            }

            this._maskStack.getArray()[polytopBackIndex] = this._resultMask;
        },

        voidset: function(pl) {
            this._planeList = pl;
            this.setupMask();
        },

        add: function(pl) {
            this._planeList.push(pl);
            this.setupMask();
        },

        empty: function() {
            return this._planeList.length === 0;
        },

        setReferenceVertexList: function(vertices) {
            this._referenceVertexList = vertices;
        },

        getReferenceVertexList: function() {
            return this._referenceVertexList;
        },

        setupMask: function(plength) {
            this._resultMask = 0;
            var pMasklength = plength !== undefined ? plength : this._planeList.length;
            for (var i = 0; i < pMasklength; ++i) {
                this._resultMask = (this._resultMask << 1) | 1;
            }
            this._maskStack.reset();
            this._maskStack.push(this._resultMask);
        },

        getCurrentMask: function() {
            return this._maskStack.back();
        },

        setResultMask: function(mask) {
            this._resultMask = mask;
        },

        getResultMask: function() {
            return this._resultMask;
        },

        getMaskStack: function() {
            return this._maskStack;
        },

        // push but keep current mask
        pushCurrentMask: function() {
            this._maskStack.push(this._resultMask);
        },
        // pop and restore previous mask
        popCurrentMask: function() {
            return this._maskStack.pop();
        },

        /** Check whether a vertex is contained within clipping set.*/
        containsVertex: function(v) {
            var polytopeBack = this._maskStack.back();
            if (!polytopeBack) return true;

            var selectorMask = 0x1;
            for (var i = 0; i < this._planeList.length; ++i) {
                if (
                    polytopeBack & selectorMask &&
                    Plane.distanceToPlane(this._planeList[i], v) < 0.0
                ) {
                    return false;
                }
                selectorMask <<= 1;
            }
            return true;
        },

        /** Check whether any part of vertex list is contained within clipping set.*/
        containsVertices: function(vertices) {
            var polytopeBack = this._maskStack.back();
            if (!polytopeBack) return true;

            this._resultMask = polytopeBack;

            for (var k = 0; k < vertices.length; ++k) {
                var v = vertices[k];
                var outside = false;
                var selectorMask = 0x1;
                for (var i = 0; !outside && i < this._planeList.length; ++i) {
                    if (
                        polytopeBack & selectorMask &&
                        Plane.distanceToPlane(this._planeList[i], v) < 0.0
                    ) {
                        outside = true;
                    }
                    selectorMask <<= 1;
                }

                if (!outside) return true;
            }
            return false;
        },

        /** Check whether any part of a bounding sphere is contained within clipping set.
        Using a mask to determine which planes should be used for the check, and
        modifying the mask to turn off planes which wouldn't contribute to clipping
        of any internal objects.  This feature is used in osgUtil::CullVisitor
        to prevent redundant plane checking.*/
        containsBoundingSphere: function(bs) {
            var polytopeBack = this._maskStack.back();
            if (!polytopeBack || !bs.valid()) return true;

            this._resultMask = polytopeBack;
            var selectorMask = 0x1;

            for (var i = 0; i < this._planeList.length; ++i) {
                if (this._resultMask & selectorMask) {
                    var res = Plane.intersectsOrContainsBoundingSphere(this._planeList[i], bs);
                    if (Plane.OUTSIDE === res) {
                        // totally outside a clipping set.
                        return false;
                    } else if (Plane.INSIDE === res) {
                        // subsequent checks against this plane not required.
                        this._resultMask ^= selectorMask;
                    }
                    // else if ( Plane.INTERSECT === res ) { // last possible case
                    //   can say nothing.
                    // subsequent checks against this plane needed.
                    //}
                }
                selectorMask <<= 1;
            }
            return true;
        },

        /** Check whether any part of a bounding box is contained within clipping set.
        Using a mask to determine which planes should be used for the check, and
        modifying the mask to turn off planes which wouldn't contribute to clipping
        of any internal objects.  This feature is used in osgUtil::CullVisitor
        to prevent redundant plane checking.*/
        containsBoundingBox: function(bb) {
            var polytopeBack = this._maskStack.back();
            if (!polytopeBack) return true;

            this._resultMask = polytopeBack;
            var selectorMask = 0x1;

            for (var i = 0; i < this._planeList.length; ++i) {
                if (this._resultMask & selectorMask) {
                    var res = Plane.intersectsOrContainsBoundingBox(this._planeList[i], bb);
                    if (Plane.OUTSIDE === res) return false;
                    else if (Plane.INSIDE === res)
                        // outside clipping set.
                        this._resultMask ^= selectorMask; // subsequent checks against this plane not required.
                    // else if ( Plane.INTERSECT === res ) the last case need
                    // no test here but further tests
                }
                selectorMask <<= 1;
            }
            // correct frustum culling should double check now for
            // http://www.iquilezles.org/www/articles/frustumcorrect/frustumcorrect.htm
            // which is inside one "plane", but outside the convex plane intersection
            return true;
        },

        /** Check whether all of vertex list is contained with clipping set.*/
        containsAllOfVertices: function(vertices) {
            var polytopeBack = this._maskStack.back();
            if (!polytopeBack) return false;

            this._resultMask = polytopeBack;
            var selectorMask = 0x1;

            for (var i = 0; i < this._planeList.length; ++i) {
                if (this._resultMask & selectorMask) {
                    var res = Plane.intersectsOrContainsVertices(this._planeList[i], vertices);
                    if (res < 1) return false; // intersects, or is below plane.
                    this._resultMask ^= selectorMask; // subsequent checks against this plane not required.
                }
                selectorMask <<= 1;
            }
            return true;
        },

        /** Check whether the entire bounding sphere is contained within clipping set.*/
        containsAllOfBoundingSphere: function(bs) {
            var polytopeBack = this._maskStack.back();
            if (!polytopeBack) return false;

            this._resultMask = polytopeBack;
            var selectorMask = 0x1;

            for (var i = 0; i < this._planeList.length; ++i) {
                if (this._resultMask & selectorMask) {
                    var res = Plane.intersectsOrContainsBoundingSphere(this._planeList[i], bs);
                    if (res < 1) return false; // intersects, or is below plane.
                    this._resultMask ^= selectorMask; // subsequent checks against this plane not required.
                }
                selectorMask <<= 1;
            }
            return true;
        },

        /** Check whether the entire bounding box is contained within clipping set.*/
        containsAllOfBoundingBox: function(bbox) {
            var polytopeBack = this._maskStack.back();
            if (!polytopeBack) return false;

            this._resultMask = polytopeBack;
            var selectorMask = 0x1;

            for (var i = 0; i < this._planeList.length; ++i) {
                if (this._resultMask & selectorMask) {
                    var res = Plane.intersectsOrContainsBoundingBox(this._planeList[i], bbox);
                    if (res < 1) return false; // intersects, or is below plane.
                    this._resultMask ^= selectorMask; // subsequent checks against this plane not required.
                }
                selectorMask <<= 1;
            }
            return true;
        },

        /** Transform the clipping set by provide a pre inverted matrix.
         * see transform for details. */
        transformProvidingInverse: function(matrix) {
            var polytopeBack = this._maskStack.back();
            if (!polytopeBack) return;

            this._resultMask = polytopeBack;
            var selectorMask = 0x1;
            for (var i = 0; i < this._planeList.length; ++i) {
                if (polytopeBack & selectorMask) {
                    Plane.transformProvidingInverse(this._planeList[i], matrix);
                }
                selectorMask <<= 1;
            }
        }
    }),
    'osg',
    'Polytope'
);

/*jshint bitwise: true */

export default Polytope;
