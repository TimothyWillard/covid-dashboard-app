import React, { useCallback, useEffect, useRef, useState } from 'react';
import { geoPath, geoMercator, geoTransverseMercator, geoConicConformal, geoAlbers } from 'd3-geo';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { zoom } from 'd3-zoom';
import { select } from 'd3-selection';
import _ from 'lodash';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types'

import Axis from '../Graph/Axis';
import { addCommas } from '../../utils/utils';
import colors from '../../utils/colors';
import { STATEPLANES } from '../../utils/projectionSettings';
import { dim } from '../../utils/constants'

const Map = ({ indicator, geoid, scenario, dateIdx, countyBoundaries, indicatorsForCounty, width, height, lowColor, highColor, strokeWidth, strokeHoverWidth, handleZoom }) => {
    const [ countyIsHovered, setCountyIsHovered ] = useState(false);
    const [ hoveredCounty, setHoveredCounty ] = useState(null); 
    const [ tooltipText, setTooltipText ] = useState('');
    const [ gradientH, setGradientH ] = useState(0);

    const mapRef = useRef(null);
    const zoomRef = useRef(null);

    const handleCountyEnter = _.debounce((feature) => {
        const tooltips = document.querySelectorAll('.ant-tooltip');
        if (tooltips) {
            tooltips.forEach(tooltip => {
                tooltip.style.visibility = "hidden"
            });
            if (hoveredCounty !== feature.properties.geoid) {
                setHoveredCounty(null);
                setCountyIsHovered(false);
            }
            
            if (!countyIsHovered) {
                let statInfo = 'No Indicator Data'
                if (feature.properties[indicator.key] && feature.properties[indicator.key].length > 0) {
                    statInfo = `${indicator.name}: ${addCommas(feature.properties[indicator.key][dateIdx])}`;
                } 

                const text = `${feature.properties.name} County <br>
                            Population: ${addCommas(feature.properties.population)} <br>
                            ${statInfo}`
    
                const tooltipText = () =>  (<div dangerouslySetInnerHTML={{__html: text}}></div>)
                
                setHoveredCounty(feature.properties.geoid);
                setCountyIsHovered(true);
                setTooltipText(tooltipText);
            }
        }
    }, 10);

    const handleCountyLeave = _.debounce((feature) => {
        const tooltips = document.querySelectorAll('.ant-tooltip');
        if (tooltips) {
            tooltips.forEach(tooltip => {
                tooltip.style.visibility = 'hidden';                
            });
            if (hoveredCounty === feature.properties.geoid) {
                setHoveredCounty(null);
                setCountyIsHovered(false);
            }
        }
    }, 10);

    const handleMouseMove = useCallback(() => {
        setHoveredCounty(null);
        setCountyIsHovered(false);
    }, []);

    const zoomed = useCallback((event) => {
        handleZoom(event);
    }, [ handleZoom ]);

    const handleZoomIn = useCallback(() => {
        if (mapRef.current && zoomRef.current) {
            // scale zoom on button press
            const mapNode = select(mapRef.current)
            zoomRef.current.scaleBy(mapNode.transition().duration(750), 1.2);
        }
    }, [ mapRef ]);

    const handleZoomOut = useCallback(() => {
        if (mapRef.current && zoomRef.current) {
            // scale zoom on button press
            const mapNode = select(mapRef.current)
            zoomRef.current.scaleBy(mapNode.transition().duration(750), 0.8);
        }
    }, [ mapRef ]);

    useEffect(() => {
        setGradientH(0.5*(width-dim.gradientMargin));
        if (mapRef.current && zoomRef.current) {
            select(mapRef.current).call(zoomRef.current);
        }
        return () => {
            setGradientH(0);
        }
    }, [ width, mapRef, zoomRef ]);

    useEffect(() => {
        zoomRef.current = zoom()
            .scaleExtent([1, 9])
            .on('zoom', zoomed);
        return () => {
            zoomRef.current = null;
        }
    }, [ handleZoom, zoomed ]);

    // Previously in calculateScales
    let statArray = [];
    let normalizedStatArray = [];
    let normalizedIndicatorsAll = [];
    for (let i = 0; i < countyBoundaries.features.length; ++i) {
        const { geoid: localGeoid, population: localPopulation } = countyBoundaries.features[i].properties;
        if (indicatorsForCounty[localGeoid]) {
            statArray = indicatorsForCounty[localGeoid][scenario][indicator.key];
            if (statArray) {
                normalizedStatArray = statArray.map(val => {
                    return 10_000.0*(val/localPopulation);
                });
                normalizedIndicatorsAll.push(normalizedStatArray);
            } else {
                console.log(`Missing the indicator key '${indicator.key}' for geoid '${localGeoid}' and scenario '${scenario}'.`);
            }
        }
        countyBoundaries.features[i].properties[indicator.key] = statArray;
        countyBoundaries.features[i].properties[`${indicator.key}Norm`] = normalizedStatArray
    }
    const maxValueNorm = max(normalizedIndicatorsAll.map(v => {
        return max(v);
    }))
    const yScale = scaleLinear()
        .range([gradientH, 0])
        .domain([0, maxValueNorm]);

    // Previously in drawCounties
    const stateFips = geoid.slice(0,2);

    const statePlane = STATEPLANES[stateFips];
    const parallels = STATEPLANES[stateFips].parallels ? STATEPLANES[stateFips].parallels : [];
    const rotation = STATEPLANES[stateFips].rotate ? STATEPLANES[stateFips].rotate : [];

    let projection;
    if (statePlane.proj === 'merc') {
        projection = geoMercator()
            // .parallels(parallels)
            // .rotate(rotation)
            .fitSize([width - dim.legendW, height], countyBoundaries);
    } else if (statePlane.proj === 'tmerc') {
        projection = geoTransverseMercator()
            // .parallels(parallels)
            .rotate(rotation)
            .fitSize([width - dim.legendW, height], countyBoundaries);
    } else if (statePlane.proj === 'lcc') {
        projection = geoConicConformal()
            .parallels(parallels)
            .rotate(rotation)
            .fitSize([width - dim.legendW, height], countyBoundaries);
    } else {
        projection = geoAlbers()
            .parallels(parallels)
            .rotate(rotation)
            .fitSize([width - dim.legendW, height], countyBoundaries);
    }

    const pathGenerator = geoPath()
        .projection(projection);
    const ramp = scaleLinear()
        .domain([ 0, maxValueNorm ])
        .range([lowColor, highColor]);

    const counties = countyBoundaries.features.map((d, i) => {
        return (
            <Tooltip
                key={`tooltip-county-boundary-${i}`}
                title={tooltipText}
                open={hoveredCounty === d.properties.geoid}
                data-html="true"
                destroyTooltipOnHide={true}>
                <path
                    key={`county-boundary-${i}`}
                    d={pathGenerator(d)}
                    style={{
                        stroke: (hoveredCounty === d.properties.geoid) || (geoid === d.properties.geoid) ? highColor : colors.gray,
                        strokeWidth: (hoveredCounty === d.properties.geoid) || (geoid === d.properties.geoid) ? strokeHoverWidth : strokeWidth,
                        fill: (d.properties[`${indicator.key}Norm`] && d.properties[`${indicator.key}Norm`].length > 0) ? ramp(d.properties[`${indicator.key}Norm`][dateIdx]) : colors.lightGray,
                        fillOpacity: 1,
                        cursor: 'pointer'
                    }}
                    className='counties'
                    onMouseEnter={() => handleCountyEnter(d)}
                    onMouseLeave={() => handleCountyLeave(d)}
                />
            </Tooltip>
        );
    });
    
    return (
        <div className="map-parent">
            <div className='titleNarrow map-title'>{`${indicator.name} per 10K people`}</div>
            <div className="map-parent">
                <div><button className="zoom" id="zoom_in" onClick={handleZoomIn}>+</button></div>
                <div><button className="zoom" id="zoom_out" onClick={handleZoomOut}>-</button></div>
            </div>
            <svg width={dim.legendW} height={height}>
                <defs>
                    <linearGradient 
                        id={`map-legend-gradient-${indicator.key}`} 
                        x1="100%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                        spreadMethod="pad"
                    >
                        <stop offset="0%" stopColor={highColor} stopOpacity="1"></stop>
                        <stop offset="100%" stopColor={lowColor} stopOpacity="1"></stop>
                    </linearGradient>
                </defs>
                <rect
                    width={dim.gradientW}
                    height={gradientH}
                    transform={`translate(0, ${dim.gradientMargin})`}
                    style={{ fill: `url(#map-legend-gradient-${indicator.key}` }}
                >
                </rect>
                <Axis 
                    width={dim.gradientW}
                    height={gradientH}
                    orientation={'right'}
                    scale={yScale}
                    x={dim.gradientW}
                    y={dim.gradientMargin}
                />
            </svg>
            <svg 
                width={width - dim.legendW}
                height={height}
                className={`mapSVG-${indicator.key}`}
                ref={mapRef}>
                <g>
                    {/* debug green svg */}
                    <rect
                        x={0}
                        y={0}
                        width={width - dim.legendW}
                        height={height}
                        fill={colors.graphBkgd}
                        fillOpacity={0.8}
                        stroke={'#00ff00'}
                        strokeWidth='1'
                        strokeOpacity={0}
                        style={{ 'cursor': 'grab' }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseMove}
                    /> 
                    {countyBoundaries.features && counties}
                </g>
            </svg>
        </div>
    );
};

Map.propTypes = {
    indicator: PropTypes.object.isRequired,
    geoid: PropTypes.string.isRequired,
    scenario: PropTypes.string.isRequired,
    dateIdx: PropTypes.number.isRequired,
    countyBoundaries: PropTypes.object.isRequired,
    indicatorsForCounty: PropTypes.object.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    lowColor: PropTypes.string.isRequired,
    highColor: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired, 
    strokeHoverWidth: PropTypes.number.isRequired, 
    handleZoom: PropTypes.func.isRequired,
};

export default Map;
