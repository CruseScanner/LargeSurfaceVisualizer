import notify from 'osg/notify';

/**
 *  OrbitManipulator
 *  @class
 */
var SwitchManipulator = function(inputManager) {
    this._manipulatorList = [];
    this._currentManipulator = undefined;
    this._inputManager = inputManager;
};

/** @lends SwitchManipulator.prototype */
SwitchManipulator.prototype = {
    getCamera: function() {
        return this.getCurrentManipulator().getCamera();
    },
    setCamera: function(cam) {
        var cbList = this.getManipulatorList();
        for (var i = 0, nb = cbList.length; i < nb; ++i) cbList[i].setCamera(cam);
    },
    update: function(nv) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.update(nv);
        }
        return undefined;
    },

    getInputManager: function(){
        return this._inputManager;
    },

    setEnable: function (enable) {
        this.getCurrentManipulator().setEnable(enable);
    },

    getNode: function() {
        // we should add an accessor in the osgjs manipulator
        return this.getCurrentManipulator()._node;
    },
    setNode: function(node) {
        var cbList = this.getManipulatorList();
        for (var i = 0, nb = cbList.length; i < nb; ++i) cbList[i].setNode(node);
    },
    getControllerList: function() {
        return this.getCurrentManipulator().getControllerList();
    },
    getNumManipulator: function() {
        return this._manipulatorList.length;
    },
    addManipulator: function(manipulator) {
        this._manipulatorList.push(manipulator);
        if (this._currentManipulator === undefined) {
            this.setManipulatorIndex(0);
        }
    },
    getManipulatorList: function() {
        return this._manipulatorList;
    },
    setManipulatorIndex: function(index) {
        this._currentManipulator = index;
    },
    getCurrentManipulatorIndex: function() {
        return this._currentManipulator;
    },
    getCurrentManipulator: function() {
        return this._manipulatorList[this._currentManipulator];
    },
    reset: function() {
        this.getCurrentManipulator().reset();
    },
    computeHomePosition: function(useBoundingBox) {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            manipulator.computeHomePosition(useBoundingBox);
        }
    },
    getInverseMatrix: function() {
        var manipulator = this.getCurrentManipulator();
        if (manipulator !== undefined) {
            return manipulator.getInverseMatrix();
        }
    },
    getHomeBound: function(boundStrategy) {
        notify.warn('Please use getHomeBoundingSphere instead');
        return this.getHomeBoundingSphere(boundStrategy);
    },
    getHomeBoundingSphere: function(boundStrategy) {
        return this.getCurrentManipulator().getHomeBoundingSphere(boundStrategy);
    },
    getHomeDistance: function(bs) {
        return this.getCurrentManipulator().getHomeDistance(bs);
    }
};

export default SwitchManipulator;
