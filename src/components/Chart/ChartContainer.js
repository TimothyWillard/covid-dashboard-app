import React, { Fragment, useState, useCallback, useLayoutEffect } from 'react';
import { Row, Col } from 'antd';
import PropTypes from 'prop-types';

import Chart from './Chart';
import CalloutLabel from './CalloutLabel';
import ChartLegend from './ChartLegend';

import { GEOIDS } from '../../utils/geoids.tsx';
import { getReadableDate, formatTitle } from '../../utils/utils';

const ChartContainer = ({
    geoid,
    width,
    height,
    dataset,
    scenarios,
    scenarioMap,
    indicators,
    firstDate,
    start,
    end,
    scale,
    datePickerActive
}) => {
    const [ hoveredScenarioIdx, setHoveredScenarioIdx ] = useState(null);
    const [ calloutStats, setCalloutStats ] = useState({
        statLabel: '',
        median: 0,
        tenth: 0,
        ninetyith: 0,
    });
    const [, setTriggerRender] = useState(false);

    const handleCalloutInfo = useCallback((statLabel, median, tenth, ninetyith) => {
        setCalloutStats({
            statLabel: statLabel.toLowerCase(),
            median: median,
            tenth: tenth,
            ninetyith: ninetyith,
        });
    }, []);

    const handleCalloutLeave = () => {};

    const handleScenarioHighlight = useCallback((scenarioIdx) => {
        if (scenarioIdx !== null) {
            setHoveredScenarioIdx(scenarioIdx);
        } else {
            setHoveredScenarioIdx(null);
        }
    }, []);

    useLayoutEffect(() => {
        setTriggerRender(prev => !prev);
    }, [ indicators ])

    let children = {};
    if (indicators && indicators.length > 0) {
        for (let indicator of indicators) {
            const child = {
                key: `${indicator.key}-chart`,
                chart: (
                    <Chart
                        key={`${indicator.key}-chart`}
                        dataset={dataset}
                        scenarios={scenarios}
                        scenarioMap={scenarioMap}
                        firstDate={firstDate}
                        start={start}
                        end={end}
                        indicator={indicator.key}
                        statLabel={indicator.name}
                        indicators={indicators}
                        width={width}
                        height={height/Object.keys(indicators).length}
                        handleCalloutInfo={handleCalloutInfo}
                        handleCalloutLeave={handleCalloutLeave}
                        handleScenarioHover={handleScenarioHighlight}
                        scale={scale} />
                ),
            }
            children[indicator.key] = child;
        }
    }
    const geoidName = `${GEOIDS[geoid]}`;

    return (
        <Fragment>
            <Row>
                <Col span={24}>
                    <div className="scenario-title titleNarrow">{geoidName}</div>
                    <div className="filter-label threshold-label callout callout-row">
                        {`Snapshot from `}
                        {/*TS migration: Use getClassForActiveState(datePickerActive)*/}
                        <span className={datePickerActive ? 'underline-active' : 'bold underline'}>
                            {getReadableDate(start)}
                        </span>
                        &nbsp;to&nbsp;
                        {/*TS migration: Use getClassForActiveState(datePickerActive)*/}
                        <span className={datePickerActive ? 'underline-active' : 'bold underline'}>
                            {getReadableDate(end)}
                        </span>
                    </div>
                </Col>
            </Row>
            <Row justify="end">
                <div className="widescreen-only">
                    <div className="chart-callout" style={{ display: 'block !important'}}>
                        {hoveredScenarioIdx !== null &&
                            <CalloutLabel
                                classProps={'filter-label callout'}
                                start={start}
                                end={end}
                                scenario={formatTitle(scenarios[hoveredScenarioIdx])}
                                label={calloutStats.statLabel}
                                median={calloutStats.median}
                                tenth={calloutStats.tenth}
                                ninetyith={calloutStats.ninetyith}/>
                        }
                    </div>
                </div>
                <div className="chart-legend-container">
                    <ChartLegend />
                </div>
            </Row>
            <Row>
                {indicators && indicators.length > 0 && indicators.map((indicator) => {
                    return (
                        <div className="row" key={`chart-row-${indicator.key}`}>
                            <div className="chart" key={`chart-${indicator.key}`}>
                                {children[indicator.key].chart}
                            </div>
                        </div>
                    );
                })}
            </Row>
        </Fragment>
    );
};

ChartContainer.propTypes = {
    geoid: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    dataset: PropTypes.object.isRequired,
    scenarios: PropTypes.array.isRequired,
    scenarioMap: PropTypes.object.isRequired,
    indicators: PropTypes.array.isRequired,
    firstDate: PropTypes.instanceOf(Date).isRequired,
    start: PropTypes.instanceOf(Date).isRequired,
    end: PropTypes.instanceOf(Date).isRequired,
    scale: PropTypes.string.isRequired,
    datePickerActive: PropTypes.bool.isRequired,
};

export default ChartContainer;
