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
        
    fetchAndApplyAllTileImagery: function(x, y, level, stateSet) {
        var promises = [];
        if (this._renderTextureMaps)
        {
            promises.push(this.fetchAndApplyTileImagery(x, y, level, stateSet, 0, this._textureMapTileSource));
        }
        
        if (this._renderNormalMaps)
        {
            promises.push(this.fetchAndApplyTileImagery(x, y, level, stateSet, 1, this._normalMapTileSource));
        }
        
        if (this._renderGlossMaps)
        {
            promises.push(this.fetchAndApplyTileImagery(x, y, level, stateSet, 2, this._glossMapTileSource));
        }
        
        if (this._renderDisplacementMaps)
        {
            var promise = this.fetchAndApplyTileImagery(x, y, level, stateSet, 3, this._elevationTileSource);
            var ts = this._elevationTileSource;
            promise.then(function() {
                var e = ts.getRasterExtent(x, y, level);
                
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
        
        stateSet.setAttributeAndModes(this._program);        
    },
    
    createGridGeometry :function(samplesX,samplesY) {
            var g = new osg.Geometry();

            var vertex = new osg.Float32Array(samplesX*samplesY*3);
            for (var y = 0; y < samplesY; y++) {
                for (var x = 0; x < samplesX; x++) {
                    vertex[(x+y*samplesX)*3    ] = x/(samplesX-1);
                    vertex[(x+y*samplesX)*3 + 1] = y/(samplesY-1);
                    vertex[(x+y*samplesX)*3 + 2] = 0.0;
                }
            }
               
            var indices = new osg.Uint16Array((samplesX-1)*(samplesY-1)*6);
            var q = 0;
            for (var y = 0; y < samplesY-1; y++) {
                for (var x = 0; x < samplesX-1; x++) {
                    var o = x + y*samplesX;
                    
                    indices[q*6 + 0] = o;
                    indices[q*6 + 1] = o + 1;
                    indices[q*6 + 2] = o + samplesX;
                    indices[q*6 + 3] = o + samplesX;
                    indices[q*6 + 4] = o + 1;
                    indices[q*6 + 5] = o + samplesX + 1;
                    q++;
                }
            }

            g.getAttributes().Vertex = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, vertex, 3);

            var primitive = new osg.DrawElements(
                osg.primitiveSet.TRIANGLES,
                new osg.BufferArray(osg.BufferArray.ELEMENT_ARRAY_BUFFER, indices, 1)
            );
            g.getPrimitives().push(primitive);
            
            
            return g;
    },

    /**
     * Fetches normal and texture maps for the given tile, and returns a promise
     * to an osg geometry rendering the tile with textures and normals.
     * 
     * @param {Number}
     *            x,y,level Quadtree tile address
     * 
     */
    createTileForGeometry: function(x, y, level) {
        // TODO: implement getTileExtent which dispatches between tmap/normal
        // map as required
        var tileExtent = this._textureMapTileSource.getTileExtent(x, y, level);
        var x0 = tileExtent.x0;
        var y0 = tileExtent.y0;
        var width =  (tileExtent.x1-tileExtent.x0);
        var height = (tileExtent.y1-tileExtent.y0);
        
        var that = this;
        var createPagedLODGroup = function(parent) {
            var childPromises = [];
            
            for (var i = 0; i < 4; i++) {
                var addr = that.childAddress(i, parent.x, parent.y, parent.level);
                (function(child) {
                    if (that._textureMapTileSource.hasTile(child.x, child.y, child.level)) {
                        childPromises.push(that.createTileForGeometry(
                            child.x,
                            child.y,
                            child.level
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
        
        var tileGeometry = this.createGridGeometry(65, 65);
        var stateSet = tileGeometry.getOrCreateStateSet();
        
        stateSet.setAttributeAndModes(new osg.CullFace(osg.CullFace.DISABLE)); 

        var offsetScaleUniform = osg.Uniform.createFloat4(osg.vec4.fromValues(x0, y0, width, height), 'uOffsetScale');
        stateSet.addUniform(offsetScaleUniform);
       
        var levelUniform = osg.Uniform.createFloat1(level, 'uLODLevel');
        stateSet.addUniform(levelUniform);
        
        var boundingBox = new osg.BoundingBox();
        boundingBox.expandByVec3(osg.vec3.fromValues(x0, y0, 0));
        boundingBox.expandByVec3(osg.vec3.fromValues(x0 + width, y0 + height, 0));
        tileGeometry.setBound(boundingBox);


        return this.fetchAndApplyAllTileImagery(x, y, level, stateSet).then(function() {
            var tile;
            if (that._textureMapTileSource.hasChildren(x, y, level)) {
                // LOD node
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
