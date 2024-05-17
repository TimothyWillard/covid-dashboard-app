import React, { Fragment, useCallback } from 'react';
import { scaleLinear, scaleUtc } from 'd3-scale';
import { max, extent } from 'd3-array';
import PropTypes from 'prop-types';

import { formatTitle } from '../../utils/utils';
import { margin } from '../../utils/constants';
import { GEOIDS } from '../../utils/geoids.tsx';

import Graph from './Graph';
import Axis from './Axis';
import ThresholdLabel from './ThresholdLabel';

const getScales = (seriesList, selectedDates, width, height) => {
    // calculate scale domains
    const timeDomain = extent(selectedDates);
    let scaleMaxVal = 0;
    for (let i = 0; i < seriesList.length; i++) {
        const seriesMaxVal = max(seriesList[i], sims => max(sims.vals));
        if (seriesMaxVal > scaleMaxVal) 
            scaleMaxVal = seriesMaxVal;
    }
    // set scale ranges to width and height of container
    const xScale = scaleUtc()
        .range([margin.left, width - margin.right])
        .domain(timeDomain);
    const yScale = scaleLinear()
        .range([height - margin.bottom, margin.top])
        .domain([0, scaleMaxVal])
        .nice();
    return { xScale, yScale };
}

const GraphContainer = ({ geoid, width, height, selectedDates, scenarioList, seriesList, indicator, severity, animateTransition, showConfBounds, confBoundsList, actualList, showActual, indicatorThreshold, dateThreshold, runDate, percExceedenceList, brushActive, scenarioClickCounter, scenarioHovered, statSliderActive, dateSliderActive, seriesMax }) => {
    // const [ children, setChildren ] = useState([]);

    const updateGraphs = useCallback((graphWidth, graphHeight, scales) => {
        const children = [];
        if (scenarioList && scenarioList.length > 0) {
            for (let i = 0; i < scenarioList.length; ++i) {
                const showLegend = scenarioList.length === 1 || (scenarioList.length > 1 && i === 1);
                const key = `${scenarioList[i].key}_Graph_${scenarioClickCounter}`;
                const child = {
                    key: key,
                    graph: [],
                }
                child.graph.push(
                    <Graph
                        key={key}
                        keyVal={key}
                        indicator={indicator}
                        geoid={geoid}
                        scenario={scenarioList[i]}
                        severity={severity}
                        animateTransition={animateTransition}
                        showConfBounds={showConfBounds}
                        confBounds={confBoundsList[i]}
                        showActual={showActual}
                        actual={actualList[i]}
                        series={seriesList[i]}
                        selectedDates={selectedDates}
                        indicatorThreshold={indicatorThreshold}
                        dateThreshold={dateThreshold}
                        runDate={runDate}
                        brushActive={brushActive}
                        width={graphWidth}
                        height={graphHeight}
                        showLegend={showLegend}
                        x={0}
                        y={0}
                        xScale={scales.xScale}
                        yScale={scales.yScale}/>
                );
                children.push(child);
            }
        }
        return children;
    }, [ scenarioList, scenarioClickCounter, indicator, geoid, severity, animateTransition, showConfBounds, confBoundsList, showActual, actualList, seriesList, selectedDates, indicatorThreshold, dateThreshold, runDate, brushActive ]);

    let graphWidth = 0;
    let scales;
    if (seriesList && seriesList.length > 0) {
        graphWidth = scenarioList.length == 2 ? width/2 : width;
        scales = getScales(seriesList, selectedDates, width, height);
    }

    const geoidName = `${GEOIDS[geoid]}`;
    const dimensions = { 
        width: margin.yAxis + margin.left, 
        height: 40,
    };

    const children = updateGraphs(graphWidth, height, scales);

    return (
        <div className="graph-wrapper">
            <div className="y-axis-label titleNarrow graph-yLabel">
                {`Daily ${indicator.name}`}
            </div>
            <div className="graph-title-row">

            <div style={dimensions}></div>
            {scenarioList.map((scenario) => {
                const scenarioTitle = formatTitle(scenario.name);
                const isActive = scenario.name === scenarioHovered ? ' title-active' : '';
                return (scenarioList && scenarioList.length > 1) ?
                        <div key={scenario.key} style={{ width: width - margin.right}}>
                            <div className={"scenario-title titleNarrow"}>{geoidName}</div>
                            <div className={"scenario-title" + isActive}>{scenarioTitle}</div>
                        </div>
                        :
                        <div key={scenario.key} style={{ width: width - margin.right}}>
                            <div className="scenario-title titleNarrow">{geoidName}</div>
                            <div className="scenario-title">{scenarioTitle}</div>
                        </div>
            } )}
        </div>
            <div className="graph-title-row callout-row">
            <div style={dimensions}></div>
                {children.map((child, i) => {
                    return (
                        scenarioList &&
                        <ThresholdLabel
                            key={`${child.key}-label`}
                            classProps={'filter-label threshold-label callout'}
                            indicatorThreshold={indicatorThreshold}
                            seriesMax={seriesMax}
                            dateThreshold={dateThreshold}
                            percExceedence={percExceedenceList[i]}
                            label={indicator.name.toLowerCase()}
                            statSliderActive={statSliderActive}
                            dateSliderActive={dateSliderActive} />
                    );
                })}
            </div>
            <div className="graph-container">
                {scales &&
                <Fragment>
                    <svg
                        width={margin.yAxis}
                        height={height}
                    >
                    <Axis
                        width={graphWidth}
                        height={height}
                        orientation={'left'}
                        scale={scales.yScale}
                        x={margin.yAxis}
                        y={0}
                    />
                    </svg>
                    {children.map(child => {
                        return (
                            <svg
                                key={`graphSVG_${child.key}`}
                                width={graphWidth}
                                height={height}
                                className={`graphSVG_${child.key}`}
                            >
                            <g key={`${child.key}-graph`}>
                                {child.graph}
                            </g>
                            </svg>
                        )
                    })}
                </Fragment>}
            </div>
        </div>
    );
}

GraphContainer.propTypes = {
    geoid: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    selectedDates: PropTypes.array.isRequired,
    scenarioList: PropTypes.array.isRequired,
    seriesList: PropTypes.array.isRequired,
    indicator: PropTypes.object.isRequired,
    severity: PropTypes.string.isRequired,
    r0full: PropTypes.array.isRequired,
    r0selected: PropTypes.array.isRequired,
    animateTransition: PropTypes.bool.isRequired,
    showConfBounds: PropTypes.bool.isRequired,
    confBoundsList: PropTypes.array.isRequired,
    actualList: PropTypes.array.isRequired,
    showActual: PropTypes.bool.isRequired,
    indicatorThreshold: PropTypes.number.isRequired,
    dateThreshold: PropTypes.instanceOf(Date).isRequired,
    runDate: PropTypes.instanceOf(Date).isRequired,
    percExceedenceList: PropTypes.array.isRequired,
    brushActive: PropTypes.bool.isRequired,
    scenarioClickCounter: PropTypes.number.isRequired,
    scenarioHovered: PropTypes.string.isRequired,
    statSliderActive: PropTypes.bool.isRequired,
    dateSliderActive: PropTypes.bool, // I think the isRequired attr can come back after MainGraph refactor
    seriesMax: PropTypes.number.isRequired,
};

export default GraphContainer;
