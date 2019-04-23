import IIPImageTileSource from 'cruse/IIPImageTileSource';
import ScanViewer from 'cruse/ScanViewer';
import PlanarOrbitManipulator from 'cruse/PlanarOrbitManipulator';
import ScanViewerWidget from 'cruse/ScanViewerWidget';
import cruseNameSpace from 'cruseNameSpace';

var cruse = cruseNameSpace;
cruse.IIPImageTileSource = IIPImageTileSource;
cruse.PlanarOrbitManipulator = PlanarOrbitManipulator; 
cruse.ScanViewer = ScanViewer;
cruse.ScanViewerWidget = ScanViewerWidget;

// for backward compatibility
cruse.globalify = function() {
    window.cruse = cruse;
};

export {
    IIPImageTileSource,
    ScanViewer,
    PlanarOrbitManipulator,
    ScanViewerWidget    
};

export default cruse;