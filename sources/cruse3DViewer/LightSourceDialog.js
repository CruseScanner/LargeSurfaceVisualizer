'use strict';

var LightSourceDialog = function(scanViewer, parentElement) {
    this._scanViewer = scanViewer;
    
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
     
        
        var lightSourceFieldSetElement = document.createElement('fieldset');
        var lightSourceFieldSetLegendElement = document.createElement('legend');
        lightSourceFieldSetLegendElement.innerText = "Lightsource";
        
               
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
        
        var toHexColor = function (value) { 
            var hex = Math.trunc(value*255).toString(16);
            if (hex.length < 2) {
                 hex = "0" + hex;
            }
            return '#' + hex + hex + hex;
        };

        var updateDiffuse = function() {
            var lp = scanViewer.getLightParameters(0);
            var diffuse = lightSourceDiffuseSliderElement.value/100.0;
            lp.diffuse = osg.vec4.fromValues(diffuse, diffuse, diffuse, 1.0);
            scanViewer.setLightParameters(0, lp.ambient, lp.diffuse, lp.specular, lp.phongExponent);
            lightSourcePointerElement.style.backgroundColor = toHexColor(diffuse);
        };
        var updateSpecular = function() {
            var lp = scanViewer.getLightParameters(0);
            var specular = lightSourceSpecularSliderElement.value/100.0;
            lp.specular = osg.vec4.fromValues(specular, specular, specular, 1.0);
            scanViewer.setLightParameters(0, lp.ambient, lp.diffuse, lp.specular, lp.phongExponent);
        };          
      
        lightSourceDiffuseSliderElement.oninput = updateDiffuse;
        lightSourceDiffuseSliderElement.onchange = updateDiffuse;

        lightSourceSpecularSliderElement.oninput = updateSpecular;
        lightSourceSpecularSliderElement.onchange = updateSpecular;
        
        lightSourceHemisphereElement.appendChild(lightSourceHemisphereWrapElement);                       
        lightSourceHemisphereWrapElement.appendChild(lightSourcePointerElement);
        lightSourceDialogElement.appendChild(lightSourceHemisphereElement);
        
        lightSourceFieldSetElement.appendChild(lightSourceFieldSetLegendElement);
        var labelElement = document.createElement("left");
        labelElement.innerText = "Power";
        lightSourceFieldSetElement.appendChild(labelElement);

        lightSourceFieldSetElement.appendChild(lightSourceDiffuseSliderElement);

        labelElement = document.createElement("left");
        labelElement.innerText = "Glossiness";
        lightSourceFieldSetElement.appendChild(labelElement);
        
        lightSourceFieldSetElement.appendChild(lightSourceSpecularSliderElement);
        lightSourceDialogElement.appendChild(lightSourceFieldSetElement);
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
            
            scanViewer.setDirectionalLight(0, elevation, azimuth);
            
            x*= radius;    
            y*= radius;
            x+= radius;
            y+= radius;
            
            lightSourcePointerElement.style.left = x + 'px';
            lightSourcePointerElement.style.top  = y + 'px';
        }           
    }
};

export default LightSourceDialog;
