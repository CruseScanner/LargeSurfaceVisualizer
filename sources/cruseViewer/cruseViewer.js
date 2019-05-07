import ScanViewerWidget from 'cruse3DViewer/ScanViewerWidget';
import Cruse2DViewer from 'cruse2DViewer/cruse2DViewer';

'use strict';

var CruseViewer = function(parentElement)
{
    this.containerElement = parentElement;

    // Create the cruse2DViewer container
    this.viewer2dElement = document.createElement('div');
    this.viewer2dElement.className = 'viewer';
    this.containerElement.appendChild(this.viewer2dElement);

    // Create the cruse3DViewer container
    this.viewer3dElement = document.createElement('div');
    this.viewer3dElement.className = 'viewer';
    this.containerElement.appendChild(this.viewer3dElement);
};

CruseViewer.prototype = {

    open: function (image) {

        this.image = image;

        if (this.is3DImage(image)) {
          return this.update3DViewer(image)
        }
        else {
          return this.update2DViewer(image)
        }
      },
    
      update2DViewer: function (image) {
    
        this.viewer3dElement.style.display = "none";
        this.viewer2dElement.style.display = "block";
    
        if (this.scanViewerWidget != undefined) {
          this.scanViewerWidget.stop();
        }
    
        if (this.cruse2DViewer == undefined) {
          this.cruse2DViewer = new Cruse2DViewer(this.viewer2dElement);
        }
     
        return this.cruse2DViewer.open(image);
      },
    
      update3DViewer: function (image) {
        this.viewer2dElement.style.display = "none";
        this.viewer3dElement.style.display = "block";
    
        if (this.scanViewerWidget == undefined) {
          this.scanViewerWidget = new ScanViewerWidget(this.viewer3dElement);
        }
        else {
          this.scanViewerWidget.stop();
        }
    
        return this.scanViewerWidget.run(image);
      },

      is3DImage: function (image) {
        return 'NormalMap' in image;
      },

      getView : function() 
      {
        if(this.is3DImage(this.image))
        {
            return this.scanViewerWidget.getCurrentViewPose();
        }  
        else{
            return this.cruse2DViewer.getView();
        }
      
      },
    
      restoreView : function(view)
      {
        if(this.is3DImage(this.image))
        {
            return this.scanViewerWidget.setViewPose(view);
        }  
        else{
            return this.cruse2DViewer.restoreView(view);
        }
      },
};


export default CruseViewer;