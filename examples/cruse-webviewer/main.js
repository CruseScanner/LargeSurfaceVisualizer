(function() {

    'use strict';
    var OSG = window.OSG;
    
    var cruse = OSG.cruse;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;

    var ScanViewerExample = function() {
        this.gui = undefined;       
        this._config = {
            lodScale: 0.01,
            acceptNewRequests: true,
            elevation : Math.PI/4.0,
            azimuth : Math.PI,
            phongExponent  : 40.0
        };
    };
 
    ScanViewerExample.prototype = {
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
            
            // https://samples.crusescanner.com/iipsrv/iipsrv.fcgi:
            // var imageName = '/var/www/samples/data/SlateTile/SlateTile_L-LA_135mm_600_00_dpi.jpx';
            
            // https://cim.crusescanner.de/iipsrv/iipsrv.fcgi:
            var imageName = '/var/www/crusescanner.de/cim/images/converted/converted_5c890d1f15c0bgoldheartdiffusergb8srgbintentperceptualjpeg.jpx';
            var normalMapName = '/var/www/crusescanner.de/cim/images/converted/converted_5c890cf7c2df5goldheartnormalmaprgb8jpeg.jpx';
                            
            var diffuseTextureTileSource = new cruse.IIPImageTileSource(url, imageName);
            
            // HACK: just use standard textures as normal maps as well
            var normalMapTextureTileSource = new cruse.IIPImageTileSource(url, normalMapName);            
            
            var canvas = document.getElementById('View');
            var scanViewer = new cruse.ScanViewer(canvas, diffuseTextureTileSource, normalMapTextureTileSource);
            
            scanViewer.viewer.getDatabasePager().setProgressCallback(function(a, b) {
                window.setProgress(a + b);
            });

            var lp = scanViewer.getLightParameters();
            this._config.ambient = lp.ambient[0];
            this._config.diffuse = lp.diffuse[0];
            this._config.specular = lp.specular[0];
            this._config.phongExponent = lp.phongExponent;
            
            var that = this;
            this._scanviewer = scanViewer;
            this._config.lodScale = 0.1;
            this.initGui();
            //  Cheat dat gui to show at least two decimals and start at 1.0
            this._config.lodScale = 1.0;
            
            for (var i in that.gui.__controllers) that.gui.__controllers[i].updateDisplay();
           
            scanViewer.run();
        }
    };

    window.addEventListener(
        'load',
        function() {
            var scanViewerExample = new ScanViewerExample();
            scanViewerExample.run();
        },
        true
    );
})();
