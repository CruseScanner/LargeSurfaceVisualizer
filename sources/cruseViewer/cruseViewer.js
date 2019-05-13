import ScanViewerWidget from 'cruse3DViewer/ScanViewerWidget';
import Cruse2DViewer from 'cruse2DViewer/cruse2DViewer';
import openseadragon from 'openseadragon';
import screenfull from 'tools/UI/fullscreen';

'use strict';

var CruseViewer = function(parentElement)
{
    this.containerElement = parentElement;

    // Create the cruse2DViewer container
    this.viewer2dElement = document.createElement('div');
    this.viewer2dElement.style.position = "absolute";
    this.viewer2dElement.style.width = "100%";
    this.viewer2dElement.style.height = "100%";    
    this.containerElement.appendChild(this.viewer2dElement);

    // Create the cruse3DViewer container
    this.viewer3dElement = document.createElement('div');
    this.viewer3dElement.style.position = "absolute";
    this.viewer3dElement.style.width = "100%";
    this.viewer3dElement.style.height = "100%";    
    this.containerElement.appendChild(this.viewer3dElement);

    this.captionElement = document.createElement('div');
    this.captionElement.className = 'cruse-scanviewer-caption active';
    var buttonElement = document.createElement('button');
    buttonElement.classList.add('cruse-scanviewer-caption-button');
    buttonElement.innerText = "Info";
    this.captionElement.appendChild(buttonElement);

    var that = this;
    buttonElement.addEventListener('click', function(){
        that.captionElement.classList.toggle("active");        
    });
    this.captionContentElement = document.createElement('div');
    this.captionContentElement.classList.add('cruse-scanviewer-caption-content');
    this.captionElement.appendChild(this.captionContentElement);

    this.containerElement.appendChild(this.captionElement);

    var toolbarElement = document.createElement('div');
    toolbarElement.className = 'cruse-scanviewer-toolbar';
    toolbarElement.id = 'cruse-scanviewer-2d-toolbar';
    this.containerElement.appendChild(toolbarElement);
    this.createButtons(toolbarElement);
    this.currentViewer = undefined;
};

CruseViewer.prototype = {

    prefixUrl:              "/images/",
    navImages: {
        zoomIn: {
            REST:   'zoomin_rest.png',
            GROUP:  'zoomin_grouphover.png',
            HOVER:  'zoomin_hover.png',
            DOWN:   'zoomin_pressed.png'
        },
        zoomOut: {
            REST:   'zoomout_rest.png',
            GROUP:  'zoomout_grouphover.png',
            HOVER:  'zoomout_hover.png',
            DOWN:   'zoomout_pressed.png'
        },
        home: {
            REST:   'home_rest.png',
            GROUP:  'home_grouphover.png',
            HOVER:  'home_hover.png',
            DOWN:   'home_pressed.png'
        },
        fullpage: {
            REST:   'fullpage_rest.png',
            GROUP:  'fullpage_grouphover.png',
            HOVER:  'fullpage_hover.png',
            DOWN:   'fullpage_pressed.png'
        },
        rotateleft: {
            REST:   'rotateleft_rest.png',
            GROUP:  'rotateleft_grouphover.png',
            HOVER:  'rotateleft_hover.png',
            DOWN:   'rotateleft_pressed.png'
        },
        rotateright: {
            REST:   'rotateright_rest.png',
            GROUP:  'rotateright_grouphover.png',
            HOVER:  'rotateright_hover.png',
            DOWN:   'rotateright_pressed.png'
        },
        flip: { // Flip icon designed by Yaroslav Samoylov from the Noun Project and modified by Nelson Campos ncampos@criteriamarathon.com, https://thenounproject.com/term/flip/136289/
            REST:   'flip_rest.png',
            GROUP:  'flip_grouphover.png',
            HOVER:  'flip_hover.png',
            DOWN:   'flip_pressed.png'
        },
        previous: {
            REST:   'previous_rest.png',
            GROUP:  'previous_grouphover.png',
            HOVER:  'previous_hover.png',
            DOWN:   'previous_pressed.png'
        },
        next: {
            REST:   'next_rest.png',
            GROUP:  'next_grouphover.png',
            HOVER:  'next_hover.png',
            DOWN:   'next_pressed.png'
        }
    },


    open: function (image) {

        this.image = image;

        if(image.caption != undefined)
        {
          this.captionElement.style.visibility = "visible";
          this.captionContentElement.innerHTML = image.caption;
        } 
        else{
          this.captionElement.style.visibility = "hidden";
        }

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
     
        this.currentViewer = this.cruse2DViewer;
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

        this.currentViewer = this.scanViewerWidget;

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

      toggleShowCaption : function()
      {
        that.captionElement.classList.toggle("active");  
      },

      resolveUrl : function( prefix, url ) {
        return prefix ? prefix + url : url;
      },
    
      createButton: function(parentElement, id, tooltip, onClick)
      {
        var button = new openseadragon.Button({            
            tooltip:    tooltip,
            srcRest:    this.resolveUrl( this.prefixUrl, this.navImages[id].REST ),
            srcGroup:   this.resolveUrl( this.prefixUrl, this.navImages[id].GROUP ),
            srcHover:   this.resolveUrl( this.prefixUrl, this.navImages[id].HOVER ),
            srcDown:    this.resolveUrl( this.prefixUrl, this.navImages[id].DOWN ),
            onClick: onClick,
            });
        button.element.id = id;
        parentElement.appendChild(button.element);
      },
      
      createButtons: function(toolbarElement)
      {
        this.createButton(toolbarElement, "zoomIn", "Zoom In", this.zoomIn.bind(this));
        this.createButton(toolbarElement, "zoomOut", "Zoom Out", this.zoomOut.bind(this));
        this.createButton(toolbarElement, "home", "Reset View", this.resetView.bind(this));
        this.createButton(toolbarElement, "fullpage", "Toogle Fullscreen", this.toggleFullScreen.bind(this));
      },

      zoomIn : function()
      {
        this.currentViewer.zoomIn();
      },

      zoomOut : function()
      {
        this.currentViewer.zoomOut();
      },

      resetView : function()
      {
        this.currentViewer.resetView();
      },

      toggleFullScreen : function()
      {
        screenfull.toggle(this.containerElement);
      },

};


export default CruseViewer;