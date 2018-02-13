import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import FirstPersonManipulator from 'osgGA/FirstPersonManipulator';
import Camera from 'osg/Camera';
import { vec3 } from 'osg/glMatrix';
import { mat4 } from 'osg/glMatrix';

export default function() {
    var viewer;
    before(function(){
        var canvas = mockup.createCanvas();
        viewer = new mockup.Viewer(canvas);
    });

    test('FirstPersonManipulator', function() {
        var manipulator = new FirstPersonManipulator({inputManager: viewer.getInputManager()});
        var matrix = manipulator.getInverseMatrix();
        assert.isOk(matrix !== undefined, 'check getInverseMatrix method');
    });

    test('FirstPersonManipulator check controllers', function() {
        var manipulator = new FirstPersonManipulator({inputManager: viewer.getInputManager()});
        var list = manipulator.getControllerList();
        assert.isOk(list.StandardMouseKeyboard !== undefined, 'check mouse support');
    });

    test('FirstPersonManipulator check computation', function() {
        var manipulator = new FirstPersonManipulator({inputManager: viewer.getInputManager()});

        var fakeFS = {
            getFrameStamp: function() {
                return {
                    getDeltaTime: function() {
                        return 0.0;
                    }
                };
            }
        };

        manipulator.setCamera(new Camera());

        var eye = vec3.create();
        var target = vec3.create();
        manipulator.getEyePosition(eye);
        manipulator.getTarget(target);

        assert.equalVector(
            eye,
            vec3.fromValues(0.0, 25.0, 10.0),
            1e-5,
            'check default eye position'
        );
        assert.equalVector(target, vec3.fromValues(0.0, 26.0, 10.0), 1e-5, 'check default target');
        assert.equalVector(manipulator.getDistance(), 1.0, 1e-5, 'check default distance');

        manipulator.update(fakeFS);
        assert.equalVector(
            manipulator.getInverseMatrix(),
            mat4.fromValues(
                1.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                -1.0,
                0.0,
                0.0,
                1.0,
                0.0,
                0.0,
                0.0,
                -10.0,
                25.0,
                1.0
            ),
            1e-5,
            'check matrix result'
        );

        manipulator.setTarget(vec3.fromValues(10.0, 10.0, 10.0));
        manipulator.update(fakeFS);
        assert.equalVector(
            manipulator.getInverseMatrix(),
            mat4.fromValues(
                -0.83205029,
                0.0,
                -0.55470019,
                0.0,
                -0.55470019,
                0.0,
                0.83205029,
                0.0,
                0.0,
                1.0,
                0.0,
                0.0,
                13.867504,
                -10,
                -20.801257,
                1.0
            ),
            1e-5,
            'check matrix result'
        );

        manipulator.computeRotation(100.0, 0.4);
        manipulator.update(fakeFS);
        assert.equalVector(
            manipulator.getInverseMatrix(),
            mat4.fromValues(
                0.017205427,
                0.00399939,
                -0.9998439,
                0.0,
                -0.9998519,
                0.000068821,
                -0.01720529,
                0.0,
                0.0,
                1.0,
                0.004,
                0.0,
                25.0,
                -10.00164,
                0.3901323,
                1.0
            ),
            1e-2,
            'check matrix result'
        );
    });
}
