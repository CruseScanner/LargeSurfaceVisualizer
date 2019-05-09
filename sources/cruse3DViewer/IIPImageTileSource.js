import OSG from 'external/osg';
import notify from 'tools/notify';

var fileHelper = OSG.osgDB.fileHelper;

function initialize(tileSource, jsonData) {
    tileSource._imageWidth = jsonData.width;
    tileSource._imageHeight = jsonData.height;
    
    var maxExtent = Math.max(tileSource._imageWidth, tileSource._imageHeight);
    var tilesX =  Math.ceil(tileSource._imageWidth/tileSource._tileSize);
    var tilesY =  Math.ceil(tileSource._imageHeight/tileSource._tileSize);
    
    // TODO: log2 not supported prior to ECMAscript6, add polyfill or use
    // standard log
    tileSource._levels = Math.ceil(Math.log2(Math.max(tilesX, tilesY))) + 1;       
    tileSource._tilesX = tilesX;
    tileSource._tilesY = tilesY;
      
    tileSource._initialized = true;
    
    return;
};

function requestFile(url, options) {
    return fileHelper.requestURI(url, options);
};

var IIPImageTileSource = function(url, filename, options) {
    options = options || {};
    this._tileSize = options.tileSize || 256;
    this._border = options.border || 0;
    
    this._url = url;
    this._filename = filename;
    this._ready = false;

    var that = this;
    // Download and parse JSON    
    this._initializationPromise = requestFile(url + '?IIIF=' + filename + '/info.json').
        then(function(str) {
            var data;
            try {
                data = JSON.parse(str);
            } 
            catch (error) {
                notify.error('Can not parse url ' + url);
            }
            initialize(that, data);
        }).catch(function(status) {
            var err = 'Error loading file ' + url +'. Status: ' + status;
            notify.error(err);
        });
};

IIPImageTileSource.prototype = { 
    // Returns pixels covered by a tile at the given level (excluding border)
    getTileSize: function(level) {
        return this._tileSize*(1<<(this._levels - level - 1));
    },
    },
    
    hasChildren: function(x, y, level) {
        if (!this.hasTile(x, y, level)) {
            return false;
        }
        if (level + 1 >= this._levels) {
            return false;
        }
        return true;
    },
    
    hasTile: function(x, y, level)  {
        if (level >= this._levels) {
            return false;
        }
        var tileSize = this.getTileSize(level);
        if (x*tileSize >= this._imageWidth) {
            return false;
        }
        if (y*tileSize >= this._imageHeight) {
            return false;
        }        
        return true;
    },
   
    /**
     * Returns pixel coordinates of the image region covered by the given tile.  
     */
    getRasterExtent: function(x, y, level, excludeBorder) {
        var levelFactor = 1<<(this._levels - level - 1);
        var tileSize = this.getTileSize(level);
        var borderSize;
        if (excludeBorder) {
            borderSize = 0;
        }
        else {
            borderSize = this._border*levelFactor;
        }
        
               
        var x0 = Math.max(x*tileSize - borderSize, 0);
        var y0 = Math.max(y*tileSize - borderSize, 0);
        var x1 = Math.min(x*tileSize + tileSize + borderSize, this._imageWidth) - 1;
        var y1 = Math.min(y*tileSize + tileSize + borderSize, this._imageHeight) - 1;
        
        // Width in source pixels
        var width  = x1-x0 + 1;
        var height = y1-y0 + 1;
        
        var destWidth = Math.floor((width+levelFactor-1)/levelFactor);
        var destHeight = Math.floor((height+levelFactor-1)/levelFactor);
        
        return {
            // source region of tile, including border
            tx0: x*tileSize - borderSize,
            ty0: y*tileSize - borderSize,
            tx1: x*tileSize + tileSize + borderSize,
            ty1: x*tileSize + tileSize + borderSize,
            // source region of tile clipped against image 
            x0: x0,
            y0: y0,
            x1: x1,
            y1: y1,
            // destination tile size
            w : destWidth,
            h : destHeight
        };
    },
    
    getTileExtent: function(x, y, level) {
        // TODO: scale pixel to mm
        var re = this.getRasterExtent(x, y, level, true);
        var scale = 1.0;
        return {
            x0:   re.x0*scale,
            y0: -(re.y1 + 1)*scale,
            x1:  (re.x1 + 1)*scale,
            y1: - re.y0*scale,
            w :   re.w*scale,
            h :   re.h*scale
        };
    },
        
    getTileURL: function(x, y, level) {
        /*if (!hasTile(x, y, level))
        {
            throw new DeveloperError('');
        }*/
        var e = this.getRasterExtent(x, y, level);
        var sx = e.x1-e.x0+1.0;
        var sy = e.y1-e.y0+1.0;
        
        var roi = e.x0 + ',' + e.y0 + ',' + sx + ',' + sy;
        var size = e.w + ',' + e.h; 
      
        return this._url + '?IIIF=' + this._filename + '/' + roi + '/' + size + '/0/default.jpg'; 
    }
};


Object.defineProperties(IIPImageTileSource.prototype, {
    initializationPromise : {
        get: function() {
            return this._initializationPromise;
        }
    }
});


export default IIPImageTileSource;
