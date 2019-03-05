import osg from 'osg/osg';
import osgDB from 'osgDB/osgDB';
import osgViewer from 'osgViewer/osgViewer';

'use strict';

/**
 * @class ScanViewer
 * @constructor
 * 
 */
var ScanViewer = function(canvasElement) {
    this._input = new osgDB.Input();
    this.projectedTilePixels = Math.PI/4.0*256*256;
    
    this.viewer = new osgViewer.Viewer(canvasElement, {
        enableFrustumCulling: true
    });
    this.viewer.init();
   
};

ScanViewer.prototype = {      
    /**
     * Fetches normal and texture maps for the given tile, and returns a promise
     * to an osg geometry rendering the tile with textures and normals.
     * 
     * @param {Number} x,y,level Quadtree tile address
     * 
     */
    createTileForGeometry: function(x, y, level) {
        var tileGeometry = this._tileSource.getTileExtent(x, y, level);
        var x0 = tileGeometry.x0;
        var y0 = tileGeometry.y0;
        var width = (tileGeometry.x1-tileGeometry.x0)+1;
        var height = (tileGeometry.y1-tileGeometry.y0)+1;
        
        var url = this._tileSource.getTileURL(x, y, level);

        var that = this;
        var createPagedLODGroup = function(parent) {
            var childPromises = [];
            
            for (var i = 0; i < 4; i++) {
                var addr = that.childAddress(i, parent.x, parent.y, parent.level);
                (function(child) {
                    if (that._tileSource.hasTile(child.x, child.y, child.level)) {
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
        }
        
        var image = new osg.Image();
        var options = {
                imageCrossOrigin : true            
        };

        return this._input.fetchImage(image, url, options).then(function(img) {
            var texture = new osg.Texture();
            texture.setImage(img);
            return texture;
        }).then(function(texture) {
            var tileGeometry = osg.createTexturedQuadGeometry(x0, y0, 0, width, 0, 0, 0, height, 0, 0, 1, 1, 0);
            var material = new osg.Material();
            material.setDiffuse ([1.0, 1.0, 1.0, 1.0]);           
            material.setAmbient ([0.3, 0.3, 0.3, 1.0]);
            material.setEmission([0.0, 0.0, 0.0, 1.0]);
            material.setSpecular([0.0, 0.0, 0.0, 1.0]);
            material.setShininess(1.0);
            
            var stateSet = tileGeometry.getOrCreateStateSet(); 
            stateSet.setAttributeAndModes(material);
            stateSet.setTextureAttributeAndModes(0, texture);
            
            
            var tile;          
            if (that._tileSource.hasChildren(x, y, level)) {
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
     * @param {Number} childIndex 
     * @param {Number} x,y,level Quadtree address of parent
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
   
    setupRootNode() {
        var that = this;
        return that.createTileForGeometry(
            0,
            0,
            0
        ).then(function(rootTile) {
            that.viewer.setSceneData(rootTile);
            var boundingSphere = rootTile.getBound();
            that.viewer.setupManipulator();
            that.viewer.getManipulator().setMinSpeed(256*10);
            that.viewer.getManipulator().setDistance(boundingSphere.radius() * 1.5);
        });
    },
    
    run: function() {
        this.viewer.run();
    }
};

export default ScanViewer;
