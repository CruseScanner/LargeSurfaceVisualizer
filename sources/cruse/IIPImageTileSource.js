import fileHelper from 'osgDB/fileHelper';
import notify from 'osg/notify';
import defined from 'cruse/defined';

var IIPImageTileSource = function(url, filename) {
    this._tileSize = 256;
    this._url = url;
    this._filename = filename;
    this._ready = false;

    var that = this;
    // Download and parse JSON    
    this._jsonPromise = this.requestFile(url + '?IIIF=' + filename + '/info.json').
        then(function(str) {
            var data;
            try {
                data = JSON.parse(str);
            } 
            catch (error) {
                notify.error('Can not parse url ' + url);
            }
            that.initialize(data);
        }).catch(function(status) {
            var err = 'Error loading file ' + url +'. Status: ' + status;
            notify.error(err);
        });
};

IIPImageTileSource.prototype = {
    requestFile: function(url, options) {
        return fileHelper.requestURI(url, options);
    },
      
    initialize: function(jsonData)
    {
        this._imageWidth = jsonData.width;
        this._imageHeight = jsonData.height;
        
        var maxExtent = Math.max(this._imageWidth, this._imageHeight);
        var tilesX =  Math.ceil(this._imageWidth/this._tileSize);
        var tilesY =  Math.ceil(this._imageHeight/this._tileSize);
        
        // TODO: log2 not supported prior to ECMAscript6, add polyfill or use standard log
        this._levels = Math.ceil(Math.log2(Math.max(tilesX, tilesY)));       
        this._tilesX = tilesX;
        this._tilesY = tilesY;
          
        this._initialized = true;
        
        return;
    },
    
    getTileSize: function(level) {
        return this._tileSize*(1<<(this._levels - level))
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
   
    getRasterExtent: function(x, y, level) {
        var tileSize = this.getTileSize(level);
        var width =  Math.min(this._imageWidth - x*tileSize, tileSize);
        var height = Math.min(this._imageHeight - y*tileSize, tileSize);
        
        var levelFactor = 1<<(this._levels - level);
        var destWidth = Math.floor((width+levelFactor-1)/levelFactor);
        var destHeight = Math.floor((height+levelFactor-1)/levelFactor);
               
        var x0 = x*tileSize;
        var y0 = y*tileSize;
        var x1 = x0 + width;
        var y1 = y0 + height;
        
        return {
            // source region
            x0: x0,
            y0: y0,
            x1: x1,
            y1: y1,
            // destination tile size
            w : destWidth,
            h : destHeight
        }
    },
    
    getTileExtent: function(x, y, level) {
        // TODO: scale pixel to mm, flip y
        return this.getRasterExtent(x, y, level);
    },
        
    getTileURL: function(x, y, level) {
        /*if (!hasTile(x, y, level))
        {
            throw new DeveloperError('');
        }*/
        var e = this.getRasterExtent(x, y, level);
        var sx = e.x1-e.x0+1;
        var sy = e.y1-e.y0+1;
        
        var roi = e.x0 + ',' + e.y0 + ',' + sx + ',' + sy;
        var size = e.w + ',' + e.h; 
      
        return this._url + '?IIIF=' + this._filename + '/' + roi + '/' + size + '/0/default.jpg'; 
    }
};

export default IIPImageTileSource;
