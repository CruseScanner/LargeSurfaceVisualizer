import osg from 'osg/osg';
import osgShader from 'osgShader/osgShader';
import osgDB from 'osgDB/osgDB';
import osgViewer from 'osgViewer/osgViewer';
import defined from 'cruse/defined';

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

        rootNode.setMatrix(osg.mat4.fromTranslation(osg.mat4.create(), osg.vec3.fromValues(-w/2, -h/2, 0)));            
        rootNode.addChild(rootTile);
        scanViewer.viewer.setSceneData(rootNode);
        var stateSet = rootNode.getOrCreateStateSet();
        
        scanViewer.setupShader(stateSet);
        scanViewer.setupLight(rootNode);
        
        var boundingSphere = rootTile.getBound();
        scanViewer.viewer.setupManipulator();
        var manipulator = scanViewer.viewer.getManipulator();
        manipulator.setMinSpeed(256*10);
        manipulator.setDistance(boundingSphere.radius() * 1.5);
        manipulator.setLimitPitchDown(5.0*Math.PI/180.0);
    });
};


/**
 * @class ScanViewer
 * @constructor
 * 
 */
var ScanViewer = function(canvasElement, textureMapTileSource, normalMapTileSource) {
    this._renderTextureMaps = false;
    this._renderNormalMaps = false;
    

    this._input = new osgDB.Input();
    this.projectedTilePixels = Math.PI/4.0*256*256;
    
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

    var shaderPromises = [];
    var shaderNames = ['scanviewer.frag.glsl','scanviewer.vert.glsl']; 
    shaderNames.forEach(function(shader) {
        shaderPromises.push(P.resolve($.get(shader)));
    });
   
    var shaderProcessor = this._shaderProcessor;
    promises.push(P.all(shaderPromises).then(function(args) {
        var shaderNameContent = {};
        shaderNames.forEach(function(name, idx) {
            shaderNameContent[name] = args[idx];
        });
        shaderProcessor.addShaders(shaderNameContent);
    }));
    
    this._initializationPromise = Promise.all(promises).then(function() {
        initializeRootNode(that);
    });
      
};  

ScanViewer.prototype = {        
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
        return Promise.all(promises);
    },
        
    
    setupLight : function(node) {
        var stateSet = node.getOrCreateStateSet();
        
        var light = new osg.Light(0);
        this._directionalLight = light;

        light.setDiffuse([1.0, 1.0, 1.0, 1.0]);
        light.setSpecular([1.0, 1.0, 1.0, 1.0]);
        light.setAmbient([0.2, 0.2, 0.2, 1.0]);

        // Setup directional light; n.b. direction only used for positional lights
        light.setPosition([0.0, 0.0, 1.0, 0.0]);

        var lightSource = new osg.LightSource();
        lightSource.setLight(light);
       
        node.addChild(lightSource);

    },
    
    setupShader : function(stateSet) {       
        var material = new osg.Material();
        material.setDiffuse ([1.0, 1.0, 1.0, 1.0]);           
        material.setAmbient ([0.3, 0.3, 0.3, 1.0]);
        material.setEmission([0.0, 0.0, 0.0, 1.0]);
        material.setSpecular([1.0, 0.0, 0.0, 1.0]);
        material.setShininess(1.0);
        stateSet.setAttributeAndModes(material);

        
        if (this._program === undefined)
        {
            var defines = [];
            if (this._renderNormalMaps) defines.push('#define WITH_NORMAL_MAP');
    
            var vertexshader = this._shaderProcessor.getShader('scanviewer.vert.glsl', defines);
            var fragmentshader = this._shaderProcessor.getShader('scanviewer.frag.glsl', defines);
    
            this._program = new osg.Program(
                new osg.Shader('VERTEX_SHADER', vertexshader),
                new osg.Shader('FRAGMENT_SHADER', fragmentshader)
            );
            
            this._program.setTrackAttributes({ attributeKeys : ['Material', 'Light0'] });
        }
       
        stateSet.setAttributeAndModes(this._program);
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
        
        var tileGeometry = osg.createTexturedQuadGeometry(x0, y0, 0, width, 0, 0, 0, height, 0, 0, 0, 1, 1);

        var stateSet = tileGeometry.getOrCreateStateSet(); 
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
   
   
    run: function() {
        var that = this;
        this._initializationPromise.then(function() {
            that.viewer.run();
        });
    }
};

export default ScanViewer;
