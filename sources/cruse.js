import IIPImageTileSource from 'cruse3DViewer/IIPImageTileSource';
import ScanViewer from 'cruse3DViewer/ScanViewer';
import PlanarOrbitManipulator from 'cruse3DViewer/PlanarOrbitManipulator';
import ScanViewerWidget from 'cruse3DViewer/ScanViewerWidget';
import Gallery from 'cruseGallery/Gallery';
import Cruse2DViewer from 'cruse2DViewer/cruse-viewer';
import cruseNameSpace from 'cruseNameSpace';

var cruse = cruseNameSpace;
cruse.IIPImageTileSource = IIPImageTileSource;
cruse.PlanarOrbitManipulator = PlanarOrbitManipulator; 
cruse.ScanViewer = ScanViewer;
cruse.ScanViewerWidget = ScanViewerWidget;
cruse.Cruse2DViewer = Gallery;
cruse.Gallery = Gallery;

// for backward compatibility
cruse.globalify = function() {
    window.cruse = cruse;
};

export {
    IIPImageTileSource,
    ScanViewer,
    PlanarOrbitManipulator,
    ScanViewerWidget, 
    Gallery,
    Cruse2DViewer   
};

export default cruse;