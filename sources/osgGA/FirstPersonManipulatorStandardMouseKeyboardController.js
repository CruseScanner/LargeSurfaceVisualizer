import Controller from 'osgGA/Controller';
import utils from 'osg/utils';
import Groups from 'osgViewer/input/InputConstants';

var FirstPersonManipulatorStandardMouseKeyboardController = function(manipulator) {
    Controller.call(this, manipulator);
    this.init();
};

utils.createPrototypeObject(
    FirstPersonManipulatorStandardMouseKeyboardController,
    utils.objectInherit(Controller.prototype, {
        init: function() {
            this._delay = 0.15;
            this._stepFactor = 1.0; // meaning radius*stepFactor to move
            this._looking = false;

            var manager = this._manipulator.getInputManager();
            manager.group(Groups.FPS_MANIPULATOR_MOUSEKEYBOARD).addMappings(
                {
                    startLookAt: 'mousedown',
                    lookAt: 'mousemove',
                    stopLookAt: ['mouseup', 'mouseout'],
                    goForward: ['keydown w', 'keydown z', 'keydown ArrowUp'],
                    goBackward: ['keydown s', 'keydown ArrowDown'],
                    goLeft: ['keydown a', 'keydown q', 'keydown ArrowLeft'],
                    goRight: ['keydown d', 'keydown ArrowRight'],
                    stopMoving: [
                        'keyup w',
                        'keyup z',
                        'keyup ArrowUp',
                        'keyup s',
                        'keyup ArrowDown'
                    ],
                    stopStrafing: [
                        'keyup a',
                        'keyup q',
                        'keyup ArrowLeft',
                        'keyup d',
                        'keyup ArrowRight'
                    ],
                    changeStepFactor: 'wheel'
                },
                this
            );

            manager.group(Groups.FPS_MANIPULATOR_RESETTOHOME).addMappings(
                {
                    resetToHome: 'keydown space'
                },
                this
            );
        },
        // called to enable/disable controller
        setEnable: function(bool) {
            if (!bool) {
                // reset mode if we disable it
                this._buttonup = true;
            }
            Controller.prototype.setEnable.call(this, bool);
        },

        setManipulator: function(manipulator) {
            this._manipulator = manipulator;

            // we always want to sync speed of controller with manipulator
            this._manipulator.setStepFactor(this._stepFactor);
        },

        stopLookAt: function() {
            this._looking = false;
        },

        startLookAt: function(ev) {
            var manipulator = this._manipulator;
            manipulator.getLookPositionInterpolator().set(ev.glX, ev.glY);
            this._looking = true;
        },

        lookAt: function(ev) {
            if (!this._looking) {
                return;
            }

            this._manipulator.getLookPositionInterpolator().setDelay(this._delay);
            this._manipulator.getLookPositionInterpolator().setTarget(ev.glX, ev.glY);
        },

        changeStepFactor: function(ev) {
            var intDelta = -ev.deltaY / 40;
            this._stepFactor = Math.min(Math.max(0.001, this._stepFactor + intDelta * 0.01), 4.0);
            this._manipulator.setStepFactor(this._stepFactor);
        },

        resetToHome: function() {
            this._manipulator.computeHomePosition();
        },

        goForward: function() {
            this._manipulator.getForwardInterpolator().setDelay(this._delay);
            this._manipulator.getForwardInterpolator().setTarget(1);
        },

        goBackward: function() {
            this._manipulator.getForwardInterpolator().setDelay(this._delay);
            this._manipulator.getForwardInterpolator().setTarget(-1);
        },

        goLeft: function() {
            this._manipulator.getSideInterpolator().setDelay(this._delay);
            this._manipulator.getSideInterpolator().setTarget(-1);
        },

        goRight: function() {
            this._manipulator.getSideInterpolator().setDelay(this._delay);
            this._manipulator.getSideInterpolator().setTarget(1);
        },

        stopMoving: function() {
            this._manipulator.getForwardInterpolator().setDelay(this._delay);
            this._manipulator.getForwardInterpolator().setTarget(0);
        },

        stopStrafing: function() {
            this._manipulator.getSideInterpolator().setDelay(this._delay);
            this._manipulator.getSideInterpolator().setTarget(0);
        }
    })
);

export default FirstPersonManipulatorStandardMouseKeyboardController;
