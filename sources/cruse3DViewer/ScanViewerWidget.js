import OSG from 'external/osg';

import IIPImageTileSource from 'cruse3DViewer/IIPImageTileSource';
import ScanViewer from 'cruse3DViewer/ScanViewer';
import defined from 'tools/defined';
import LightSourceDialog from 'cruse3DViewer/LightSourceDialog';

var osg = OSG.osg;

('use strict');

/**
 * @class ScanViewer
 * @constructor
 *
 */
var ScanViewerWidget = function (elementOrElementId, sideBarElement) {
    this.gui = undefined;
    this._config = {
        lodScale: 0.01,
        acceptNewRequests: true,
        phongExponent: 40.0,
        ambient: 0.1,
        LODVisualization: false
    };

    if (typeof elementOrElementId === 'string' || elementOrElementId instanceof String) {
        this._viewDivElement = document.getElementById(elementOrElementId);
    } else {
        this._viewDivElement = elementOrElementId;
    }

    if (defined(sideBarElement)) {
        this._sideBar = sideBarElement;
    }
};

function setupShadingParameters(scanViewer, shadingParameters) {
    if (defined(shadingParameters) && defined(shadingParameters.LightSources)) {
        var lp = scanViewer.getLightParameters(0);
        var ambient = defined(shadingParameters.Ambient)
            ? shadingParameters.Ambient
            : lp.ambient[0];
        var phongExponent = defined(shadingParameters.PhongExponent)
            ? shadingParameters.PhongExponent
            : lp.phongExponent;

        var lightCount = shadingParameters.LightSources.length;
        for (var i = 0; i < lightCount; i++) {
            var ls = shadingParameters.LightSources[i];

            var diffuse = defined(ls.Diffuse)
                ? [ls.Diffuse, ls.Diffuse, ls.Diffuse, 1.0]
                : lp.diffuse;
            var specular = defined(ls.Specular)
                ? [ls.Specular, ls.Specular, ls.Specular, 1.0]
                : lp.specular;

            scanViewer.setLightParameters(
                i,
                i == 0 ? [ambient, ambient, ambient, 1.0] : [0.0, 0.0, 0.0, 1.0], // set global ambient for first light source only
                diffuse,
                specular,
                phongExponent
            );

            if (ls.LightPosition) {
                scanViewer.setDirectionalLight(
                    i,
                    ls.LightPosition.Elevation,
                    ls.LightPosition.Azimuth
                );
            }
        }
    } else {
        scanViewer.setLightParameters(
            0,
            [0.2, 0.2, 0.2, 1.0],
            [0.8, 0.8, 0.8, 1.0],
            [0.8, 0.8, 0.8, 1.0],
            80.0
        );
        scanViewer.setDirectionalLight(0, Math.PI / 4, 0.0);
    }
}

ScanViewerWidget.prototype = {
    initGui: function () {
        this.gui = new window.dat.GUI();
        this.gui.closed = true;
        var scanviewer = this._scanviewer;
        // config to let dat.gui change the scale
        var lodScaleController = this.gui.add(this._config, 'lodScale', 0.01, 3.0);
        var ambientController = this.gui.add(this._config, 'ambient', 0.0, 1.0);
        var phongExponentController = this.gui.add(this._config, 'phongExponent', 2.0, 128.0);

        lodScaleController.onChange(function (value) {
            scanviewer.viewer.getCamera().getRenderer().getCullVisitor().setLODScale(value);
        });

        var config = this._config;
        var updateLightParameters = function (value) {
            var lp = scanviewer.getLightParameters(0);
            scanviewer.setLightParameters(
                0,
                [config.ambient, config.ambient, config.ambient, 1.0],
                lp.diffuse,
                lp.specular,
                config.phongExponent
            );
        };

        phongExponentController.onChange(updateLightParameters);
        ambientController.onChange(updateLightParameters);

        var acceptRequestscontroller = this.gui.add(this._config, 'acceptNewRequests');
        acceptRequestscontroller.onChange(function (value) {
            scanviewer.viewer.getDatabasePager().setAcceptNewDatabaseRequests(value);
        });

        var enableLODDebugController = this.gui.add(this._config, 'LODVisualization');
        enableLODDebugController.onChange(function (value) {
            scanviewer.setEnableLODVisualization(value);
        });

        this._config['lostContext'] = function () {
            var gl = scanviewer.viewer.getGraphicContext();
            var ext = gl.getExtension('WEBGL_lose_context');
            if (!ext) {
                osg.log('missing WEBGL_lose_context extension');
                return;
            }
            ext.loseContext();
            window.setTimeout(function () {
                ext.restoreContext(gl);
            }, 0);
        }.bind(this);
        this.gui.add(this._config, 'lostContext');
    },

    createCanvas: function () {
        var canvas = this._viewDivElement.getElementsByTagName('canvas')[0];

        if (canvas == null) {
            canvas = document.createElement('canvas');
            canvas.style.height = '100%';
            canvas.style.width = '100%';
            canvas.oncontextmenu = function () {
                return false;
            };
            this._viewDivElement.appendChild(canvas);
        }

        return canvas;
    },

    createInfoElement: function () {
        var infoElement = document.getElementById('cruse-scanviewerwidget-info-id');

        if (infoElement == null) {
            infoElement = document.createElement('div');
            infoElement.className = 'cruse-scanviewer-info';
            infoElement.id = 'cruse-scanviewer-info-id';

            var descriptionElement = document.createElement('div');
            descriptionElement.className = 'cruse-scanviewer-description';
            descriptionElement.innerText = 'Requests';
            infoElement.appendChild(descriptionElement);

            var progressFrame = document.createElement('div');
            progressFrame.style.border = '1px solid #a4b6bd';
            progressFrame.style.width = '220px';
            progressFrame.style.height = '5px';
            progressFrame.style.clear = 'both';
            infoElement.appendChild(progressFrame);

            this._progressElement = document.createElement('div');
            this._progressElement.id = 'progress';
            this._progressElement.style.backgroundColor = 'rgb(0, 174, 239)';
            this._progressElement.style.width = '0px';
            this._progressElement.style.height = '5px';
            progressFrame.appendChild(this._progressElement);

            this._viewDivElement.appendChild(infoElement);
        }

        return infoElement;
    },

    createSideBar: function (viewElement) {
        var parentElement = viewElement.parentElement;

        var sideBarElement = document.createElement('div');
        sideBarElement.className = 'cruse-scanviewer-sidebar';

        parentElement.insertBefore(sideBarElement, viewElement);

        var openSideBar = function () {
            sideBarElement.style.width = '250px';
            viewElement.style.marginLeft = '250px';
        };

        var closeSideBar = function () {
            sideBarElement.style.width = '0px';
            viewElement.style.marginLeft = '0px';
        };

        closeSideBar();

        return sideBarElement;
    },

    createLightSourceDialog: function (scanViewer, parentElement) {
        this._lightSourceDialog = new LightSourceDialog(scanViewer, parentElement);
    },

    setProgress: function (percent) {
        this._progressElement.style.width = percent + 'px';
    },

    run: function (shadingProject, showAdvancedControls) {
        var url = shadingProject.server || '/iipsrv/iipsrv.fcgi';

        this._shadingProject = shadingProject;

        var options = JSON.parse(JSON.stringify(shadingProject));

        options.textureMapTileSource = new IIPImageTileSource(
            url,
            this._shadingProject.DiffuseColor,
            { pixelScale: shadingProject.pixelSize }
        );

        if (defined(this._shadingProject.NormalMap)) {
            options.normalMapTileSource = new IIPImageTileSource(
                url,
                this._shadingProject.NormalMap,
                { pixelScale: shadingProject.pixelSize }
            );
        }
        if (defined(this._shadingProject.GlossMap)) {
            options.glossMapTileSource = new IIPImageTileSource(
                url,
                this._shadingProject.GlossMap,
                { pixelScale: shadingProject.pixelSize }
            );
        }

        // Set optional elevation map for displacement
        if (defined(this._shadingProject.ElevationMap)) {
            options.elevationTileSource = new IIPImageTileSource(
                url,
                this._shadingProject.ElevationMap,
                { tileSize: 64, border: 1, pixelScale: shadingProject.pixelSize }
            );
        }

        // Get 3D canvas.
        var canvas = this.createCanvas();
        this.createInfoElement();

        if (this._scanViewer != undefined) {
            this.stop();
        }

        var scanViewer = new ScanViewer(canvas, options);

        // Creating page with sidebar open is extremly slow (takes >1 sec for initial startup/layouting), WHY?

        if (!defined(this._sideBar)) {
            this._sideBar = this.createSideBar(this._viewDivElement);
        }

        if (!defined(this._lightSourceDialog)) {
            this._lightSourceDialog = new LightSourceDialog(scanViewer, this._sideBar);
        }

        var that = this;
        scanViewer.viewer.getDatabasePager().setProgressCallback(function (a, b) {
            that.setProgress(a + b);
        });

        this._scanviewer = scanViewer;
        setupShadingParameters(this._scanviewer, shadingProject.Shading);
        // Update light source dialog to reflect scanViewer state
        if (defined(this._lightSourceDialog)) {
            this._lightSourceDialog.update(scanViewer, 0);
        }

        this._config.phongExponent = scanViewer.getLightParameters(0).phongExponent;

        if (showAdvancedControls) {
            // Cheat dat gui to show at least two decimals and start at 1.0
            this._config.lodScale = 0.1;

            this.initGui();

            this._config.lodScale = 1.0;

            that.gui.__controllers.forEach(function (c) {
                c.updateDisplay();
            });
        }
        return scanViewer.run();
    },

    stop: function () {
        if (this._scanviewer == undefined) {
            return;
        }

        this._scanviewer.destroy();
        this._scanviewer = undefined;

        if (this.gui != undefined) {
            this.gui.destroy();
        }
    },

    destroy: function () {
        this.stop();
        while (this._viewDivElement.firstChild) {
            this._viewDivElement.removeChild(this._viewDivElement.firstChild);
        }
    },

    getCurrentViewPose: function () {
        return this._scanviewer.getCurrentViewPose();
    },

    setViewPose: function (pose) {
        this._scanviewer.setViewPose(pose);
    },

    zoomIn: function () {
        this._scanviewer.zoomIn();
    },

    zoomOut: function () {
        this._scanviewer.zoomOut();
    },

    resetView: function () {
        this._scanviewer.resetView();
    }
};

export default ScanViewerWidget;
