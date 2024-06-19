import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types';
import { axisBottom } from 'd3-axis'
import { scaleLinear, scaleUtc } from 'd3-scale'
import { select } from 'd3-selection'
import { line } from 'd3-shape'
import { timeFormat } from 'd3-time-format'
import { brushX, brushSelection } from 'd3-brush'
import { max, extent } from 'd3-array'
import { easeCubicOut } from 'd3-ease'

import { margin, monthDateFormat } from '../../utils/constants'
import { colors } from '../../utils/colors';

// This should go into utils somewhere
const getScales = (series, dates, width, height) => {
    // calculate scale domains
    const timeDomain = extent(dates);
    const maxVal = max(series, sims => max(sims.vals))
    // set scale ranges to width and height of container
    const xScale = scaleUtc()
        .range([margin.left, width - margin.right])
        .domain(timeDomain);
    const yScale = scaleLinear()
        .range([height - margin.bottom, margin.top])
        .domain([0, maxVal])
        .nice();
    return { xScale, yScale }
};

const Brush = ({
    width, 
    height,
    x, 
    y,
    animateTransition,
    showConfBounds,
    series,
    dates,
    dateRange,
    onBrushStart,
    onBrushChange,
    onBrushEnd,
}) => {
    const [ scales, setScales ] = useState({});
    const [ simPaths, setSimPaths ] = useState([]);

    const [ stateWidth, setStateWidth ] = useState(-1);
    const [ stateHeight, setStateHeight ] = useState(-1);
    const [ stateSeries, setStateSeries ] = useState(null);

    const xAxis = useRef(null);
    const xAxisRef = useRef(null);
    const simPathsRef = useRef(null);
    const brush = useRef(null);
    const brushRef = useRef(null);

    const brushed = useCallback((event) => {
        const selection = event.selection;
        if (selection == null || scales == null || Object.keys(scales).length === 0) {
            return;
        }
        if (event.selection && event.sourceEvent !== null) {
            const [x1, x2] = event.selection;
            const range = [scales.xScale.invert(x1), scales.xScale.invert(x2)];
            onBrushChange(range);
        }
    }, [ scales, onBrushChange ]);
    
    const brushEnded = useCallback((event) => {
        if (!event.selection && brushRef && brushRef.current) {
            const selection = brushSelection(brushRef.current) ? null : scales.xScale.range();
            select(brushRef.current).call(brush.move, selection)
        }
        onBrushEnd();
    }, [ brushRef, scales, brush, onBrushEnd ]);

    const updateSimPaths = useCallback((series, dates, width, height, dateRange, showConfBounds, animateTransition) => {
        const updatedScales = getScales(series, dates, width, height);
        // Update sim paths
        if (simPathsRef && simPathsRef.current) {
            // update scale and data
            const lineGenerator = line()
                .defined(d => !isNaN(d))
                .x((d, i) => updatedScales.xScale(dates[i]))
                .y(d => updatedScales.yScale(d));
            // generate simPaths from lineGenerator
            const simPathsLocal = series.map((d) => {
                return lineGenerator(d.vals);
            });
            // update state
            setStateSeries(series);
            setSimPaths(simPathsLocal);
            // get svg node
            const simPathsNode = select(simPathsRef.current)
            // update the paths with new data
            if (animateTransition) {
                simPathsNode.selectAll('.simPath')
                    .data(series)
                    .transition()
                    .duration(100)
                    .ease(easeCubicOut)
                        .attr('stroke-opacity', 0)
                    .transition()
                    .duration(700)
                    .ease(easeCubicOut)
                    .attr("d", d => lineGenerator(d.vals))
                    .attr("stroke", (d,i) => showConfBounds ? colors.gray : series[i].over ? colors.red : colors.green)
                    .attr("stroke-opacity", 0.6)
                    .on("end", () => {
                        // set new vals to state
                        setScales(updatedScales);
                    })
            } else {
                simPathsNode.selectAll('.simPath')
                    .data(series)
                    .attr("d", d => lineGenerator(d.vals))
                    .attr("stroke", (d, i) => showConfBounds ? colors.gray : series[i].over ? colors.red : colors.green);
            }
        }
        // update the x-axis
        if (xAxis && xAxis.current && xAxisRef && xAxisRef.current) {
            xAxis.current.scale(updatedScales.xScale);
            const xAxisNode = select(xAxisRef.current);
            xAxisNode.call(xAxis.current);
        }
        // update the brush
        if (brush && brush.current && brushRef && brushRef.current) {
            brush.current.extent([
                [margin.left, margin.top],
                [width - margin.right, height - margin.bottom]
            ]);
            const brushRefNode = select(brushRef.current);
            brushRefNode.call(brush.current)
                .call(brush.current.move, [updatedScales.xScale(dateRange[0]), updatedScales.xScale(dateRange[1])]);
        }
        // save new scales to state if transition doesn't animate
        setScales(updatedScales);
    }, [ simPathsRef, xAxis, xAxisRef, brush, brushRef ]);

    const setupBrush = useCallback(() => {
        const updatedScales = getScales(series, dates, width, height);
        
        const lineGenerator = line()
            .defined(d => !isNaN(d))
            .x((d, i) => updatedScales.xScale(dates[i]))
            .y(d => updatedScales.yScale(d));
        
        const simPathsLocal = series.map((d) => {
            return lineGenerator(d.vals);
        });

        xAxis.current = axisBottom()
            .scale(updatedScales.xScale)
            .tickFormat(date => timeFormat(monthDateFormat)(date))
            .ticks(width/80)
            .tickSizeOuter(0);
        if (xAxisRef && xAxisRef.current) {
            select(xAxisRef.current).call(xAxis.current);
        }

        if (brushRef && brushRef.current) {
            const brushRefNode = select(brushRef.current);
            brushRefNode.call(brush.current)
                .call(brush.current.move, [updatedScales.xScale(dateRange[0]), updatedScales.xScale(dateRange[1])]);
        }

        setScales(updatedScales);
        setStateSeries(series);
        setStateHeight(height);
        setStateWidth(width);
        setSimPaths(simPathsLocal);
    }, [ series, dates, width, height, xAxis, xAxisRef, brushRef, brush, dateRange ]);

    useEffect(() => {
        if (brush === null || brush.current === null) {
            brush.current = brushX()
                .extent([
                    [margin.left, margin.top],
                    [width, - margin.right, height - margin.bottom]
                ])
                .on('start', onBrushStart)
                .on('end', brushEnded)
                .on('brush', brushed);
        }
        return () => {
            brush.current = null;
        };
    }, [ brush, width, height, onBrushStart, brushEnded, brushed ]);

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (width !== stateWidth || height !== stateHeight) {
            updateSimPaths(series, dates, width, height, dateRange, showConfBounds, false);
            return;
        } else if (series !== stateSeries) {
            updateSimPaths(series, dates, width, height, dateRange, showConfBounds, animateTransition);
        }
        return () => {};
    }, [ updateSimPaths, series, dates, width, height, showConfBounds, animateTransition ]);

    useEffect(() => {
        setupBrush();
    }, []);
    /* eslint-enable react-hooks/exhaustive-deps */

    return (
        <div className='brush-wrapper'>
            <svg 
                width={width} 
                height={height} 
                transform={`translate(${x},${y})`}>
                <g ref={xAxisRef}  transform={`translate(0, ${height - margin.bottom})`} />
                <g ref={simPathsRef}>
                    <rect 
                        x={margin.left}
                        y={margin.top}
                        width={width - margin.left - margin.right}
                        height={height - margin.bottom - margin.top}
                        fill={'#fbfbfb'} />
                    {simPaths && simPaths.length > 0 && simPaths.map((simPath, i) => {
                        return (
                            <path
                                d={simPath}
                                key={`simPath-${i}`}
                                id={`simPath-${i}`}
                                className={`simPath`}
                                fill='none' 
                                stroke={showConfBounds ? colors.gray : series[i].over ? colors.red : colors.green}
                                strokeWidth={'1'}
                                strokeOpacity={0.4} />
                        );
                    })}
                </g>
                <g ref={brushRef} />
            </svg>
        </div>
    );
}

Brush.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    animateTransition: PropTypes.bool.isRequired,
    showConfBounds: PropTypes.bool.isRequired,
    series: PropTypes.array.isRequired,
    dates: PropTypes.array.isRequired,
    dateRange: PropTypes.array.isRequired,
    onBrushStart: PropTypes.func.isRequired,
    onBrushChange: PropTypes.func.isRequired,
    onBrushEnd: PropTypes.func.isRequired,
};

export default Brush;
