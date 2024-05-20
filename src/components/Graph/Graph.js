import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { line, area, curveLinear } from 'd3-shape';
import { bisectLeft, least, max, maxIndex } from 'd3-array';
import { select } from 'd3-selection';
import { easeCubicOut, easeCubicIn } from 'd3-ease';

import Axis from './Axis';
import Legend from './Legend';

import { margin } from '../../utils/constants';
import colors from '../../utils/colors';

const Graph = (props) => {
    const [state, setState] = useState({
        width: props.width,
        height: props.height,
        series: props.series,
        selectedDates: props.selectedDates,
        indicatorThreshold: props.indicatorThreshold,
        dateThreshold: props.dateThreshold,
        xScale: props.xScale,
        yScale: props.yScale,
        lineGenerator: line().defined(d => !isNaN(d)),
        simPaths: [],
        hoveredSimPathId: null,
        areaGenerator: area().curve(curveLinear),
        confBounds: props.confBounds,
        confBoundsAreaPath: [],
        confBoundsMeanLinePath: [],
        tooltipXPos: 0,
        tooltipYPos: 0,
        tooltipText: ''
    });

    const simPathsRef = useRef();
    const thresholdRef = useRef();
    const confBoundsRef = useRef();
    const actualRef = useRef();

    const drawSimPaths = useCallback((series, selectedDates) => {
        const { lineGenerator } = state;
        const { xScale, yScale } = props;

        lineGenerator.x((d, i) => xScale(selectedDates[i]));
        lineGenerator.y(d => yScale(d));

        const simPaths = series.map(d => lineGenerator(d.vals));

        setState(prevState => ({
            ...prevState,
            series,
            selectedDates,
            xScale,
            yScale,
            lineGenerator,
            simPaths
        }));
    }, [ props, state ]);

    const updateSimPaths = useCallback((series, selectedDates, lineGenerator, animateTransition, width) => {
        if (simPathsRef.current) {
            lineGenerator.x((d, i) => props.xScale(selectedDates[i]));
            lineGenerator.y(d => props.yScale(d));

            const simPaths = series.map(d => lineGenerator(d.vals));

            if (simPaths.length !== state.simPaths.length) {
                drawSimPaths(series, selectedDates);
            } else {
                const simPathsNode = select(simPathsRef.current);

                if (!animateTransition) {
                    simPathsNode.selectAll('.simPath')
                        .data(series)
                        .attr("d", d => lineGenerator(d.vals))
                        .attr("stroke", (d, i) => series[i].over ? colors.red : colors.green)
                        .on("end", () => {
                            setState(prevState => ({
                                ...prevState,
                                series,
                                selectedDates,
                                xScale: props.xScale,
                                yScale: props.yScale,
                                lineGenerator,
                                simPaths,
                                width
                            }));
                        });
                    simPathsNode.selectAll('.simPath-hover')
                        .data(series)
                        .attr("d", d => lineGenerator(d.vals));
                } else {
                    simPathsNode.selectAll('.simPath')
                        .data(series)
                        .transition()
                        .duration(300)
                        .ease(easeCubicIn)
                        .attr('stroke-opacity', 0)
                        .transition()
                        .duration(10)
                        .attr("d", d => lineGenerator(d.vals))
                        .transition()
                        .duration(400)
                        .ease(easeCubicOut)
                        .attr("stroke", (d, i) => series[i].over ? colors.red : colors.green)
                        .attr("stroke-opacity", 0.6)
                        .on("end", () => {
                            setState(prevState => ({
                                ...prevState,
                                series,
                                selectedDates,
                                xScale: props.xScale,
                                yScale: props.yScale,
                                lineGenerator,
                                simPaths,
                                width
                            }));
                        });
                    simPathsNode.selectAll('.simPath-hover')
                        .data(series)
                        .attr("d", d => lineGenerator(d.vals));
                }
            }
        }
    }, [ props, state, drawSimPaths ]);

    const drawConfBounds = useCallback((confBounds, areaGenerator, selectedDates) => {
        if (selectedDates) {
            areaGenerator
                .x((d, i) => props.xScale(selectedDates[i]))
                .y0(d => props.yScale(d.p10))
                .y1(d => props.yScale(d.p90));

            const confBoundsAreaPath = areaGenerator(confBounds);

            const confBoundsLineGenerator = line()
                .x((d, i) => props.xScale(selectedDates[i]))
                .y(d => props.yScale(d.p50));
            const confBoundsMeanLinePath = confBoundsLineGenerator(confBounds);

            setState(prevState => ({
                ...prevState,
                selectedDates,
                xScale: props.xScale,
                yScale: props.yScale,
                areaGenerator,
                confBoundsAreaPath,
                confBoundsMeanLinePath
            }));
        }
    }, [ props ]);

    const updateConfBounds = useCallback((confBounds, areaGenerator, selectedDates) => {
        if (confBoundsRef.current) {
            areaGenerator
                .x((d, i) => props.xScale(selectedDates[i]))
                .y0(d => props.yScale(d.p10))
                .y1(d => props.yScale(d.p90));

            const confBoundsAreaPath = areaGenerator(confBounds);

            const confBoundsLineGenerator = line()
                .x((d, i) => props.xScale(selectedDates[i]))
                .y(d => props.yScale(d.p50));
            const confBoundsMeanLinePath = confBoundsLineGenerator(confBounds);

            const confBoundsNode = select(confBoundsRef.current);
            confBoundsNode.selectAll('.confBoundsArea')
                .attr("d", confBoundsAreaPath);
            confBoundsNode.selectAll('.confBoundsMean')
                .attr("d", confBoundsMeanLinePath);

            setState(prevState => ({
                ...prevState,
                selectedDates,
                xScale: props.xScale,
                yScale: props.yScale,
                areaGenerator,
                confBoundsAreaPath,
                confBoundsMeanLinePath
            }));
        }
    }, [ props ]);

    const handleMouseMove = useCallback((event, index) => {
        if (props.showConfBounds) return;
        setState(prevState => ({ ...prevState, hoveredSimPathId: index }));
    }, [ props ]);

    const handleMouseEnter = useCallback((event, index) => {
        if (props.showConfBounds) return;
        setState(prevState => ({ ...prevState, hoveredSimPathId: index }));
    }, [ props ]);

    const handleMouseLeave = () => {
        setState(prevState => ({ ...prevState, hoveredSimPathId: null }));
    };

    const handleBetterSimMouseHover = useCallback((event) => {
        if (props.showConfBounds) return;
        event.preventDefault();
        const selector = `.graphSVG_${props.keyVal}`;
        const node = document.querySelector(selector);
        let point = node.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        point = point.matrixTransform(node.getScreenCTM().inverse());
        const xm = props.xScale.invert(point.x);
        const ym = props.yScale.invert(point.y);
        const i1 = bisectLeft(props.selectedDates, xm, 1);
        const i0 = i1 - 1;
        const i = xm - props.selectedDates[i0] > props.selectedDates[i1] - xm ? i1 : i0;
        const s = least(props.series, d => Math.abs(d.vals[i] - ym));
        if (s) {
            const hoveredIdx = props.series.findIndex(sim => sim.name === s.name);
            const peak = max(s.vals);
            const peakIndex = maxIndex(s.vals);
            const tooltipXPos = props.xScale(props.selectedDates[peakIndex]);
            const tooltipYPos = props.yScale(peak);
            setState(prevState => ({
                ...prevState,
                hoveredSimPathId: hoveredIdx,
                tooltipText: `R0: ${s.r0.toFixed(1)}`,
                tooltipXPos,
                tooltipYPos
            }));
        }
    }, [ props ]);

    useEffect(() => {
        drawSimPaths(state.series, state.selectedDates);
        if (state.confBounds && state.confBounds.length > 0) {
            drawConfBounds(state.confBounds, state.areaGenerator, state.selectedDates);
        }
    }, []);

    useEffect(() => {
        if (props.series !== state.series || props.xScale !== state.xScale || props.yScale !== state.yScale) {
            updateSimPaths(props.series, state.selectedDates, state.lineGenerator, props.animateTransition, props.width);
            if (state.confBounds && state.confBounds.length > 0) {
                updateConfBounds(state.confBounds, state.areaGenerator, state.selectedDates);
            }
        }
    }, [ props ]);

    return (
        <g 
            width={props.width} 
            height={props.height}
            transform={`translate(${props.x}, ${props.y})`}
            ref={simPathsRef}
        >
            <g> 
                <rect 
                    x={margin.left}
                    y={margin.top}
                    className={`graphArea`}
                    id={`graphArea_${props.keyVal}`}
                    width={props.width - margin.left - margin.right}
                    height={props.height - margin.bottom - margin.top}
                    fill={colors.graphBkgd}
                    onMouseMove={handleBetterSimMouseHover}
                    onMouseLeave={handleMouseLeave}
                />
                {state.simPaths.map((simPath, i) => (
                    <path
                        d={simPath}
                        key={`simPath-${i}`}
                        id={`simPath-${i}`}
                        className={`simPath`}
                        fill='none' 
                        stroke={state.series[i].over ? colors.red : colors.green}
                        strokeWidth={'1'}
                        strokeOpacity={state.hoveredSimPathId || (props.showConfBounds && props.confBounds) ? 0 : 0.6}
                        onMouseMove={(e) => handleMouseMove(e, i)}
                        onMouseEnter={(e) => handleMouseEnter(e, i)}
                        onMouseLeave={handleMouseLeave}
                    />
                ))}
                {state.simPaths.map((simPath, i) => {
                    const simIsHovered = (i === state.hoveredSimPathId);
                    return (
                        <path
                            d={simPath}
                            key={`simPath-${i}-hover`}
                            id={`simPath-${i}-hover`}
                            className={`simPath-hover`}
                            fill='none' 
                            stroke={simIsHovered ? colors.blue : colors.lightGray}
                            strokeWidth={simIsHovered ? '2' : '1'}
                            strokeOpacity={state.hoveredSimPathId || (props.showConfBounds && props.confBounds) ? 1 : 0}
                            onMouseMove={(e) => handleMouseMove(e, i)}
                            onMouseEnter={(e) => handleMouseEnter(e, i)}
                            onMouseLeave={handleMouseLeave}
                        />
                    );
                })}
                <Tooltip
                    key={`sim-tooltip`}
                    title={state.tooltipText}
                    open={state.hoveredSimPathId ? true : false}
                    data-html="true"
                >
                    <circle
                        cx={state.tooltipXPos}
                        cy={state.tooltipYPos}
                        r={2}
                        fill={colors.gray}
                        fillOpacity={0}
                        className={'tooltipCircle'}
                    />
                </Tooltip>
                <line
                    x1={props.xScale(props.runDate) < margin.left ? -margin.left : props.xScale(props.runDate)}
                    y1={margin.top}
                    x2={props.xScale(props.runDate) < margin.left ? -margin.left : props.xScale(props.runDate)}
                    y2={props.height - margin.bottom}
                    stroke={colors.blue}
                    strokeOpacity={0.8}
                    className={'runDate'}
                />
            </g>
            {(props.showConfBounds && props.confBounds) &&
            <g ref={confBoundsRef}>
                <clipPath 
                    id={'confClip'}
                >
                    <rect 
                        x={margin.left}
                        y={margin.top}
                        width={props.width - margin.left - margin.right}
                        height={props.height - margin.bottom - margin.top}
                        fill={'pink'}
                        fillOpacity={0.5}
                    />
                </clipPath>
                <path
                    className={'confBoundsArea'}
                    d={state.confBoundsAreaPath}
                    fill={colors.green}
                    fillOpacity={0.3}
                    clipPath={'url(#confClip)'}
                />
                <path
                    className={'confBoundsMean'}
                    d={state.confBoundsMeanLinePath}
                    stroke={colors.green}
                    strokeWidth={2}
                    fillOpacity={0}
                    clipPath={'url(#confClip)'}
                />
            </g>
            }
            {(props.showActual && props.actual) &&
            <g ref={actualRef}>
                <clipPath 
                    id={'actualClip'}
                >
                    <rect 
                        x={margin.left}
                        y={margin.top}
                        width={props.width - margin.left - margin.right}
                        height={props.height - margin.bottom - margin.top}
                        fill={'pink'}
                        fillOpacity={0.5}
                    />
                </clipPath>
                {props.actual.map((d, i) => (
                    <circle
                        key={`actual-data-${i}-circle`}
                        cx={props.xScale(d.date)}
                        cy={props.yScale(d.val)}
                        r={1.5}
                        fill={colors.actual}
                        clipPath={'url(#actualClip)'}
                        className={'actualDataCircle'}
                    />
                ))}
            </g>
            }
            {!props.showConfBounds &&
            <g ref={thresholdRef}>
                <line
                    x1={margin.left}
                    y1={props.yScale(props.indicatorThreshold) < margin.top ? margin.top : props.yScale(props.indicatorThreshold)}
                    x2={props.width - margin.right}
                    y2={props.yScale(props.indicatorThreshold) < margin.top ? margin.top : props.yScale(props.indicatorThreshold)}
                    stroke={colors.gray}
                    className={'indicatorThreshold'}
                    strokeDasharray="4 2"
                />
                <line
                    x1={props.xScale(props.dateThreshold) < margin.left ? margin.left : props.xScale(props.dateThreshold)}
                    y1={margin.top}
                    x2={props.xScale(props.dateThreshold) < margin.left ? margin.left : props.xScale(props.dateThreshold)}
                    y2={props.height - margin.bottom}
                    stroke={colors.gray}
                    className={'dateThreshold'}
                    strokeDasharray="4 2"
                />
                <circle
                    cx={props.xScale(props.dateThreshold)}
                    cy={props.yScale(props.indicatorThreshold)}
                    r={4}
                    fill={colors.gray}
                    className={'thresholdCircle'}
                />
            </g>
            }
            {props.showLegend &&
            <Legend 
                showConfBounds={props.showConfBounds}
                showHoveredSim={state.hoveredSimPathId}
                showActual={props.showActual}
                x={props.width - margin.right - 160}
                y={margin.top * 2.3}
            />
            }
            <g>
                <Axis 
                    keyVal={props.keyVal}
                    width={props.width - margin.left}
                    height={props.height}
                    orientation={'bottom'}
                    view={'graph'}
                    scale={props.xScale}
                    x={0}
                    y={props.height - margin.bottom}
                />
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
