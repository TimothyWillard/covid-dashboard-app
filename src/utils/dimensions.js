import { margin, dimMultipliers } from './constants';

export function getGraphContainerDimensions() {
    const ratioH = dimMultipliers.graphDesktopH;
    const ratioW = window.innerWidth > 800 ?
        dimMultipliers.graphDesktopW :
        dimMultipliers.graphMobileW; // account for mobile

    const graphH = window.innerHeight * ratioH;
    const graphW = (window.innerWidth * ratioW) - margin.yAxis;

    return [graphW, graphH]
};

export function getMapContainerDimensions() {
    const ratioH = dimMultipliers.mapDesktopH;
    const ratioW = window.innerWidth > 800 ?
        dimMultipliers.graphDesktopW :
        dimMultipliers.mapMobileW; // account for mobile 

    const mapContainerH = window.innerHeight * ratioH;
    const mapContainerW = ((window.innerWidth * ratioW) - margin.yAxis) -
        (6 * (margin.left));

    return [mapContainerW, mapContainerH];
};
