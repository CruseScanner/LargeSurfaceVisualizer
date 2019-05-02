
import OSG from 'external/osg';

import IIPImageTileSource from 'cruse3DViewer/IIPImageTileSource';
import ScanViewer from 'cruse3DViewer/ScanViewer';
import defined from 'tools/defined';

var osg = OSG.osg;

'use strict';

/**
* @class ScanViewer
* @constructor
* 
*/
var ScanViewerWidget = function(elementOrElementId) {
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

    if (typeof elementOrElementId === 'string' || elementOrElementId instanceof String)
    {
        this._viewDivElement = document.getElementById(elementOrElementId);
    }   
    else
    {
        this._viewDivElement = elementOrElementId;
    }
};

ScanViewerWidget.prototype = {
    initGui: function() {
     
        this.gui = new window.dat.GUI();
        this.gui.closed = true;
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

    createCanvas: function() {
        var canvas = this._viewDivElement.getElementsByTagName('canvas')[0];

        if(canvas == null)
        {
            canvas = document.createElement('canvas');
            canvas.style.height = '100%';
            canvas.style.width = '100%';
            canvas.oncontextmenu = function() { return false; };
            this._viewDivElement.appendChild(canvas);
        }

        return canvas;
    },

    createInfoElement: function() {
        var infoElement = document.getElementById('cruse-scanviewerwidget-info-id');

        if(infoElement == null)
        {
            infoElement = document.createElement('div');
            infoElement.className = "cruse-scanviewer-info";
            infoElement.id = "cruse-scanviewer-info-id";

            var descriptionElement = document.createElement('div');
            descriptionElement.className = "cruse-scanviewer-description";
            descriptionElement.innerText = "Requests";
            infoElement.appendChild(descriptionElement);

            var progressFrame = document.createElement('div');
            progressFrame.style.border = "1px solid #a4b6bd";
            progressFrame.style.width = "220px";
            progressFrame.style.height = "5px";
            progressFrame.style.clear = "both";
            infoElement.appendChild(progressFrame);

            this._progressElement = document.createElement('div');
            this._progressElement.id = "progress";
            this._progressElement.style.backgroundColor= "rgb(0, 174, 239)";
            this._progressElement.style.width = "0px";
            this._progressElement.style.height = "5px";          
            progressFrame.appendChild(this._progressElement);        

            this._viewDivElement.appendChild(infoElement);
        } 
        
        return infoElement;
    },
    
    createSideBar: function(viewElement) {
        
        var parentElement = viewElement.parentElement;
        
        var sideBarElement = document.createElement('div');
        sideBarElement.className = 'cruse-scanviewer-sidebar';
        
        parentElement.insertBefore(sideBarElement, viewElement);
        
        var openSideBar = function() {
            sideBarElement.style.width = "250px";
            viewElement.style.marginLeft = "250px";
        };

        var closeSideBar = function () {
            sideBarElement.style.width = "0";
            viewElement.style.marginLeft= "0";
        };
        
        openSideBar();
        
        return sideBarElement;
    },
    
    createLightSourceDialog: function(scanViewer, parentElement) {
        
        var lightSourceDialogElement = document.getElementById('cruse-scanviewerwidget-lightsource-dialog');
        
        // TODO: update callbacks to modify the correct scanViewer 
        if (lightSourceDialogElement == null) {
            
            var lightSourceDialogElement = document.createElement('div');
            lightSourceDialogElement.className = 'cruse-scanviewer-lightsource-dialog';

            var lightSourceHemisphereElement = document.createElement('div');
            lightSourceHemisphereElement.className = 'cruse-scanviewer-lightsource-hemisphere';
            
            // Create absolutely positioned element so that pointer coordinates can be specified relative to the hemisphere div 
            var lightSourceHemisphereWrapElement = document.createElement('div');
            lightSourceHemisphereWrapElement.style = 'position: absolute';
            
                 
            var lightSourcePointerElement = document.createElement('div');
            lightSourcePointerElement.className = 'cruse-scanviewer-lightsource-pointer';
            lightSourcePointerElement.id = 'cruse-scanviewer-lightsource-pointer0';
         
            
                   
          
            var lightSourceDiffuseSliderElement = document.createElement('input');
            lightSourceDiffuseSliderElement.className = 'cruse-scanviewer-lightsource-slider';
            lightSourceDiffuseSliderElement.id = 'cruse-scanviewer-lightsource-diffuse-slider0';
            lightSourceDiffuseSliderElement.type = 'range';
            lightSourceDiffuseSliderElement.min = 0;
            lightSourceDiffuseSliderElement.max = 100;
            lightSourceDiffuseSliderElement.value = 100;
            
            
            var lightSourceSpecularSliderElement = document.createElement('input');
            lightSourceSpecularSliderElement.className = 'cruse-scanviewer-lightsource-slider';
            lightSourceSpecularSliderElement.id = 'cruse-scanviewer-lightsource-specular-slider0';
            lightSourceSpecularSliderElement.type = 'range';
            lightSourceSpecularSliderElement.min = 0;
            lightSourceSpecularSliderElement.max = 100;
            lightSourceSpecularSliderElement.value = 100; 
            

            var updateDiffuse = function() {
                var lp = scanViewer.getLightParameters();
                var diffuse = lightSourceDiffuseSliderElement.value/100.0;
                lp.diffuse = osg.vec4.fromValues(diffuse, diffuse, diffuse, 1.0);
                scanViewer.setLightParameters(lp.ambient, lp.diffuse, lp.specular, lp.phongExponent);
            };
            var updateSpecular = function() {
                var lp = scanViewer.getLightParameters();
                var specular = lightSourceSpecularSliderElement.value/100.0;
                lp.specular = osg.vec4.fromValues(specular, specular, specular, 1.0);
                scanViewer.setLightParameters(lp.ambient, lp.diffuse, lp.specular, lp.phongExponent);
            };          
          
            lightSourceDiffuseSliderElement.oninput = updateDiffuse;
            lightSourceDiffuseSliderElement.onchange = updateDiffuse;

            lightSourceSpecularSliderElement.oninput = updateSpecular;
            lightSourceSpecularSliderElement.onchange = updateSpecular;
            
            lightSourceHemisphereElement.appendChild(lightSourceHemisphereWrapElement);                       
            lightSourceHemisphereWrapElement.appendChild(lightSourcePointerElement);
            lightSourceDialogElement.appendChild(lightSourceHemisphereElement);
            lightSourceDialogElement.appendChild(lightSourceDiffuseSliderElement);
            lightSourceDialogElement.appendChild(lightSourceSpecularSliderElement);
            parentElement.appendChild(lightSourceDialogElement);

            var dragging = false;
            lightSourcePointerElement.onmousedown = function(e) {
                //if (e.button === 1) {
                    dragging = true;
                //}
            }
            window.onmouseup = function(e) {
                //if (e.button === 1) {
                    dragging = false;
                //}
            }
            

            window.onmousemove = function(e) {
                if (!dragging) {
                    return;
                }
                var rect = lightSourceHemisphereElement.getBoundingClientRect();
                var radius = rect.width/2; 
                var centerx = rect.x + radius;
                var centery = rect.y + radius;

                var x = e.x - centerx;
                var y = e.y - centery;
                var r = Math.sqrt(x*x + y*y);
                if (r > 0.0) {
                    var scale = 1.0/Math.max(radius, r);
                    x*= scale;
                    y*= scale;
                }               
                var z = Math.sqrt(Math.max(0.0, 1.0 - (x*x + y*y)));
                
                var elevation = Math.asin(z);
                var azimuth = Math.atan2(y, x);
                
                scanViewer.setDirectionalLight(elevation, azimuth);
                
                x*= radius;    
                y*= radius;
                x+= radius;
                y+= radius;
                
                lightSourcePointerElement.style.left = x + 'px';
                lightSourcePointerElement.style.top  = y + 'px';
            }           
        }
    },

    setProgress: function(percent) {
        this._progressElement.style.width = percent + "px";
    },

    run: function(shadingProject) {
        // Get 3D canvas.
        var url = shadingProject.server || '/iipsrv/iipsrv.fcgi';

        this._shadingProject = shadingProject;

        var options = {};
        
        options.textureMapTileSource = new IIPImageTileSource(url, this._shadingProject.DiffuseColor);           
        options.normalMapTileSource = new IIPImageTileSource(url, this._shadingProject.NormalMap);
        
        if (defined(this._shadingProject.GlossMap)) {
            options.glossMapTextureTileSource = new IIPImageTileSource(url, this._shadingProject.GlossMap);
        }
        
        // Set optional elevation map for displacement
        // TODO: require meta-data
        if (defined(this._shadingProject.ElevationMap)) {
            options.elevationTileSource = new IIPImageTileSource(url, this._shadingProject.ElevationMap);
        }

        
        var canvas = this.createCanvas();
        this.createInfoElement();

        if(this._scanViewer != undefined) {
            this.stop();
        }

        
        var scanViewer = new ScanViewer(canvas, options);
        
        this._sideBar = this.createSideBar(this._viewDivElement); 
        this.createLightSourceDialog(scanViewer, this._sideBar);
       
        
                
        var that = this;
       
        scanViewer.viewer.getDatabasePager().setProgressCallback(function(a, b) {
            that.setProgress(a + b);
        });

        var lp = scanViewer.getLightParameters();
        this._config.ambient = this._shadingProject.ambient || lp.ambient[0];
        this._config.diffuse = this._shadingProject.diffuse || lp.diffuse[0];
        this._config.specular = this._shadingProject.specular || lp.specular[0];
        this._config.phongExponent = this._shadingProject.phongExponent || lp.phongExponent;
        
       
        this._scanviewer = scanViewer;
        this._config.lodScale = 0.1;
        this.initGui();
        // Cheat dat gui to show at least two decimals and start at 1.0
        this._config.lodScale = 1.0;
        
        that.gui.__controllers.forEach(function(c) { c.updateDisplay(); });
        
        scanViewer.setLightParameters(
            [this._config.ambient, this._config.ambient, this._config.ambient, 1.0], 
            [this._config.diffuse, this._config.diffuse, this._config.diffuse, 1.0],
            [this._config.specular, this._config.specular, this._config.specular, 1.0],
            this._config.phongExponent
        );

        scanViewer.setDirectionalLight(this._config.elevation, this._config.azimuth);

        return scanViewer.run();
    },

    stop: function()
    {
        if(this._scanviewer == undefined)
        {
            return;
        }

        this._scanviewer.destroy();
        this._scanviewer = undefined;
        this.gui.destroy();        
    },

    destroy: function()
    {
        this.stop();
        while (this._viewDivElement.firstChild) {
            this._viewDivElement.removeChild(this._viewDivElement.firstChild);
        }
    },

    getCurrentViewPose: function(){        
        return this._scanviewer.getCurrentViewPose();
    },

    setViewPose : function(pose){
        this._scanviewer.setViewPose(pose);
    }
};

export default ScanViewerWidget;
