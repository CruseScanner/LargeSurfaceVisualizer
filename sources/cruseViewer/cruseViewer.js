import ScanViewerWidget from 'cruse3DViewer/ScanViewerWidget';
import Cruse2DViewer from 'cruse2DViewer/cruse2DViewer';
import openseadragon from 'openseadragon';
import screenfull from 'tools/UI/fullscreen';

'use strict';

var CruseViewer = function(parentElement, showAdvancedControls)
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

    this.captionOverlay = this.createOverlayWindow("Info", "cruse-scanviewer-captionoverlay");    
    this.lightSettingsOverlay = this.createOverlayWindow("Lighting", "cruse-scanviewer-lightoverlay");    

    var toolbarElement = document.createElement('div');
    toolbarElement.className = 'cruse-scanviewer-toolbar';
    toolbarElement.id = 'cruse-scanviewer-2d-toolbar';
    this.containerElement.appendChild(toolbarElement);
    this.createButtons(toolbarElement);
    this.currentViewer = undefined;
    this._showAdvancedControls = showAdvancedControls;
};

CruseViewer.prototype = {

    prefixUrl:              "3dviewer/images/",
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
        },
        info: {
          REST:   'info_rest.png',
          GROUP:  'info_grouphover.png',
          HOVER:  'info_hover.png',
          DOWN:   'info_pressed.png'
      },
      lights: {
        REST:   'lights_rest.png',
        GROUP:  'lights_grouphover.png',
        HOVER:  'lights_hover.png',
        DOWN:   'lights_pressed.png'
    }
    },

    createOverlayWindow: function(title, className) {
      var captionElement = document.createElement('div');
      captionElement.className = 'cruse-scanviewer-overlay';
      captionElement.classList.add(className);
      captionElement.classList.add('cruse-scanviewer-overlay-active');
      var buttonElement = document.createElement('button');
      buttonElement.classList.add('cruse-scanviewer-overlay-button');
      buttonElement.innerText = title;
      captionElement.appendChild(buttonElement);
      
     
      var captionContentElement = document.createElement('div');
      captionContentElement.classList.add('cruse-scanviewer-overlay-content');
      captionElement.appendChild(captionContentElement);
    
      this.containerElement.appendChild(captionElement);

      var overlayWindow = {
        element: captionElement,
        contentElement: captionContentElement,
        _visible: true,
        setVisible: function(visible) {
          this._visible = visible;
          this._updateVisibility();
        },

        toggleCollapsed: function() {          
          captionElement.classList.toggle("cruse-scanviewer-overlay-active")
          this._updateVisibility();
         },

        _updateVisibility: function()
        {
          captionElement.style.visibility = (this._visible && captionElement.classList.contains("cruse-scanviewer-overlay-active"))? "visible" : "hidden";          
        }
      }

      buttonElement.addEventListener('click', function () {
        overlayWindow.toggleCollapsed();
      });

      return overlayWindow;
    },

    open: function (image) {

        this.image = image;

        this.captionOverlay.setVisible(image.caption != undefined)
        if(image.caption != undefined)
        {                   
          this.captionOverlay.contentElement.innerHTML = image.caption;
        } 

        this.lightSettingsOverlay.setVisible(this.is3DImage(image));

        this.showLightsButton.element.style.visibility = this.is3DImage(image) ? "visible" : "hidden";

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
          this.scanViewerWidget = new ScanViewerWidget(this.viewer3dElement, this.lightSettingsOverlay.contentElement);                  
        }
        else {
          this.scanViewerWidget.stop();
        }

        this.currentViewer = this.scanViewerWidget;

        return this.scanViewerWidget.run(image, this._showAdvancedControls);
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
        this.captionOverlay.toggleCollapsed(); 
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
        button.element.classList.add('cruse-scanviewer-toolbar-button');
        button.element.style.padding = '';
        parentElement.appendChild(button.element);
        return button;
      },
      
      createButtons: function(toolbarElement)
      {
        var that = this;
        this.createButton(toolbarElement, "zoomIn", "Zoom In", this.zoomIn.bind(this));
        this.createButton(toolbarElement, "zoomOut", "Zoom Out", this.zoomOut.bind(this));
        this.createButton(toolbarElement, "home", "Reset View", this.resetView.bind(this));
        this.createButton(toolbarElement, "fullpage", "Toogle Fullscreen", this.toggleFullScreen.bind(this));
        this.createButton(toolbarElement, "info", "Show/Hide Info",  function() {
          that.captionOverlay.toggleCollapsed();
        });
        this.showLightsButton = this.createButton(toolbarElement, "lights", "Show/Hide Lighting Settings",  function() {
          that.lightSettingsOverlay.toggleCollapsed();
        });
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


