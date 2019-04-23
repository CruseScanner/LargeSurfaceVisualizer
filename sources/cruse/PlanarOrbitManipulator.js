import OSG from 'cruse/osg';
import utils from 'tools/utils';

var vec3 = OSG.osg.vec3;
var mat4 = OSG.osg.mat4;

var OrbitManipulator = OSG.osgGA.OrbitManipulator;
var OrbitManipulatorDeviceOrientationController = OSG.osgGA.OrbitManipulatorDeviceOrientationController;
var OrbitManipulatorGamePadController = OSG.osgGA.OrbitManipulatorGamePadController;
var OrbitManipulatorHammerController = OSG.osgGA.OrbitManipulatorHammerController;
var OrbitManipulatorStandardMouseKeyboardController = OSG.osgGA.OrbitManipulatorStandardMouseKeyboardController;
var OrbitManipulatorWebVRController = OSG.osgGA.OrbitManipulatorWebVRController;
var BoundingBox = OSG.osg.BoundingBox;

/**
 *  PlanarOrbitManipulator
 *  @class
 */
var PlanarOrbitManipulator = function(options) {
    OrbitManipulator.call(this, options);
    this._cage = new BoundingBox();
};

PlanarOrbitManipulator.AvailableControllerList = [
    'StandardMouseKeyboard',
    'GamePad',
    'Hammer',
    'DeviceOrientation',
    'WebVR'
];

PlanarOrbitManipulator.ControllerList = [
    'StandardMouseKeyboard',
    'GamePad',
    'Hammer',
    'DeviceOrientation',
    'WebVR'
];

/** @lends PlanarOrbitManipulator.prototype */
utils.createPrototypeObject(
    PlanarOrbitManipulator,
    utils.objectInherit(OrbitManipulator.prototype, {
        setCage: function(cage) {
            this._cage = cage;
        },
        computePan: (function() {
            var inv = mat4.create();
            var x = vec3.create();
            var y = vec3.create();
            return function(dx, dy) {
                var proj = this._camera.getProjectionMatrix();
                // modulate panning speed with verticalFov value
                // if it's an orthographic we don't change the panning speed
                // TODO : manipulators in osgjs don't support well true orthographic camera anyway because they
                // manage the view matrix (and you need to edit the projection matrix to 'zoom' for true ortho camera)
                var vFov = proj[15] === 1 ? 1.0 : 2.0 / proj[5];
                var speed = this.getSpeedFactor() * vFov;
                dy *= speed;
                dx *= speed;

                mat4.invert(inv, this._rotation);
                x[0] = inv[0];
                x[1] = inv[1];
                x[2] = 0;
                vec3.normalize(x, x);

                y[0] = inv[8];
                y[1] = inv[9];
                y[2] = 0;
                vec3.normalize(y, y);

                vec3.scale(x, x, -dx);
                vec3.scale(y, y, dy);
                vec3.add(this._target, this._target, x);
                vec3.add(this._target, this._target, y);
                
                if (this._cage.valid()) {
                    vec3.min(this._target, this._target, this._cage.getMax()); 
                    vec3.max(this._target, this._target, this._cage.getMin()); 
                }
                    
            };
        })(),

        getCurrentPose: function(){
            var pose = {
                'rotation' : this._rotation,
                'rotate' : this._rotate._current,
                'pan' : this._pan._current,
                'zoom' : this._zoom._current,
                'target' : this._target,
                'distance' : this._distance
            };
            return pose;
        },

        setPose : function(pose){
            this._rotation = pose.rotation;
            this._rotate.setTarget(pose.rotate[0], pose.rotate[1]);
            this._pan.setTarget(pose.pan[0], pose.pan[1]);
            this._zoom.setTarget(pose.zoom[0]);
            this._target = pose.target;
            this._distance = pose.distance;                        
        }
    }),
    'cruse',
    'PlanarOrbitManipulator'
);

PlanarOrbitManipulator.DeviceOrientation = OrbitManipulatorDeviceOrientationController;
PlanarOrbitManipulator.GamePad = OrbitManipulatorGamePadController;
PlanarOrbitManipulator.Hammer = OrbitManipulatorHammerController;
PlanarOrbitManipulator.WebVR = OrbitManipulatorWebVRController;
PlanarOrbitManipulator.StandardMouseKeyboard = OrbitManipulatorStandardMouseKeyboardController;

export default PlanarOrbitManipulator;
