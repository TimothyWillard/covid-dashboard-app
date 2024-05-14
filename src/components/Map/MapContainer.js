import React, { useEffect, useRef, useState } from 'react';
import Map from '../Map/Map';
import { getDateIdx, getReadableDate, formatTitle } from '../../utils/utils';
import { GEOIDS } from '../../utils/geoids.tsx';
import { mapHighColorPalette, mapLowColorPalette } from '../../utils/colors';
import { scalePow } from 'd3-scale';
import { select } from 'd3-selection';
import PropType from 'prop-types';

const MapContainer = ({ geoid, indicators, width, height, scenario, firstDate, selectedDate, countyBoundaries, indicatorsForCounty, dateSliderActive }) => {
    const [ strokeWidth, setStrokeWidth ] = useState(0.8);
    const [ strokeHoverWidth, setStrokeHoverWidth ] = useState(1.8);
    const [ children, setChildren ] = useState([]);
    const mapContainerRef = useRef(null);

    const strokeWidthScale = scalePow()
        .exponent(0.25)
        .range([0.1, 0.8])
        .domain([9, 1]);
    const strokeHoverWidthScale = scalePow()
        .exponent(0.25)
        .range([0.25, 1.8])
        .domain([9, 1]);

    function handleZoom(event) {
        if (mapContainerRef.current) {
            const mapNode = select(mapContainerRef.current);
            mapNode.selectAll('path')
                .attr('transform', event.transform);
            const strokeWidth = strokeWidthScale(event.transform.k);
            const strokeHoverWidth = strokeHoverWidthScale(event.transform.k);
            setStrokeWidth(strokeWidth);
            setStrokeHoverWidth(strokeHoverWidth);
        }
    }

    function initializeMaps(geoid, scenario, firstDate, selectedDate, width, height) {
        const children = [];
        const dateIdx = getDateIdx(firstDate, selectedDate);
        let divider = 3;
        if (width < 350) {
            divider = 1
        } else if (width >= 350 && width < 700) {
            divider = 2
        }

        for (let indicator of indicators) {
            const child = {
                key: `${indicator.key}-map`,
                map: [],
            }
            child.map.push(
                <Map
                    key={`${indicator.key}-map`}
                    indicator={indicator}
                    geoid={geoid}
                    scenario={scenario}
                    dateIdx={dateIdx}
                    countyBoundaries={countyBoundaries}
                    indicatorsForCounty={indicatorsForCounty}
                    width={width / divider}
                    height={height}
                    lowColor={mapLowColorPalette[indicator.id]}
                    highColor={mapHighColorPalette[indicator.id]}
                    strokeWidth={strokeWidth}
                    strokeHoverWidth={strokeHoverWidth}
                    handleZoom={handleZoom}
                />
            )
            children.push(child);
        }

        setChildren(children);
    }

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        initializeMaps(geoid, scenario, firstDate, selectedDate, width, height);
    }, [ geoid, scenario, firstDate, selectedDate, width, height ]);
    /* eslint-enable react-hooks/exhaustive-deps */

    const scenarioTitle = formatTitle(scenario);
    const geoidName = `${GEOIDS[geoid]}`;

    return (
        <div>
            <div className="scenario-title titleNarrow">{geoidName}</div>
            <div className="scenario-title">{scenarioTitle}</div>
            <div className="filter-label threshold-label callout callout-row">
                {`Snapshot on `}
                {/*TS migration: Use getClassForActiveState(this.props.dateSliderActive)*/}
                <span className={dateSliderActive ? 'underline-active' : 'bold underline'}>
                    {getReadableDate(selectedDate)}
                </span>
            </div>
            <div className="map-wrapper" ref={mapContainerRef}>
                {children.map(child => {
                    return (
                        <div className="map" key={child.key}>
                            {child.map}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

MapContainer.propTypes = {
    geoid: PropType.string.isRequired,
    indicators: PropType.array.isRequired,
    width: PropType.number.isRequired,
    height: PropType.number.isRequired,
    scenario: PropType.string.isRequired,
    firstDate: PropType.string.isRequired,
    selectedDate: PropType.string.isRequired,
    countyBoundaries: PropType.object.isRequired,
    indicatorsForCounty: PropType.object.isRequired,
    dateSliderActive: PropType.bool.isRequired
}

export default MapContainer;
