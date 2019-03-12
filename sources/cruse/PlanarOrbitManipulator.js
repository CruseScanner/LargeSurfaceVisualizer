import utils from 'osg/utils';
import { vec3 } from 'osg/glMatrix';
import OrbitManipulator from 'osgGA/OrbitManipulator';
import OrbitManipulatorDeviceOrientationController from 'osgGA/OrbitManipulatorDeviceOrientationController';
import OrbitManipulatorGamePadController from 'osgGA/OrbitManipulatorGamePadController';
import OrbitManipulatorHammerController from 'osgGA/OrbitManipulatorHammerController';
import OrbitManipulatorStandardMouseKeyboardController from 'osgGA/OrbitManipulatorStandardMouseKeyboardController';
import OrbitManipulatorWebVRController from 'osgGA/OrbitManipulatorWebVRController';

/**
 *  PlanarOrbitManipulator
 *  @class
 */
var PlanarOrbitManipulator = function(options) {
    OrbitManipulator.call(this, options);
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
            };
        })(),
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
