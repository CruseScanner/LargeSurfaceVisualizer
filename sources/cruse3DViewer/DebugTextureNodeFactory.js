import OSG from 'external/osg';

<<<<<<< HEAD
'use strict';
=======
('use strict');
>>>>>>> UpdateToNewerDependencies

var osg = OSG.osg;

// helps debugging textures by providing an overlay with given texture thumbs
// extracted from osg example.js
<<<<<<< HEAD
var DebugTextureNodeFactory = function(canvas) {
=======
var DebugTextureNodeFactory = function (canvas) {
>>>>>>> UpdateToNewerDependencies
    this._debugNodeRTT = new osg.Node();
    this._debugNodeRTT.setName('debugNodeRTT');
    this._debugNodeRTT.getOrCreateStateSet().setRenderBinDetails(1000, 'RenderBin');
    this._canvas = canvas;
    this._debugProgram = undefined;
    this._debugDepthProgram = undefined;
<<<<<<< HEAD

};

DebugTextureNodeFactory.prototype = { 

    getNode : function() {
        return this._debugNodeRTT;
    },

    addTextures: function(textureList, optionalArgs) {
=======
};

DebugTextureNodeFactory.prototype = {
    getNode: function () {
        return this._debugNodeRTT;
    },

    addTextures: function (textureList, optionalArgs) {
>>>>>>> UpdateToNewerDependencies
        // 20% of the resolution size
        var defaultRatio = 0.3;
        var screenRatio = this._canvas.width / this._canvas.height;
        var defaultWidth = Math.floor(this._canvas.width * defaultRatio);
        var defaultHeight = Math.floor(defaultWidth / screenRatio);

        var optionsDebug = {
            x: 0,
            y: 100,
            w: defaultWidth,
            h: defaultHeight,
            horizontal: true,
            screenW: this._canvas.width,
            screenH: this._canvas.height
        };

        if (optionalArgs) osg.extend(optionsDebug, optionalArgs);

        var debugNodeRTT = this._debugNodeRTT;
        debugNodeRTT.setNodeMask(~0x0);
        debugNodeRTT.removeChildren();

        var debugComposerNode = new osg.Node();
        debugComposerNode.setName('debugComposerNode');
        debugComposerNode.setCullingActive(false);

        // camera
        var debugComposerCamera = new osg.Camera();
        debugComposerCamera.setName('composerDebugCamera');
        debugNodeRTT.addChild(debugComposerCamera);

        // create camera to setup RTT in overlay
        var cameraProjection = debugComposerCamera.getProjectionMatrix();
<<<<<<< HEAD
        osg.mat4.ortho(
            cameraProjection,
            0,
            optionsDebug.screenW,
            0,
            optionsDebug.screenH,
            -5,
            5
        );
=======
        osg.mat4.ortho(cameraProjection, 0, optionsDebug.screenW, 0, optionsDebug.screenH, -5, 5);
>>>>>>> UpdateToNewerDependencies

        var cameraView = debugComposerCamera.getViewMatrix();
        osg.mat4.fromTranslation(cameraView, [0, 0, 0]);

        debugComposerCamera.setRenderOrder(osg.Camera.NESTED_RENDER, 0);
        debugComposerCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
        debugComposerCamera.addChild(debugComposerNode);

        var xOffset = optionsDebug.x;
        var yOffset = optionsDebug.y;

        // why if no in fullscreen we would need to disable depth ?
        debugComposerNode.getOrCreateStateSet().setAttributeAndModes(new osg.Depth('DISABLE'));

        // iterate on each texture to add them as thumbnails
        for (var i = 0, l = textureList.length; i < l; i++) {
            var texture = textureList[i];

            if (texture) {
                var quad = osg.createTexturedQuadGeometry(
                    xOffset,
                    yOffset,
                    0,
                    optionsDebug.w,
                    0,
                    0,
                    0,
                    optionsDebug.h,
                    0
                );

                var stateSet = quad.getOrCreateStateSet();
                quad.setName('debugComposerGeometry' + i);

                stateSet.setTextureAttributeAndModes(0, texture);
                if (texture.getInternalFormat() !== osg.Texture.DEPTH_COMPONENT)
                    stateSet.setAttributeAndModes(this.getDebugProgram());
                else stateSet.setAttributeAndModes(this.getDebugDepthProgram());

                debugComposerNode.addChild(quad);

                if (optionsDebug.horizontal) {
                    xOffset += optionsDebug.w + 2;
                } else {
                    yOffset += optionsDebug.h + 2;
                }
            }
        }
    },

<<<<<<< HEAD
    hide: function() {
        this._debugNodeRTT.setNodeMask(0x0);
    },

    show: function() {
        this._debugNodeRTT.setNodeMask(~0x0);
    },

    toggle: function() {
=======
    hide: function () {
        this._debugNodeRTT.setNodeMask(0x0);
    },

    show: function () {
        this._debugNodeRTT.setNodeMask(~0x0);
    },

    toggle: function () {
>>>>>>> UpdateToNewerDependencies
        if (this._debugNodeRTT.getNodeMask() === 0) {
            this.showDebugTextureList();
        } else this.hideDebugTextureList();
    },

<<<<<<< HEAD
    getDebugProgram: function() {
=======
    getDebugProgram: function () {
>>>>>>> UpdateToNewerDependencies
        if (this._debugProgram === undefined) {
            var vertexShader = [
                '#define SHADER_NAME DEBUG_RTT',
                'attribute vec3 Vertex;',
                'attribute vec2 TexCoord0;',
                'varying vec2 vTexCoord0;',
                'uniform mat4 uModelViewMatrix;',
                'uniform mat4 uProjectionMatrix;',
                'void main(void) {',
                '  gl_Position = uProjectionMatrix * (uModelViewMatrix * vec4(Vertex,1.0));',
                '  vTexCoord0 = TexCoord0;',
                //'  FragTexCoord1 = TexCoord1;',
                '}',
                ''
            ].join('\n');

            var fragmentShader = [
                '#ifdef GL_FRAGMENT_PRECISION_HIGH',
                'precision highp float;',
                '#else',
                'precision mediump float;',
                '#endif',
                '#define SHADER_NAME DEBUG_RTT',
                'varying vec2 vTexCoord0;',
                'uniform sampler2D Texture0;',
                '',
                'void main (void)',
                '{',
                '  vec2 uv = vTexCoord0;',
                '  gl_FragColor = vec4(texture2D(Texture0, uv));',
                '}',
                ''
            ].join('\n');

            this._debugProgram = new osg.Program(
                new osg.Shader('VERTEX_SHADER', vertexShader),
                new osg.Shader('FRAGMENT_SHADER', fragmentShader)
            );
        }
        return this._debugProgram;
    },

<<<<<<< HEAD
    getDebugDepthProgram: function() {
=======
    getDebugDepthProgram: function () {
>>>>>>> UpdateToNewerDependencies
        if (this._debugDepthProgram === undefined) {
            var vertexShader = [
                '#define SHADER_NAME DEBUG_RTT',
                'attribute vec3 Vertex;',
                'attribute vec2 TexCoord0;',
                'varying vec2 vTexCoord0;',
                'uniform mat4 uModelViewMatrix;',
                'uniform mat4 uProjectionMatrix;',
                'void main(void) {',
                '  gl_Position = uProjectionMatrix * (uModelViewMatrix * vec4(Vertex,1.0));',
                '  vTexCoord0 = TexCoord0;',
                //'  FragTexCoord1 = TexCoord1;',
                '}',
                ''
            ].join('\n');

            var fragmentShader = [
                '#ifdef GL_FRAGMENT_PRECISION_HIGH',
                'precision highp float;',
                '#else',
                'precision mediump float;',
                '#endif',
                '#define SHADER_NAME DEBUG_RTT',
                'varying vec2 vTexCoord0;',
                'uniform sampler2D Texture0;',
                '',
                'void main (void)',
                '{',
                '  vec2 uv = vTexCoord0;',
                '  vec4 color = vec4(texture2D(Texture0, uv));',
                '  gl_FragColor = vec4( color.r, color.r, color.r, 1.0 );',
                '}',
                ''
            ].join('\n');

            this._debugDepthProgram = new osg.Program(
                new osg.Shader('VERTEX_SHADER', vertexShader),
                new osg.Shader('FRAGMENT_SHADER', fragmentShader)
            );
        }
        return this._debugDepthProgram;
<<<<<<< HEAD
    },
};

export default DebugTextureNodeFactory;
=======
    }
};

export default DebugTextureNodeFactory;
>>>>>>> UpdateToNewerDependencies
