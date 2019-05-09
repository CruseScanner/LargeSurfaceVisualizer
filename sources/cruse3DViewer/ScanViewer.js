import OSG from 'external/osg';


import ArrayLight from 'cruse3DViewer/ArrayLight';

var osg = OSG.osg;
import PlanarOrbitManipulator from 'cruse3DViewer/PlanarOrbitManipulator';
var osgShader = OSG.osgShader;
var osgDB = OSG.osgDB;
var osgViewer = OSG.osgViewer;
import defined from 'tools/defined';
import shaderLib from 'cruse3DViewer/shaderLib';

'use strict';

function initializeRootNode(scanViewer) {
    return scanViewer.createTileForGeometry(
        0,
        0,
        0
    ).then(function(rootTile) {
        var rootNode = new osg.MatrixTransform();

        var tileExtent = scanViewer._textureMapTileSource.getTileExtent(0, 0, 0);
        var w = tileExtent.x1 - tileExtent.x0;
        var h = tileExtent.y1 - tileExtent.y0;

        rootNode.setMatrix(osg.mat4.fromTranslation(osg.mat4.create(), osg.vec3.fromValues(-w/2, h/2, 0)));            
        rootNode.addChild(rootTile);
        scanViewer.viewer.setSceneData(rootNode);
        var stateSet = rootNode.getOrCreateStateSet();
        
        scanViewer.setupLights(rootNode);
        scanViewer.setupShader(stateSet);

        scanViewer._rootNode = rootNode;
        
        var boundingSphere = rootTile.getBound();
        var manipulator = new PlanarOrbitManipulator({ inputManager: scanViewer.viewer.getInputManager() })
       
        scanViewer.viewer.setupManipulator(manipulator);
        
        var cage = new osg.BoundingBox();
        cage.setMin(osg.vec3.fromValues(-w/2, -h/2, 0.0));
        cage.setMax(osg.vec3.fromValues( w/2,  h/2, 0.0));
        manipulator.setCage(cage);
        
        manipulator.setAutoPushTarget(false);
        manipulator.setLimitZoomIn(boundingSphere.radius() * 0.3);
        manipulator.setLimitZoomOut(boundingSphere.radius() * 3.0);
        manipulator.setMinSpeed(256*10);
        manipulator.setDistance(boundingSphere.radius() * 1.5);
        manipulator.setLimitPitchDown(15.0*Math.PI/180.0);
    });
};


/**
 * @class ScanViewer
 * @constructor
 * 
 */
var ScanViewer = function(canvasElement, options) {
      
    var textureMapTileSource = options.textureMapTileSource;
    var normalMapTileSource = options.normalMapTileSource;
    var glossMapTileSource = options.glossMapTileSource;
    var elevationTileSource = options.elevationTileSource;
   
    
    this._renderTextureMaps = false;
    this._renderNormalMaps = false;
    this._renderDisplacementMaps = false;
    this._enableLODDebugging = false;
    

    this._input = new osgDB.Input();
    this.projectedTilePixels = Math.PI/4.0*256*256;
    // force slightly lower detail
    this.projectedTilePixels*= 2;
    
    this._shaderProcessor = new osgShader.ShaderProcessor;
    
    this.viewer = new osgViewer.Viewer(canvasElement, {
        enableFrustumCulling: true
    });
    this.viewer.init();
    
    var promises = [];    
    var that = this;
    if (defined(textureMapTileSource)) {
        this._textureMapTileSource = textureMapTileSource;
        promises.push(textureMapTileSource.initializationPromise.then(function() {
            that._renderTextureMaps = true;
        }));
    }

    if (defined(normalMapTileSource)) {
        this._normalMapTileSource = normalMapTileSource;
        promises.push(normalMapTileSource.initializationPromise.then(function(){
            that._renderNormalMaps = true;
        }));
    }  
    if (defined(glossMapTileSource)) {
        this._glossMapTileSource = glossMapTileSource;
        promises.push(glossMapTileSource.initializationPromise.then(function(){
            that._renderGlossMaps = true;
        }));
    }
    if (defined(elevationTileSource)) {
        this._elevationTileSource = elevationTileSource;
        promises.push(elevationTileSource.initializationPromise.then(function(){
            that._renderDisplacementMaps = true;
        }));
        
        this._heightMin = 0.0;
        this._heightMax = Math.abs(options.heightMax - options.heightMin);
    }
    else {
        this._heightMin = 0.0;
        this._heightMax = 0.0;
    }
    
    var material = new osg.Material();
    material.setDiffuse ([1.0, 1.0, 1.0, 1.0]);           
    material.setAmbient ([1.0, 1.0, 1.0, 1.0]);
    material.setEmission([0.0, 0.0, 0.0, 1.0]);
    material.setSpecular([1.0, 1.0, 1.0, 1.0]);
    material.setShininess(40.0);
    this._material = material;
    
    var light = new ArrayLight(0);
    light.setDiffuse([1.0, 1.0, 1.0, 1.0]);
    light.setSpecular([1.0, 1.0, 1.0, 1.0]);
    light.setAmbient([0.2, 0.2, 0.2, 1.0]);

    // Setup directional light; note that direction property is only used for
    // positional lights
    light.setPosition([0.0, 0.0, 1.0, 0.0]);
    this._light = [];
    this._light[0] = light;
       
    var shaderProcessor = this._shaderProcessor;
    shaderProcessor.addShaders(shaderLib);
    
    this._initializationPromise = Promise.all(promises).then(function() {
        return initializeRootNode(that);
    });
};

ScanViewer.prototype = {
    /**
     * Will fetch an image from the given tile source and and apply it to the
     * given stateset as texture.
     */
    fetchAndApplyTileImagery: function(x, y, level, stateSet, textureIndex, tileSource) {        
        var image = new osg.Image();
        var options = {
                imageCrossOrigin : true            
        };
        
        var url = tileSource.getTileURL(x, y, level);       
        return this._input.fetchImage(image, url, options).then(function(img) {
            var texture = new osg.Texture();
            texture.setImage(img);
            return texture;
        }).then(function(texture) {
            stateSet.setTextureAttributeAndModes(textureIndex, texture);
        });        
    },
        
    fetchAndApplyAllTileImagery: function(x, y, level, node, parentGeometry) {
        var promises = [];
        
        var stateSet = node.getOrCreateStateSet();
        var parentStateSet;
        if (parentGeometry) {
            parentStateSet = parentGeometry.getOrCreateStateSet();
        }
        
        if (this._renderTextureMaps) {
            if (this._textureMapTileSource.hasTile(x, y, level))
            {
                promises.push(this.fetchAndApplyTileImagery(x, y, level, stateSet, 0, this._textureMapTileSource));
            }
            else
            {
                // Setup scaling/offset, and reuse parent texture
                var textureUnit = 0;
                var parentTexture = parentStateSet.getTextureAttribute(textureUnit, 'Texture');
                stateSet.setTextureAttributeAndModes(textureUnit, parentTexture);
                
                var parentOffsetScaleUniform = parentStateSet.getUniform('uDiffuseMapOffsetScale');
                var offsetScale = osg.vec4.create();
                if (defined(parentOffsetScaleUniform)) {
                    for (var i = 0; i < 4; i++) {
                        offsetScale[i] = parentOffsetScaleUniform.getInternalArray()[i];
                    }
                }
                else {
                    offsetScale[0] = 0.0; // offset x
                    offsetScale[1] = 0.0; // offset y
                    offsetScale[2] = 1.0; // scale x                  
                    offsetScale[3] = 1.0; // scale y                 
                }
                
                var dx = x - Math.trunc(x/2)*2; 
                var dy = 1 - (y - Math.trunc(y/2)*2);
                
                offsetScale[2]*= 0.5;
                offsetScale[3]*= 0.5;
                offsetScale[0] = offsetScale[0] + dx*offsetScale[2]; 
                offsetScale[1] = offsetScale[1] + dy*offsetScale[3]; 
                
                var offsetScaleUniform = osg.Uniform.createFloat4(offsetScale, 'uDiffuseMapOffsetScale');
                stateSet.addUniform(offsetScaleUniform);
            }
        }
        
        if (this._renderNormalMaps) {
            if (this._normalMapTileSource.hasTile(x, y, level))
            {
                promises.push(this.fetchAndApplyTileImagery(x, y, level, stateSet, 1, this._normalMapTileSource));
            }
            else
            {
                // Reuse parent texture
                // TODO: use separate tex. coords to allow for resolution differences in diffuse / normal maps
                var textureUnit = 1;
                var parentTexture = parentStateSet.getTextureAttribute(textureUnit, 'Texture');
                stateSet.setTextureAttributeAndModes(textureUnit, parentTexture);               
            }
        }
        
        if (this._renderGlossMaps) {
            if (this._glossMapTileSource.hasTile(x, y, level))
            {
                promises.push(this.fetchAndApplyTileImagery(x, y, level, stateSet, 2, this._glossMapTileSource));
            }
            else
            {
                // Reuse parent texture
                // TODO: use separate tex. coords to allow for resolution differences in diffuse / normal maps
                var textureUnit = 2;
                var parentTexture  = parentStateSet.getTextureAttribute(textureUnit, 'Texture');
                stateSet.setTextureAttributeAndModes(textureUnit, parentTexture);
            }
        }
        
        if (this._renderDisplacementMaps)
        {
            var promise = this.fetchAndApplyTileImagery(x, y, level, stateSet, 3, this._elevationTileSource);
            var ts = this._elevationTileSource;
            promise.then(function() {
                var e = ts.getRasterExtent(x, y, level);
                
                // Set scaling and offset for displacement mapping for exact
                // sampling (we want to sample on the
                // pixel corners, and assume the heightmap to be center-sampled
                // and have a border of one sample)
                var offsetScaleUniform = osg.Uniform.createFloat4(osg.vec4.fromValues(1.0/e.w, 1.0/e.h, 1.0 - 2.0/e.w, 1.0 - 2.0/e.h), 'uDisplacementOffsetScale');
                stateSet.addUniform(offsetScaleUniform);
            });
            promises.push(promise);
        }
        
        return Promise.all(promises);
    },
    
    /**
     * Sets the light source type to point light with the given position \param
     * elevation Number Elevation angle in radians \param azimuth Number Azimuth
     * angle in radians \param distance Number Distance from origin
     */
    setPointLight: function(lightIndex, elevation, azimuth, distance) {
        var light = this._getOrCreateLight(lightIndex);
        if (!defined(light)) {
            return;
        }        
        
        var d = this.transformSphericalToWorld(elevation, azimuth, distance);        
        // The shader assumes implicit direction atm
        light.setPosition([d[0], d[1], d[2], 1.0]);
        // this._light.setDirection(...);
    },

    /**
     * Returns light position in spherical coordinates.
     */
    getLightPosition: function(lightIndex) {
        if (lightIndex >= this._light.length) return undefined;
        var p = this._light[lightIndex].getPosition();
        var result = this.transformWorldToSpherical(osg.vec3.fromValues(p[0], p[1], p[2]));
        result.directional = (p[3] === 0.0);
        return result;
    },
    
    /**
     * Sets the light source type to point light with the given position \param
     * elevation Elevation angle in radians \param azimuth Azimuth angle in
     * radians
     */
    setDirectionalLight: function(lightIndex, elevation, azimuth) {
        var light = this._getOrCreateLight(lightIndex);
        if (!defined(light)) {
            return;
        }        
        var d = this.transformSphericalToWorld(elevation, azimuth, 1.0);
        light.setPosition([d[0], d[1], d[2], 0.0]);
    },
    
    getDirectionalLight: function(lightIndex) {
        if (lightIndex <= this._light.length) {
            return undefined;
        }
        var p = this._light[lightIndex].getPosition();
        if (p[3] != 0.0) {
            return undefined;
        }
        
        return this.transformWorldToSpherical(p);
    },
    
    _getOrCreateLight: function(lightIndex) {
        console.assert((lightIndex <= this._light.length), 'Light source array must be populated consecutively.');
        if (lightIndex > this._light.length) {
            return undefined;
        }
        if (lightIndex == this._light.length) {
            // Create light
            this._light[lightIndex] = new ArrayLight(lightIndex);

            // If root node exists, we can add a corresponding lightsource
            if (defined(this._rootNode)) {
                var lightSource = new osg.LightSource();
                lightSource.setLight(this._light[lightIndex]);               
                this._rootNode.addChild(lightSource);
                // Update shader
                this.setupShader(this._rootNode.getOrCreateStateSet());
            }

        }
        return this._light[lightIndex];
    },

    /**
     * Sets lighting parameters. \param ambient Number[3] Ambient RGB
     * contribution \param diffuse Number[3] Diffuse light color \param specular
     * Number[3] Specular light color \param phongExponent Number
     */
    setLightParameters: function(lightIndex, ambient, diffuse, specular, phongExponent) {
        var light = this._getOrCreateLight(lightIndex);
        if (!defined(light)) {
            return;
        }
        light.setDiffuse(diffuse);
        light.setSpecular(specular);
        light.setAmbient(ambient);
        this._material.setShininess(phongExponent);
    },
    
    /**
     * Gets lighting parameters.
     */
    getLightParameters: function(lightIndex) {
        if (this._light.length <= lightIndex) {
            throw 'out of bounds';
        }     
        return {
            diffuse  : osg.vec4.clone(this._light[lightIndex].getDiffuse()),
            specular : osg.vec4.clone(this._light[lightIndex].getSpecular()),
            ambient  : osg.vec4.clone(this._light[lightIndex].getAmbient()),
            phongExponent : this._material.getShininess()
        };
    },
    
    getLightCount: function() {
        return this._light.length;
    },
    
    setEnableLODVisualization: function(value)
    {
        this._enableLODDebugging = value;
        var stateSet = this._rootNode.getOrCreateStateSet();        
        this.setupShader(stateSet);
    },
     
    setupLights : function(node) {
        var stateSet = node.getOrCreateStateSet();

        for (var i = 0; i < this._light.length; i++) {
            var lightSource = new osg.LightSource();
            lightSource.setLight(this._light[i]);
            node.addChild(lightSource);            
        }
    },
    
    setupShader : function(stateSet) {
        var material = this._material;
        stateSet.setAttributeAndModes(material);
        
        var defines = [];
        if (this._renderNormalMaps) defines.push('#define WITH_NORMAL_MAP');
        if (this._renderGlossMaps) defines.push('#define WITH_GLOSS_MAP');
        if (this._enableLODDebugging) defines.push('#define WITH_DEBUG_LOD');
        if (this._renderDisplacementMaps) defines.push('#define WITH_DISPLACEMENT_MAP');

        defines.push('#define LIGHT_COUNT ' + this.getLightCount());

        var vertexshader = this._shaderProcessor.getShader('scanviewer.vert.glsl', defines);
        var fragmentshader = this._shaderProcessor.getShader('scanviewer.frag.glsl', defines);

        this._program = new osg.Program(
            new osg.Shader('VERTEX_SHADER', vertexshader),
            new osg.Shader('FRAGMENT_SHADER', fragmentshader)
        );
        
        var attributeKeys = [ 'Material' ];
        for (var i = 0; i  < this.getLightCount(); i++) {
            attributeKeys.push('ArrayLight' + i);
        }
        
        this._program.setTrackAttributes({ 
            attributeKeys : attributeKeys,  
            textureAttributeKeys : [ [ 'Texture' ], [ 'Texture' ], ['Texture'], ['Texture'] ]
        });
        
        var displacementRangeUniform = osg.Uniform.createFloat1(this._heightMax - this._heightMin, 'uDisplacementRange');
        stateSet.addUniform(displacementRangeUniform);
        
        stateSet.addUniform(osg.Uniform.createFloat4(osg.vec4.fromValues(0.0, 0.0, 1.0, 1.0), 'uDiffuseMapOffsetScale'));
                
        stateSet.setAttributeAndModes(this._program);        
    },
    
    createGridGeometry :function(samplesX, samplesY, skirtSize) {
        if (!defined(this._gridGeometryCache)) {
            this._gridGeometryCache = {};
        }
        var cache = this._gridGeometryCache;
        
        var skirt = defined(skirtSize) ? 1 : 0;
    
        var gridID = samplesX.toString() + "_" + samplesY.toString() + "_" + skirtSize.toString();
        var cacheEntry = cache[gridID];
        
        if (!defined(cacheEntry)) {
            //console.log("Got cache miss for " + gridID);
            cacheEntry = cache[gridID] = {};
            
            var vX = samplesX + 2*skirt;
            var vY = samplesY + 2*skirt;
            
            var vertex = new osg.Float32Array(vX*vY*2);
            var vi = 0;
            for (var y = -skirt; y < samplesY + skirt; y++) {
                var yCoord;
                if (y == -1) {
                    yCoord = -skirtSize;
                }
                else if (y == samplesY) {
                    yCoord = 1.0 + skirtSize;
                }
                else {
                    yCoord = Math.max(0.0, y/(samplesY-1));
                }
                
                
                // Set leftmost skirt vertex
                if (skirt) {
                    vertex[vi*2    ] = -skirtSize;   
                    vertex[vi*2 + 1] = yCoord;   
                    vi++;
                }               
                for (var x = 0; x < samplesX; x++) {
                    vertex[vi*2    ] = x/(samplesX-1);
                    vertex[vi*2 + 1] = yCoord;
                    vi++;
                }
                // Set rightmost skirt vertex
                if (skirt) {
                    vertex[vi*2]     = 1.0 + skirtSize;   
                    vertex[vi*2 + 1] = yCoord;   
                    vi++;
                }                
            }
               
            var quadsX = vX - 1;
            var quadsY = vY - 1;
            
            var indices = new osg.Uint16Array(quadsX*quadsY*6);
            var q = 0;
            for (var y = 0; y < quadsY; y++) {
                vi = y*vX;                
                for (var x = 0; x < quadsX; x++) {
                    indices[q*6 + 0] = vi;
                    indices[q*6 + 1] = vi + 1;
                    indices[q*6 + 2] = vi + vX;
                    indices[q*6 + 3] = vi + vX;
                    indices[q*6 + 4] = vi + 1;
                    indices[q*6 + 5] = vi + vX + 1;
                    vi++;
                    q++;
                }
            }
            
            cacheEntry.primitives = new osg.DrawElements(
                osg.primitiveSet.TRIANGLES,
                new osg.BufferArray(osg.BufferArray.ELEMENT_ARRAY_BUFFER, indices, 1)
            );
            cacheEntry.vertexBuffer = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, vertex, 2);
        }
        else {
            //console.log("Got cache hit for " + gridID);
        }

        var g = new osg.Geometry();        
        g.getAttributes().Vertex = cacheEntry.vertexBuffer; 
        g.getPrimitives().push(cacheEntry.primitives);
        
        
        return g;
    },
    
    _hasTile: function(x, y, level) {
        // if (this._elevationTileSource) {
            return this._elevationTileSource.hasTile(x, y, level);
        // }
        return this._textureTileSource.hasTile(x, y, level);
    },
    
    _getTileExtent: function(x, y, level) {        
        return this._elevationTileSource.getTileExtent(x, y, level);
    },
    
    _hasChildren: function(x, y, level) {
        return (this._elevationTileSource && this._elevationTileSource.hasChildren(x, y, level)) || 
               (this._textureMapTileSource && this._textureMapTileSource.hasChildren(x, y, level));
    },

    /**
     * Fetches normal and texture maps for the given tile, and returns a promise
     * to an osg geometry rendering the tile with textures and normals.
     * 
     * @param {Number}
     *            x,y,level Quadtree tile address
     * 
     */
    createTileForGeometry: function(x, y, level, parentNode) {
        
        var tileExtent = this._getTileExtent(x, y, level);
        if (level >= this._textureMapTileSource._levels) {
            console.log(tileExtent.x0 + ',' + tileExtent.y0 + ' - ' + tileExtent.x1 + ',' + tileExtent.y1);
        }
        
        var x0 = tileExtent.x0;
        var y0 = tileExtent.y0;
        var width =  (tileExtent.x1-tileExtent.x0);
        var height = (tileExtent.y1-tileExtent.y0);
        
        var that = this;
        var createPagedLODGroup = function(parentNode) {
            var childPromises = [];
            
            for (var i = 0; i < 4; i++) {
                var addr = that.childAddress(i, parentNode.x, parentNode.y, parentNode.level);
                (function(child) {
                    if (that._hasTile(child.x, child.y, child.level)) {
                        childPromises.push(that.createTileForGeometry(
                            child.x,
                            child.y,
                            child.level,
                            parentNode
                        ));
                    }
                })(addr);
            }
            return Promise.all(childPromises).then(function(children){
                var group = new osg.Node();
                var i;
                for (i = 0; i < 4; i++) {
                    if (children[i] !== undefined) {
                        group.addChild(children[i]);
                    }
                }
                return group;
            });                
        };
        
        var tileGeometry = this.createGridGeometry(65, 65, 0.2);
        var stateSet = tileGeometry.getOrCreateStateSet();
        
        // Set geometry offset and scale, used to scale and offset the [0..1]^2
        // grid geometry for placement in model space
        var offsetScaleUniform = osg.Uniform.createFloat4(osg.vec4.fromValues(x0, y0, width, height), 'uOffsetScale');
        stateSet.addUniform(offsetScaleUniform);
       
        var levelUniform = osg.Uniform.createFloat1(level, 'uLODLevel');
        stateSet.addUniform(levelUniform);
        
        // Sets a fairly conservative bounding box (due to global min/max
        // height), shouldn't be an issue for
        // the typical dynamic range
        var boundingBox = new osg.BoundingBox();
        boundingBox.expandByVec3(osg.vec3.fromValues(x0, y0, this._heightMin));
        boundingBox.expandByVec3(osg.vec3.fromValues(x0 + width, y0 + height, this._heightMax));
        tileGeometry.setBound(boundingBox);

        var parentTileGeometry; 
        if (parentNode) {
            parentTileGeometry = parentNode.getChild(0);
        }
        
        return this.fetchAndApplyAllTileImagery(x, y, level, tileGeometry, parentTileGeometry).then(function() {
            var tile;
            if (that._hasChildren(x, y, level)) {    
                tile = new osg.PagedLOD();
                tile.setRangeMode(osg.PagedLOD.PIXEL_SIZE_ON_SCREEN);
                tile.addChild(tileGeometry, 0, that.projectedTilePixels);
                tile.setFunction(1, createPagedLODGroup);
                tile.setRange(1, that.projectedTilePixels, Number.MAX_VALUE);
            }
            else {
                // Leaf node
                tile = tileGeometry;
            }                                       
            tile.x = x;
            tile.y = y;
            tile.level = level;
            // tile._name = "node_"+x+"_"+y+"_"+level;
            return tile;
        });
    },

    /**
     * Utility function which returns quadtree address for the given child.
     * 
     * @param {Number}
     *            childIndex
     * @param {Number}
     *            x,y,level Quadtree address of parent
     */
    childAddress: function(childIndex, x, y, level) {
        var dx = childIndex%2;
        var dy = childIndex>>1;
        return {
            x: x*2 + dx,
            y: y*2 + dy,
            level: level + 1
        };
    },
    
    transformSphericalToWorld: function(elevation, azimuth, distance) {
        var direction = osg.vec3.fromValues(Math.cos(azimuth)*Math.cos(elevation), -Math.sin(azimuth)*Math.cos(elevation), Math.sin(elevation));
        osg.vec3.scale(direction, direction, distance);
        return direction;        
    },
    
    transformWorldToSpherical: function(world) {
        var spherical = {};
        spherical.distance = osg.vec3.length(world);
        if (spherical.distance === 0.0) {
            return undefined;
        }
        
        var n = osg.vec3.scale(osg.vec3.create(), world, 1.0/spherical.distance);
       
        var nl = osg.vec2.length(n);
        if (nl < 1.0E-5) {
            spherical.elevation = Math.PI / 2.0;
            spherical.azimuth = 0.0;
            return spherical;
        }
        spherical.elevation = Math.acos(nl);
        spherical.azimuth = -Math.atan2(n[1]*nl, n[0]*nl);
        if (spherical.azimuth < 0.0) {
            spherical.azimuth += 2.0*Math.PI;
        }
        return spherical;
    },  
     
    run: function() {
        var that = this;
        return this._initializationPromise.then(function() {
            that.viewer.run();
        });
    },
    
    getCurrentViewPose: function(){        
        return this.viewer.getManipulator().getCurrentPose();
    },

    setViewPose : function(pose){   
        this.viewer.getManipulator().setPose(pose);
    },

    destroy: function() {
        this.viewer.setDone(true);
        this.viewer.dispose();
    }

};

export default ScanViewer;
