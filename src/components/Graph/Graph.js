/* eslint-disable no-unused-vars */
import React, { useRef, useState, useCallback } from 'react'
import { Tooltip } from 'antd'
import PropTypes from 'prop-types';

import { line, area, curveLinear } from 'd3-shape'
import { bisectLeft, least, max, maxIndex } from 'd3-array'
import { select } from 'd3-selection'
import { easeCubicOut, easeCubicIn } from 'd3-ease'

import Axis from './Axis'
import Legend from './Legend'

import { margin } from '../../utils/constants'
import colors from '../../utils/colors';

const Graph = ({
    keyVal,
    indicator,
    geoid,
    scenario,
    severity,
    animateTransition,
    showConfBounds,
    confBounds,
    showActual,
    actual,
    series,
    selectedDates,
    indicatorThreshold,
    dateThreshold,
    runDate,
    brushActive,
    width,
    height,
    showLegend,
    x,
    y,
    xScale,
    yScale,
}) => {
    const [ hoveredSimPathId, setHoveredSimPathId ] = useState(null);
    const [ tooltipXPos, setTooltipXPos ] = useState(0);
    const [ tooltipYPos, setTooltipYPos ] = useState(0);
    const [ tooltipText, setTooltipText ] = useState('');

    const simPathsRef = useRef(null);
    const thresholdRef = useRef(null);
    const confBoundsRef = useRef(null);
    const actualRef = useRef(null);

    const handleMouseMove = useCallback((index) => {
        if (showConfBounds) 
            return;
        setHoveredSimPathId(index)
    }, [ showConfBounds ]);

    const handleMouseEnter = useCallback((index) => {
        if (showConfBounds) 
            return;
        setHoveredSimPathId(index)
    }, [ showConfBounds ]);

    const handleMouseLeave = () => {
        setHoveredSimPathId(null);
    };

    const handleBetterSimMouseHover = useCallback((event) => {
        if (showConfBounds) 
            return;
        event.preventDefault();
        const node = document.querySelector(`.graphSVG_${keyVal}`);
        let point = node.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        point = point.matrixTransform(node.getScreenCTM().inverse());
        const xm = xScale.invert(point.x);
        const ym = yScale.invert(point.y);
        const i1 = bisectLeft(selectedDates, xm, 1);
        const i0 = i1 - 1;
        const i = xm - selectedDates[i0] > selectedDates[i1] - xm ? i1 : i0;
        const s = least(series, d => Math.abs(d.vals[i] - ym));
        if (s) {
            const hoveredIdx = series.findIndex(sim => sim.name === s.name);
            const peak = max(s.vals);
            const peakIndex = maxIndex(s.vals);
            const tooltipXPos = xScale(selectedDates[peakIndex]);
            const tooltipYPos = yScale(peak);
            setHoveredSimPathId(hoveredIdx);
            setTooltipText(`R0: ${s.r0.toFixed(1)}`);
            setTooltipXPos(tooltipXPos);
            setTooltipYPos(tooltipYPos);
        }
    }, [ showConfBounds, keyVal, xScale, yScale, selectedDates, series ]);

    let simPaths = [];
    let confBoundsAreaPath = [];
    let confBoundsMeanLinePath = [];
    if (series && series.length > 0 && selectedDates && selectedDates.length > 0) {
        // Formerly drawSimPaths
        const lineGenerator = line()
            .defined((d) => {
                return !isNaN(d);
            })
            .x((d, i) => {
                return xScale(selectedDates[i]);
            })
            .y((d) => {
                return yScale(d);
            });
        simPaths = series.map((d) => {
            return lineGenerator(d.vals);
        });
        if (simPathsRef.current) {
            // Formerly updateSimPaths
            const simPathsNode = select(simPathsRef.current);
            if (!animateTransition) {
                simPathsNode
                    .selectAll('.simPath')
                    .data(series)
                    .attr('d', (d) => {
                        return lineGenerator(d.vals);
                    })
                    .attr('stroke', (d, i) => {
                        return series[i].over ? colors.red : colors.green;
                    });
            } else {
                simPathsNode
                    .selectAll('.simPath')
                    .data(series)
                    .transition()
                    .duration(300)
                    .ease(easeCubicIn)
                    .attr('stroke-opacity', 0)
                    .transition()
                    .duration(10)
                    .attr('d', (d) => {
                        return lineGenerator(d.vals);
                    })
                    .transition()
                    .duration(400)
                    .ease(easeCubicOut)
                    .attr('stroke', (d, i) => {
                        return series[i].over ? colors.red : colors.green;
                    })
                    .attr('stroke-opacity', 0.6);
            }
            simPathsNode
                .selectAll('.simPath-hover')
                .data(series)
                .attr('d', (d) => {
                    return lineGenerator(d.vals);
                });
        }
        // Formerly drawConfBounds
        const areaGenerator = area()
            .curve(curveLinear)
            .x((d, i) => {
                return xScale(selectedDates[i]);
            })
            .y0((d) => {
                return yScale(d.p10);
            })
            .y1((d) => {
                return yScale(d.p90);
            });
        const confBoundsLineGenerator = line()
            .x((d, i) => {
                return xScale(selectedDates[i]);
            })
            .y((d) => {
                return yScale(d.p50);
            })
        if (confBounds && confBounds.length > 0 && confBoundsRef.current) {
            confBoundsAreaPath = areaGenerator(confBounds);
            confBoundsMeanLinePath = confBoundsLineGenerator(confBounds);
            const confBoundsNode = select(confBoundsRef.current);
            confBoundsNode
                .selectAll('.confBoundsArea')
                .attr('d', confBoundsAreaPath);
            confBoundsNode
                .selectAll('.confBoundsMean')
                .attr('d', confBoundsMeanLinePath);
        }
    }

    return (
        <g 
            width={width} 
            height={height}
            transform={`translate(${x}, ${y})`}
            ref={simPathsRef}>
            <g> 
                <rect 
                    x={margin.left}
                    y={margin.top}
                    className={`graphArea`}
                    id={`graphArea_${keyVal}`}
                    width={width - margin.left - margin.right}
                    height={height - margin.bottom - margin.top}
                    fill={colors.graphBkgd}
                    onMouseMove={handleBetterSimMouseHover}
                    onMouseLeave={handleMouseLeave}/>
                {simPaths.map((simPath, i) => (
                    <path
                        d={simPath}
                        key={`simPath-${i}`}
                        id={`simPath-${i}`}
                        className={`simPath`}
                        fill='none' 
                        stroke={series[i].over ? colors.red : colors.green}
                        strokeWidth={'1'}
                        strokeOpacity={hoveredSimPathId || (showConfBounds && confBounds) ? 0 : 0.6}
                        onMouseMove={() => handleMouseMove(i)}
                        onMouseEnter={() => handleMouseEnter(i)}
                        onMouseLeave={handleMouseLeave}/>
                ))}
                {simPaths.map((simPath, i) => {
                    const simIsHovered = (i === hoveredSimPathId);
                    return (
                        <path
                            d={simPath}
                            key={`simPath-${i}-hover`}
                            id={`simPath-${i}-hover`}
                            className={`simPath-hover`}
                            fill='none' 
                            stroke={simIsHovered ? colors.blue : colors.lightGray}
                            strokeWidth={simIsHovered ? '2' : '1'}
                            strokeOpacity={hoveredSimPathId || (showConfBounds && confBounds) ? 1 : 0}
                            onMouseMove={() => handleMouseMove(i)}
                            onMouseEnter={() => handleMouseEnter(i)}
                            onMouseLeave={handleMouseLeave}/>
                    );
                })}
                <Tooltip
                    key={`sim-tooltip`}
                    title={tooltipText}
                    open={hoveredSimPathId ? true : false}
                    data-html="true">
                    <circle
                        cx={tooltipXPos}
                        cy={tooltipYPos}
                        r={2}
                        fill={colors.gray}
                        fillOpacity={0}
                        className={'tooltipCircle'}/>
                </Tooltip>
                <line
                    x1={xScale(runDate) < margin.left ? -margin.left : xScale(runDate)}
                    y1={margin.top}
                    x2={xScale(runDate) < margin.left ? -margin.left : xScale(runDate)}
                    y2={height - margin.bottom}
                    stroke={colors.blue}
                    strokeOpacity={0.8}
                    className={'runDate'}/>
            </g>
            {(showConfBounds && confBounds) &&
            <g ref={confBoundsRef}>
                <clipPath 
                    id={'confClip'}>
                    <rect 
                        x={margin.left}
                        y={margin.top}
                        width={width - margin.left - margin.right}
                        height={height - margin.bottom - margin.top}
                        fill={'pink'}
                        fillOpacity={0.5}/>
                </clipPath>
                <path
                    className={'confBoundsArea'}
                    d={confBoundsAreaPath}
                    fill={colors.green}
                    fillOpacity={0.3}
                    clipPath={'url(#confClip)'}/>
                <path
                    className={'confBoundsMean'}
                    d={confBoundsMeanLinePath}
                    stroke={colors.green}
                    strokeWidth={2}
                    fillOpacity={0}
                    clipPath={'url(#confClip)'}/>
            </g>
            }
            {(showActual && actual) &&
            <g ref={actualRef}>
                <clipPath 
                    id={'actualClip'}>
                    <rect 
                        x={margin.left}
                        y={margin.top}
                        width={width - margin.left - margin.right}
                        height={height - margin.bottom - margin.top}
                        fill={'pink'}
                        fillOpacity={0.5}/>
                </clipPath>
                {actual.map((d, i) => (
                    <circle
                        key={`actual-data-${i}-circle`}
                        cx={xScale(d.date)}
                        cy={yScale(d.val)}
                        r={1.5}
                        fill={colors.actual}
                        clipPath={'url(#actualClip)'}
                        className={'actualDataCircle'}/>
                ))}
            </g>
            }
            {!showConfBounds &&
            <g ref={thresholdRef}>
                <line
                    x1={margin.left}
                    y1={yScale(indicatorThreshold) < margin.top ? margin.top : yScale(indicatorThreshold)}
                    x2={width - margin.right}
                    y2={yScale(indicatorThreshold) < margin.top ? margin.top : yScale(indicatorThreshold)}
                    stroke={colors.gray}
                    className={'indicatorThreshold'}
                    strokeDasharray="4 2"/>
                <line
                    x1={xScale(dateThreshold) < margin.left ? margin.left : xScale(dateThreshold)}
                    y1={margin.top}
                    x2={xScale(dateThreshold) < margin.left ? margin.left : xScale(dateThreshold)}
                    y2={height - margin.bottom}
                    stroke={colors.gray}
                    className={'dateThreshold'}
                    strokeDasharray="4 2"/>
                <circle
                    cx={xScale(dateThreshold)}
                    cy={yScale(indicatorThreshold)}
                    r={4}
                    fill={colors.gray}
                    className={'thresholdCircle'}/>
            </g>}
            {showLegend &&
            <Legend 
                showConfBounds={showConfBounds}
                showHoveredSim={hoveredSimPathId}
                showActual={showActual}
                x={width - margin.right - 160}
                y={margin.top * 2.3}/>}
            <g>
                <Axis 
                    keyVal={keyVal}
                    width={width - margin.left}
                    height={height}
                    orientation={'bottom'}
                    view={'graph'}
                    scale={xScale}
                    x={0}
                    y={height - margin.bottom}/>
            </g>
        </g>
    );
};

Graph.propTypes = {
    keyVal: PropTypes.string,
    indicator: PropTypes.object,
    geoid: PropTypes.string,
    scenario: PropTypes.object,
    severity: PropTypes.string,
    animateTransition: PropTypes.bool,
    showConfBounds: PropTypes.bool,
    confBounds: PropTypes.array,
    showActual: PropTypes.bool,
    actual: PropTypes.array,
    series: PropTypes.array,
    selectedDates: PropTypes.array,
    indicatorThreshold: PropTypes.number,
    dateThreshold: PropTypes.instanceOf(Date),
    runDate: PropTypes.instanceOf(Date),
    brushActive: PropTypes.bool,
    width: PropTypes.number,
    height: PropTypes.number,
    showLegend: PropTypes.bool,
    x: PropTypes.number,
    y: PropTypes.number,
    xScale: PropTypes.func,
    yScale: PropTypes.func,
};

export default Graph;
