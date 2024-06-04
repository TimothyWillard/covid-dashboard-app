import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'; 
import PropTypes from 'prop-types';
import { min, max, quantile } from 'd3-array';
import { scaleLinear, scaleBand, scalePow } from 'd3-scale';
import { select } from 'd3-selection';
import { easeCubicOut } from 'd3-ease'
import _ from 'lodash';
import { Tooltip } from 'antd';

import Axis from '../Graph/Axis';
import { getDateIdx, addCommas, capitalize, formatTitle } from '../../utils/utils';
import { margin } from '../../utils/constants'
import colors, { scenarioColorPalette } from '../../utils/colors';

const Chart = ({
    dataset,
    scenarios,
    scenarioMap,
    firstDate,
    start,
    end,
    indicator,
    indicators,
    statLabel,
    width,
    height,
    handleCalloutInfo,
    handleCalloutLeave,
    handleScenarioHover,
    scale,
}) => {
    const [ hoveredRect, setHoveredRect ] = useState({
        'severity': '',
        'scenario': '',
        'index': 0,
    });
    const [ rectIsHovered, setRectIsHovered ] = useState(false);
    const [ tooltipText, setTooltipText ] = useState(null);
    const [, setTriggerRender] = useState(false);

    const quantileObjRef = useRef({});
    const scaleDomainsRef = useRef(false);
    const xScaleRef = useRef(null);
    const yScaleRef = useRef(null);

    const chartRef = useRef(null);
    const chartXAxisRef = useRef(null);
    const chartYAxisRef = useRef(null);

    const handleHighlightEnter = useMemo(() => {
        return _.debounce((event, severity, scenario, index) => {
            if (!rectIsHovered && quantileObjRef && quantileObjRef.current) {
                const quantileObj = quantileObjRef.current;
                const hoveredRect = {
                    'severity': severity,
                    'scenario': scenario,
                    'index': index
                };
                const median = quantileObj[indicator][scenario][severity]['median'];
                const tenth = quantileObj[indicator][scenario][severity]['tenth'];
                const ninetyith = quantileObj[indicator][scenario][severity]['ninetyith'];
                const severityText = indicator === 'incidI' ? '' : `${capitalize(severity)} Severity<br>`;
                const text =    `${formatTitle(scenarios[index])}<br>` +
                                severityText +
                                `p90: ${addCommas(Math.ceil(ninetyith))}<br>` +
                                `median: ${addCommas(Math.ceil(median))}<br>` +
                                `p10: ${addCommas(Math.ceil(tenth))}<br>`;
                const tooltipText = () =>  (<div dangerouslySetInnerHTML={{__html: text}}></div>);
                setHoveredRect(hoveredRect);
                setRectIsHovered(true);
                setTooltipText(tooltipText);
                handleCalloutInfo(statLabel, median, tenth, ninetyith, true);
                handleScenarioHover(index);
            }
        }, 100);
    }, [ rectIsHovered, quantileObjRef, indicator, statLabel, scenarios, handleCalloutInfo, handleScenarioHover ]);

    const handleHighlightLeave = useMemo(() => {
        return _.debounce(() => {
            if (rectIsHovered) {
                const hoveredRect = {
                    'severity': '',
                    'scenario': '',
                    'index': 0
                };
                setHoveredRect(hoveredRect);
                setRectIsHovered(false);
                handleCalloutLeave();
                handleScenarioHover(null);
            }
        }, 100);
    }, [ rectIsHovered, handleCalloutLeave, handleScenarioHover ]);

    // formerly calculateQuantiles
    useEffect(() => {
        let quantileObj = {[indicator]: {}};        
        const startIdx = getDateIdx(firstDate, start);
        const endIdx = getDateIdx(firstDate, end);
        let globalMaxVal = 0;

        for (let scenario of scenarios) {
            const severities = scenarioMap[scenario];
            quantileObj[indicator][scenario] = {};
            for (let severity of severities) {
                const sumArray = dataset[scenario][severity][indicator].map(sim => {
                    return sim.vals.slice(startIdx, endIdx).reduce((a, b) => a + b, 0);
                } );
                const minVal = min(sumArray);
                const maxVal = max(sumArray);
                const tenth = quantile(sumArray, 0.10);
                const quartile = quantile(sumArray, 0.25);
                const median = quantile(sumArray, 0.5);
                const thirdquartile = quantile(sumArray, 0.75);
                const ninetyith = quantile(sumArray, 0.9);
                
                // keep track of largest value across all the severities and scenarios for yAxis
                if (maxVal > globalMaxVal) globalMaxVal = maxVal;

                quantileObj[indicator][scenario][severity] = {
                    minVal, maxVal, tenth, quartile, median, thirdquartile, ninetyith, //xScale, yScale
                };
            }
        }
        
        let yScale;
        if (scale === 'linear') {
            yScale = scaleLinear()
                .range([height - margin.bottom, margin.top])
                .domain([0, globalMaxVal]);
        } else {
            yScale = scalePow()
                .exponent(0.25)
                .range([height - margin.bottom, margin.chartTop])
                .domain([0, globalMaxVal]);
        }
        const xScale = scaleBand()
            .range([margin.left, width])
            .domain(scenarios);

        quantileObjRef.current = quantileObj;
        xScaleRef.current = xScale;
        yScaleRef.current = yScale;
        scaleDomainsRef.current = Object.keys(quantileObj).length > 0;
        
        return () => {
            quantileObjRef.current = {};
            xScaleRef.current = null;
            yScaleRef.current = null;
            scaleDomainsRef.current = false;
        };
    }, [ dataset, scenarios, scenarioMap, firstDate, start, end, indicator, indicators, width, height, scale ]);

    // Formerly updateSummaryIndicators
    useEffect(() => {
        if (chartRef && chartRef.current
            && quantileObjRef && quantileObjRef.current
            && xScaleRef && xScaleRef.current
            && yScaleRef && yScaleRef.current) {
            // Unpack refs
            const quantileObj = quantileObjRef.current;
            const xScale = xScaleRef.current;
            const yScale = yScaleRef.current;
            // always calculate barWidth for three severities even if there are fewer
            const barWidth = ((width / 3) / scenarios.length) - margin.left - margin.right;
            const barMargin = 10;
            const whiskerMargin = barWidth * 0.2;
            // update paths with new data
            const barNodes = select(chartRef.current);

            scenarios.map((scenario) => {
                const severities = scenarioMap[scenario];
                Object.entries(quantileObj[indicator][scenario]).forEach(([severity, value], j) => {
                    // place scenarios with fewer severities around the center tick mark
                    if (severities.length === 1) {
                        j = 1;
                    } else if (severities.length === 2) {
                        j +=  ((j + 1) * 0.3333);
                    } else {
                        // just use j
                    }
                    // severity (key) is the severity, value is the object of quantiles calculated
                    barNodes.selectAll(`.bar-${scenario}-${severity}`)
                        .transition()
                        .duration(500)
                        .attr("x", (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario))
                        .attr("y", yScale(value.median))
                        .attr("width", barWidth)
                        .attr("height", yScale(0) - yScale(value.median))
                        .ease(easeCubicOut);
                    barNodes.selectAll(`.vertline-${scenario}-${severity}`)
                        .transition()
                        .duration(500)
                        .attr("x1", (barWidth/2 + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario)))
                        .attr("y1", yScale(value.ninetyith))
                        .attr("x2", (barWidth/2 + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario)))
                        .attr("y2", yScale(value.tenth))
                        .ease(easeCubicOut);
                    barNodes.selectAll(`.topline-${scenario}-${severity}`)
                        .transition()
                        .duration(500)
                        .attr("x1", (whiskerMargin + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario)))
                        .attr("y1", yScale(value.ninetyith))
                        .attr("x2", (barWidth - whiskerMargin + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario)))
                        .attr("y2", yScale(value.ninetyith))
                        .ease(easeCubicOut);
                    barNodes.selectAll(`.bottomline-${scenario}-${severity}`)
                        .transition()
                        .duration(500)
                        .attr("x1", (whiskerMargin + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario)))
                        .attr("y1", yScale(value.tenth))
                        .attr("x2", (barWidth - whiskerMargin + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario)))
                        .attr("y2", yScale(value.tenth))
                        .ease(easeCubicOut);
                });
            });
        }
        setTriggerRender(prev => !prev);
        return () => {};
    }, [ chartRef, scenarios, width, indicator, scenarioMap, quantileObjRef, xScaleRef, yScaleRef, scaleDomainsRef, indicators, scale ]);

    // Formerly drawSummaryIndicators
    let summaryIndicators;
    if (scaleDomainsRef && scaleDomainsRef.current) {
        // Unpack the refs
        const quantileObj = quantileObjRef.current;
        const xScale = xScaleRef.current;
        const yScale = yScaleRef.current;
        // Widths/heights/margins
        const barWidth = ((width / 3) / scenarios.length) - margin.left - margin.right;
        const barMargin = 10;
        const whiskerMargin = barWidth * 0.2;
        const rectWidth = width - margin.left;
        summaryIndicators = (
            <Fragment key={`chart-fragment`}>
                <rect
                    key={`chart-bkgd-rect`}
                    width={rectWidth}
                    height={height - margin.chartTop - margin.bottom + 2}
                    x={margin.left}
                    y={margin.chartTop}
                    fill={colors.chartBkgd}>
                </rect>
                {scenarios.map((scenario, i) => {
                    const severities = scenarioMap[scenario];
                    return (
                        quantileObj[indicator][scenario] && 
                        <g 
                            key={`chart-group-${scenario}`}>
                            {Object.entries(quantileObj[indicator][scenario]).map(([severity, value], j) => {
                                // place scenarios with fewer severities around the center tick mark
                                if (severities.length === 1) {
                                    j = 1
                                } else if (severities.length === 2) {
                                    j +=  ((j + 1) * 0.3333)
                                } else {
                                    // just use j
                                }
                                // case for Infections (incidI) having the same results for low, med and high severities
                                // solution: only display med severity
                                // severity (key) is the severity, value is the object of quantiles calculated
                                if (!(indicator === 'incidI' && (severity === 'high' || severity === 'low'))) {
                                    return (
                                        <Fragment
                                            key={`chart-fragment-${scenario}-${severity}`}>
                                            <rect 
                                                d={value}
                                                key={`bar-${scenario}-${severity}`}
                                                className={`bar-${scenario}-${severity}`}
                                                width={barWidth}
                                                height={yScale(0) - yScale(value.median)}
                                                x={(margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario)}
                                                y={yScale(value.median)}
                                                fill={scenarioColorPalette[i]}
                                                stroke={hoveredRect.severity === severity &&
                                                    hoveredRect.scenario === scenario ? colors.blue: scenarioColorPalette[i]}
                                                strokeWidth={4}
                                                style={{ pointerEvents: 'none' }}>
                                            </rect>
                                            <text 
                                                className='tick'
                                                opacity={0.65}
                                                textAnchor='middle'
                                                x={(margin.left * 2) + (j * ((barWidth) + barMargin)) + xScale(scenario) - 7 + (j*3.5) + (barWidth * 0.5)}
                                                y={height - 22}>
                                                {severity}
                                            </text>
                                            <line
                                                key={`vertline-${scenario}-${severity}`}
                                                className={`vertline-${scenario}-${severity}`}
                                                x1={(barWidth/2 + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario))}
                                                y1={yScale(value.ninetyith)}
                                                x2={(barWidth/2 + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario))}
                                                y2={yScale(value.tenth)}
                                                stroke={colors.gray}
                                                strokeWidth={1}
                                                style={{ pointerEvents: 'none' }}>
                                            </line>
                                            <line
                                                key={`topline-${scenario}-${severity}`}
                                                className={`topline-${scenario}-${severity}`}
                                                x1={(whiskerMargin + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario))}
                                                y1={yScale(value.ninetyith)}
                                                x2={(barWidth - whiskerMargin + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario))}
                                                y2={yScale(value.ninetyith)}
                                                stroke={colors.gray}
                                                strokeWidth={1}
                                                style={{ pointerEvents: 'none' }}>
                                            </line>
                                            <line
                                                key={`bottomline-${scenario}-${severity}`}
                                                className={`bottomline-${scenario}-${severity}`}
                                                x1={(whiskerMargin + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario))}
                                                y1={yScale(value.tenth)}
                                                x2={(barWidth - whiskerMargin + (margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario))}
                                                y2={yScale(value.tenth)}
                                                stroke={colors.gray}
                                                strokeWidth={1}
                                                style={{ pointerEvents: 'none' }}>
                                            </line>
                                            <Tooltip
                                                key={`tooltip-chart-${i}-${j}`}
                                                title={tooltipText}
                                                open={hoveredRect.severity === severity && hoveredRect.scenario === scenario}
                                                data-html="true"
                                                destroyTooltipOnHide={true}>
                                                {/* debug red rect highlight */}
                                                <rect
                                                    d={value}
                                                    key={`bar-${scenario}-${severity}-hover`}
                                                    className={'bars-hover'}
                                                    width={barWidth}
                                                    // height={this.state.yScale(0) - this.state.yScale(value.median)}
                                                    height={yScale(value.median) / (height - margin.bottom) > 0.9 ? 20 : yScale(0) - yScale(value.median)}
                                                    x={(margin.left * 2) + (j * (barWidth + barMargin)) + xScale(scenario)}
                                                    y={yScale(value.median) / (height - margin.bottom) > 0.9 ? height - margin.bottom - 20 : yScale(value.median)}
                                                    fill={'red'}
                                                    fillOpacity={0}
                                                    stroke={'red'}
                                                    strokeOpacity={0}
                                                    strokeWidth={4}
                                                    style={{ cursor: 'pointer' }}
                                                    onMouseEnter={(e) => handleHighlightEnter(e, severity, scenario, i)}
                                                    onMouseLeave={handleHighlightLeave}>
                                                </rect>
                                            </Tooltip>
                                        </Fragment>
                                    );
                                }
                            })}
                        </g>
                    );
                })}
            </Fragment>
        );
    }

    return (
        <div>
            {scaleDomainsRef && scaleDomainsRef.current &&
            <Fragment>
                <svg 
                    width={margin.yAxis}
                    height={height}>
                    <text
                        transform="rotate(-90)"
                        y={0}
                        x={0-(height / 2)}
                        dy="1em"
                        opacity={0.65}
                        textAnchor="middle"
                        style={{ fontSize: '1rem'}}
                        className="titleNarrow">
                        {statLabel}
                    </text>
                    <Axis 
                        ref={chartYAxisRef}
                        width={width}
                        height={height - margin.chartTop - margin.bottom}
                        orientation={'left'}
                        scale={yScaleRef.current}
                        x={margin.yAxis}
                        y={0}
                        tickNum={4} />
                </svg>
                <svg 
                    width={width}
                    height={height}
                    ref={chartRef}>
                    {summaryIndicators}
                    <Axis 
                        ref={chartXAxisRef}
                        view={'chart'}
                        width={width}
                        height={height}
                        orientation={'bottom'}
                        scale={xScaleRef.current}
                        x={0}
                        y={height - margin.bottom + 1}
                        tickNum={scenarios.length}
                        axisVisible={false}/>
                </svg>
            </Fragment>}
        </div>
    );
};

Chart.propTypes = {
    dataset: PropTypes.object.isRequired,
    scenarios: PropTypes.array.isRequired,
    scenarioMap: PropTypes.object.isRequired,
    firstDate: PropTypes.instanceOf(Date).isRequired,
    start: PropTypes.instanceOf(Date).isRequired,
    end: PropTypes.instanceOf(Date).isRequired,
    indicator: PropTypes.string.isRequired,
    statLabel: PropTypes.string.isRequired,
    indicators: PropTypes.array.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    handleCalloutInfo: PropTypes.func.isRequired,
    handleCalloutLeave: PropTypes.func.isRequired,
    handleScenarioHover: PropTypes.func.isRequired,
    scale: PropTypes.string.isRequired,
};

export default Chart;
