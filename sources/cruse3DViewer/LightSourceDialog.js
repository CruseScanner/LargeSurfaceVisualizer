'use strict';

import OSG from 'external/osg';
import Hammer from 'hammer';

var osg = OSG.osg;

var toHexColor = function (value) {
    var hex = Math.trunc(value * 255).toString(16);
    if (hex.length < 2) {
        hex = '0' + hex;
    }
    return '#' + hex + hex + hex;
};

var LightSourceDialog = function (scanViewer, parentElement) {
    this._scanViewer = scanViewer;
    this._lightSourcePointerElement = [];
    this._activeLightIndex = 0;

    var lightSourceDialogElement = document.createElement('div');
    lightSourceDialogElement.className = 'cruse-scanviewer-lightsource-dialog';

    var lightSourceHemisphereElement = document.createElement('div');
    lightSourceHemisphereElement.className = 'cruse-scanviewer-lightsource-hemisphere';
    this._lightSourceHemisphereElement = lightSourceHemisphereElement;

    // Create absolutely positioned element so that pointer coordinates can be specified relative to the hemisphere div
    var lightSourceHemisphereWrapElement = document.createElement('div');
    lightSourceHemisphereWrapElement.style = 'position: absolute';
    lightSourceHemisphereWrapElement.style.left = 0;
    lightSourceHemisphereWrapElement.style.top = 0;

    this._lightSourceHemisphereWrapElement = lightSourceHemisphereWrapElement;

    var lightSourceFieldSetElement = document.createElement('fieldset');
    lightSourceFieldSetElement.className = 'cruse-scanviewer-lightsource-allSliders';
    var lightSourceFieldSetLegendElement = document.createElement('legend');
    lightSourceFieldSetLegendElement.innerText = 'Lightsource';

    var lightSourceDiffuseSliderElement = document.createElement('input');
    lightSourceDiffuseSliderElement.className = 'cruse-scanviewer-lightsource-slider';
    lightSourceDiffuseSliderElement.type = 'range';
    lightSourceDiffuseSliderElement.min = 0;
    lightSourceDiffuseSliderElement.max = 100;
    lightSourceDiffuseSliderElement.value = 100;
    this._lightSourceDiffuseSliderElement = lightSourceDiffuseSliderElement;

    var lightSourceSpecularSliderElement = document.createElement('input');
    lightSourceSpecularSliderElement.className = 'cruse-scanviewer-lightsource-slider';
    lightSourceSpecularSliderElement.type = 'range';
    lightSourceSpecularSliderElement.min = 0;
    lightSourceSpecularSliderElement.max = 100;
    lightSourceSpecularSliderElement.value = 100;
    this._lightSourceSpecularSliderElement = lightSourceSpecularSliderElement;

    var that = this;

    var updateDiffuse = function () {
        var lp = that._scanViewer.getLightParameters(that._activeLightIndex);
        var diffuse = lightSourceDiffuseSliderElement.value / 100.0;
        lp.diffuse = osg.vec4.fromValues(diffuse, diffuse, diffuse, 1.0);
        that._scanViewer.setLightParameters(
            that._activeLightIndex,
            lp.ambient,
            lp.diffuse,
            lp.specular,
            lp.phongExponent
        );
        that._lightSourcePointerElement[that._activeLightIndex].style.backgroundColor =
            toHexColor(diffuse);
    };

    var updateSpecular = function () {
        // TODO: specular should probably be a global scale factor for diffuse intensity (i.e. a material property)
        var lp = that._scanViewer.getLightParameters(that._activeLightIndex);
        var specular = lightSourceSpecularSliderElement.value / 100.0;
        lp.specular = osg.vec4.fromValues(specular, specular, specular, 1.0);
        that._scanViewer.setLightParameters(
            that._activeLightIndex,
            lp.ambient,
            lp.diffuse,
            lp.specular,
            lp.phongExponent
        );
    };

    lightSourceDiffuseSliderElement.oninput = updateDiffuse;
    lightSourceDiffuseSliderElement.onchange = updateDiffuse;

    lightSourceSpecularSliderElement.oninput = updateSpecular;
    lightSourceSpecularSliderElement.onchange = updateSpecular;

    lightSourceHemisphereElement.appendChild(lightSourceHemisphereWrapElement);
    lightSourceDialogElement.appendChild(lightSourceHemisphereElement);

    lightSourceFieldSetElement.appendChild(lightSourceFieldSetLegendElement);
    var labelElement = document.createElement('left');
    labelElement.innerText = 'Power';
    lightSourceFieldSetElement.appendChild(labelElement);

    lightSourceFieldSetElement.appendChild(lightSourceDiffuseSliderElement);

    labelElement = document.createElement('left');
    labelElement.innerText = 'Glossiness';
    lightSourceFieldSetElement.appendChild(labelElement);

    lightSourceFieldSetElement.appendChild(lightSourceSpecularSliderElement);
    lightSourceDialogElement.appendChild(lightSourceFieldSetElement);
    parentElement.appendChild(lightSourceDialogElement);

    for (var i = 0; i < scanViewer.getLightCount(); i++) {
        this._addLightPointerElement();
        this._updateLightStateFromScanViewer(i);
    }

    this._dragging = false;
    window.onmousemove = function (e) {
        if (!that._dragging) {
            return;
        }
        var spherical = that._mouseToSpherical(e.x, e.y);
        that._scanViewer.setDirectionalLight(
            that._activeLightIndex,
            spherical.elevation,
            spherical.azimuth
        );
        that._updateLightPosition(that._activeLightIndex, spherical.azimuth, spherical.elevation);
    };
};

LightSourceDialog.prototype = {
    update: function (scanViewer, activeLightIndex) {
        this._scanViewer = scanViewer;
        if (activeLightIndex !== undefined) {
            this.activateLight(activeLightIndex);
        }

        while (this._lightSourcePointerElement.length > scanViewer.getLightCount()) {
            this._removeLightPointerElement();
        }
        while (this._lightSourcePointerElement.length < scanViewer.getLightCount()) {
            var index = this._addLightPointerElement();
        }
        for (var i = 0; i < this._lightSourcePointerElement.length; i++) {
            this._updateLightStateFromScanViewer(i);
        }
    },

    activateLight: function (index) {
        if (index !== this._activeLightIndex) {
            var oldElement = this._lightSourcePointerElement[this._activeLightIndex];
            if (oldElement !== undefined) {
                oldElement.classList.remove('activeLight');
            }

            this._activeLightIndex = Math.min(index, this._lightSourcePointerElement.length - 1);
            if (this._activeLightIndex >= 0) {
                this._lightSourcePointerElement[this._activeLightIndex].classList.add(
                    'activeLight'
                );
            }
            // update sliders
            this._updateSliders();
        }
    },

    _updateSliders: function () {
        var index = this._activeLightIndex;
        var lp = this._scanViewer.getLightParameters(index);
        this._lightSourceDiffuseSliderElement.value = lp.diffuse[0] * 100;
        this._lightSourceSpecularSliderElement.value = lp.specular[0] * 100;
    },

    // Initialize/update widget state from scanviewer light state
    _updateLightStateFromScanViewer: function (index) {
        if (index >= this._lightSourcePointerElement.length) {
            return;
        }

        if (index >= this._scanViewer.getLightCount()) {
            return;
        }

        // Update sliders
        if (index === this._activeLightIndex) {
            this._updateSliders();
        }

        // update pointer position
        var p = this._scanViewer.getLightPosition(index);
        if (p !== undefined) {
            this._updateLightPosition(index, p.azimuth, p.elevation);
        }
        // update pointer color
        var lp = this._scanViewer.getLightParameters(index);
        this._lightSourcePointerElement[index].style.backgroundColor = toHexColor(lp.diffuse[0]);
    },

    // Update widget state to given light position
    _updateLightPosition: function (index, azimuth, elevation) {
        if (index >= this._lightSourcePointerElement.length) {
            return;
        }
        var p = this._sphericalToPointer(azimuth, elevation);
        this._lightSourcePointerElement[index].style.left = p[0] + 'px';
        this._lightSourcePointerElement[index].style.top = p[1] + 'px';
    },

    _mouseToSpherical: function (ex, ey) {
        var rect = this._lightSourceHemisphereElement.getBoundingClientRect();
        var radius = rect.width / 2;
        var centerx = rect.left + radius;
        var centery = rect.top + radius;

        var x = ex - centerx;
        var y = ey - centery;
        var r = Math.sqrt(x * x + y * y);
        if (r > 0.0) {
            var scale = 1.0 / Math.max(radius, r);
            x *= scale;
            y *= scale;
        }

        var z = Math.sqrt(Math.max(0.0, 1.0 - (x * x + y * y)));

        var XX = x * radius + radius;
        var YY = y * radius + radius;

        return {
            elevation: Math.asin(z),
            azimuth: Math.atan2(y, x)
        };
    },

    _sphericalToPointer: function (azimuth, elevation) {
        var x = Math.cos(azimuth);
        var y = Math.sin(azimuth);
        var z = Math.sin(elevation);

        var r = Math.sqrt(1.0 - z * z);

        var rect = this._lightSourceHemisphereElement.getBoundingClientRect();
        var radius = rect.width / 2;

        x *= r * radius;
        y *= r * radius;
        x += radius;
        y += radius;

        return [x, y];
    },

    _addLightPointerElement: function () {
        var index = this._lightSourcePointerElement.length;

        var lightSourcePointerElement = document.createElement('div');
        lightSourcePointerElement.className = 'cruse-scanviewer-lightsource-pointer';
        if (index === 0) {
            lightSourcePointerElement.classList.add('activeLight');
        }
        lightSourcePointerElement.id = 'cruse-scanviewer-lightsource-pointer' + index;

        this._lightSourceHemisphereWrapElement.appendChild(lightSourcePointerElement);
        this._lightSourcePointerElement[index] = lightSourcePointerElement;

        var that = this;
        lightSourcePointerElement.onmousedown = function (e) {
            that.activateLight(index);
            //if (e.button === 1) {
            that._dragging = true;
            //}
        };
        window.onmouseup = function (e) {
            //if (e.button === 1) {
            that._dragging = false;
            //}
        };

        var hammertime = new Hammer(lightSourcePointerElement);
        hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        hammertime.on('panmove', function (e) {
            var spherical = that._mouseToSpherical(e.center.x, e.center.y);
            that._scanViewer.setDirectionalLight(
                that._activeLightIndex,
                spherical.elevation,
                spherical.azimuth
            );
            that._updateLightPosition(
                that._activeLightIndex,
                spherical.azimuth,
                spherical.elevation
            );
        });

        return index;
    },

    _removeLightPointerElement: function () {
        var index = this._lightSourcePointerElement.length - 1;
        if (index < 1) {
            return;
        }

        this._lightSourcePointerElement[index].remove();
        this._lightSourcePointerElement.length = index;

        if (this._activeLightSource === index) {
            this._dragging = false;
            this._activeLightSource--;
        }
    }
};

export default LightSourceDialog;
