import osg from 'osg/osg';
import IIPImageTileSource from 'cruse/IIPImageTileSource';
import ScanViewer from 'cruse/ScanViewer';

'use strict';

/**
* @class ScanViewer
* @constructor
* 
*/
var ScanViewerWidget = function(id, shadingProject) {
    this.gui = undefined;       
    this._config = {
        lodScale: 0.01,
        acceptNewRequests: true,
        elevation : Math.PI/4.0,
        azimuth : Math.PI,
        phongExponent  : 40.0,
        specular : 0.2,
        ambient : 0.1,
        LODVisualization : false
    };
    this._elementId = id;
    this._shadingProject = shadingProject;
};

ScanViewerWidget.prototype = {
    initGui: function() {
        this.gui = new window.dat.GUI();
        var scanviewer = this._scanviewer;
        // config to let dat.gui change the scale
        var lodScaleController = this.gui.add(this._config, 'lodScale', 0.01, 3.0);
        var elevationController = this.gui.add(this._config, 'elevation', 0.00, Math.PI/2.0);
        var azimuthController = this.gui.add(this._config, 'azimuth', 0.0, 2.0*Math.PI);
        var diffuseController = this.gui.add(this._config, 'diffuse', 0.0, 1.0);
        var specularController = this.gui.add(this._config, 'specular', 0.0, 1.0);
        var ambientController = this.gui.add(this._config, 'ambient', 0.0, 1.0);
        var phongExponentController = this.gui.add(this._config, 'phongExponent', 2.00, 128.0);
        
        
        lodScaleController.onChange(function(value) {
            scanviewer.viewer.getCamera().getRenderer().getCullVisitor().setLODScale(value);
        });
        
        var config = this._config;
        var updateLightPosition = function() {
            scanviewer.setDirectionalLight(config.elevation, config.azimuth);
        };
        
        var updateLightParameters = function(value) {
            scanviewer.setLightParameters(
                    [config.ambient, config.ambient, config.ambient, 1.0], 
                    [config.diffuse, config.diffuse, config.diffuse, 1.0],
                    [config.specular, config.specular, config.specular, 1.0],
                    config.phongExponent
            );
        };
        
        
        azimuthController.onChange(updateLightPosition);
        elevationController.onChange(updateLightPosition);
        phongExponentController.onChange(updateLightParameters);
        diffuseController.onChange(updateLightParameters);
        specularController.onChange(updateLightParameters);
        ambientController.onChange(updateLightParameters);
        
        
        var acceptRequestscontroller = this.gui.add(this._config, 'acceptNewRequests');
        acceptRequestscontroller.onChange(function(value) {
            self.viewer.getDatabasePager().setAcceptNewDatabaseRequests(value);
        });

        var enableLODDebugController = this.gui.add(this._config, 'LODVisualization');
        enableLODDebugController.onChange(function(value) {
            scanviewer.setEnableLODVisualization(value);
        });

        this._config['lostContext'] = function() {
            var gl = scanviewer.viewer.getGraphicContext();
            var ext = gl.getExtension('WEBGL_lose_context');
            if (!ext) {
                osg.log('missing WEBGL_lose_context extension');
                return;
            }
            ext.loseContext();
            window.setTimeout(function() {
                ext.restoreContext(gl);
            }, 0);
        }.bind(this);
        this.gui.add(this._config, 'lostContext');
    },

    run: function() {
        // Get 3D canvas.
        var url = '/iipsrv/iipsrv.fcgi';
                
        var diffuseTextureTileSource = new IIPImageTileSource(url, this._shadingProject.DiffuseColor);           
        var normalMapTextureTileSource = new IIPImageTileSource(url, this._shadingProject.NormalMap);            
        
        var viewDivElement = document.getElementById(this._elementId);
        var canvas = viewDivElement.getElementsByTagName('canvas')[0];

        if(canvas == null)
        {
            canvas = document.createElement('canvas');
            canvas.style.height = '100%';
            canvas.style.width = '100%';
            canvas.oncontextmenu = () => false;
        }

        var scanViewer = new ScanViewer(canvas, diffuseTextureTileSource, normalMapTextureTileSource);
        
        scanViewer.viewer.getDatabasePager().setProgressCallback(function(a, b) {
            window.setProgress(a + b);
        });

        var lp = scanViewer.getLightParameters();
        this._config.ambient = this._shadingProject.ambient || lp.ambient[0];
        this._config.diffuse = this._shadingProject.diffuse || lp.diffuse[0];
        this._config.specular = this._shadingProject.specular || lp.specular[0];
        this._config.phongExponent = this._shadingProject.phongExponent || lp.phongExponent;
        
        var that = this;
        this._scanviewer = scanViewer;
        this._config.lodScale = 0.1;
        this.initGui();
        //  Cheat dat gui to show at least two decimals and start at 1.0
        this._config.lodScale = 1.0;
        
        for (var i in that.gui.__controllers) that.gui.__controllers[i].updateDisplay();
        
        scanViewer.setLightParameters(
            [this._config.ambient, this._config.ambient, this._config.ambient, 1.0], 
            [this._config.diffuse, this._config.diffuse, this._config.diffuse, 1.0],
            [this._config.specular, this._config.specular, this._config.specular, 1.0],
            this._config.phongExponent
        );

        scanViewer.setDirectionalLight(this._config.elevation, this._config.azimuth);

        scanViewer.run();
    }
};

export default ScanViewerWidget;
