import IIPImageTileSource from 'cruse3DViewer/IIPImageTileSource';
import ScanViewer from 'cruse3DViewer/ScanViewer';
import PlanarOrbitManipulator from 'cruse3DViewer/PlanarOrbitManipulator';
import ScanViewerWidget from 'cruse3DViewer/ScanViewerWidget';
//import Gallery from 'cruseGallery/Gallery';
import cruseNameSpace from 'cruseNameSpace';

var cruse = cruseNameSpace;
cruse.IIPImageTileSource = IIPImageTileSource;
cruse.PlanarOrbitManipulator = PlanarOrbitManipulator; 
cruse.ScanViewer = ScanViewer;
cruse.ScanViewerWidget = ScanViewerWidget;
//cruse.Gallery = Gallery;

// for backward compatibility
cruse.globalify = function() {
    window.cruse = cruse;
};

export {
    IIPImageTileSource,
    ScanViewer,
    PlanarOrbitManipulator,
    ScanViewerWidget,    
};

export default cruse;