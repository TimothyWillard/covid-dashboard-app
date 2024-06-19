import React, { useLayoutEffect, useCallback, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Layout, Row, Col, Spin, Alert } from 'antd';
const { Content } = Layout;
import { PlusCircleTwoTone } from '@ant-design/icons';
import _ from 'lodash';
import GraphContainer from './GraphContainer';
import Brush from '../Filters/Brush';
import Scenarios from '../Filters/Scenarios';
import Indicators from '../Filters/Indicators';
import SeverityContainer from '../Filters/SeverityContainer'
import ActualSwitch from '../Filters/ActualSwitch';
import R0 from '../Filters/R0';
import ModeToggle from '../Filters/ModeToggle';
import Sliders from '../Filters/Sliders';
import ViewModal from '../ViewModal.js';

import { buildScenarios, buildScenarioMap, buildSeverities, getR0range, 
    getConfBounds, getActuals, filterR0 } from '../../utils/utils';
import { getindicatorThreshold, getDateThreshold, flagSimsOverThreshold, 
    getExceedences, flagSims, filterByDate } from '../../utils/threshold';
import { styles, margin, dimMultipliers, numDisplaySims, LEVELS } from '../../utils/constants';
import { utcParse, utcFormat } from 'd3-time-format';
import { timeDay } from 'd3-time';

const parseDate = utcParse('%Y-%m-%d');
const formatDate = utcFormat('%Y-%m-%d');

const MainGraph = ({
    geoid,
    dataset,
    indicators,
    actuals,
    width,
    height,
    fetchErrors,
}) => {
    const [dataLoaded, setDataLoaded] = useState(false);
    const [seriesList, setSeriesList] = useState([]);
    const [allDatesSeries, setAllDatesSeries] = useState({});
    const [selectedDates, setSelectedDates] = useState([]);
    const [dates, setDates] = useState([]);
    const [dateRange, setDateRange] = useState([]);
    const [indicator, setIndicator] = useState({});
    const [SCENARIOS, setSCENARIOS] = useState([]);
    const [scenarioList, setScenarioList] = useState([]);
    const [scenarioMap, setScenarioMap] = useState({});
    const [severity, setSeverity] = useState(_.cloneDeep(LEVELS[0]));
    const [severityList, setSeverityList] = useState([_.cloneDeep(LEVELS[0])]);
    const [scenarioHovered, setScenarioHovered] = useState('');
    const [indicatorThreshold, setIndicatorThreshold] = useState(0);
    const [dateThreshold, setDateThreshold] = useState(null); // TODO: `null` isn't quite the right value here
    const [runDate, setRunDate] = useState(null);             // TODO: `null` isn't quite the right value here
    const [statSliderActive, setStatSliderActive] = useState(false);
    const [dateSliderActive, setDateSliderActive] = useState(false);
    const [seriesMax, setSeriesMax] = useState(Number.NEGATIVE_INFINITY);
    const [showActual, setShowActual] = useState(false);
    const [actualList, setActualList] = useState([]);
    const [r0full, setR0full] = useState([0, 4]);
    const [r0selected, setR0selected] = useState([0, 4]);
    const [resampleClicks, setResampleClicks] = useState(0);
    const [seriesListForBrush, setSeriesListForBrush] = useState([]);
    const [percExceedenceList, setPercExceedenceList] = useState([]);
    const [showConfBounds, setShowConfBounds] = useState(true);
    const [confBoundsList, setConfBoundsList] = useState([]);
    const [brushActive, setBrushActive] = useState(false);
    const [animateTransition, setAnimateTransition] = useState(true);
    const [scenarioClickCounter, setScenarioClickCounter] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [firstModalVisit, setFirstModalVisit] = useState(true);
    const [allSims, setAllSims] = useState([]);

    const scrollElem = useRef(null);

    const update = useCallback((seriesList, scenarioList, indicator, severityList, dateRange) => {
        // update() triggered on Scenario, Indicator, Severity, R0, Brush change
        const idxMin = timeDay.count(dates[0], dateRange[0]);
        const idxMax = timeDay.count(dates[0], dateRange[1]);

        const newSelectedDates = Array.from(dates).slice(idxMin, idxMax);
        const reducedSeriesList = seriesList.map(series => series.slice(0, numDisplaySims));

        const dateThreshold = getDateThreshold(dates, idxMin, idxMax);
        const [indicatorThreshold, , seriesMax] = getindicatorThreshold(scenarioList, reducedSeriesList, idxMin, idxMax);

        const [flaggedSeriesList, simsOverList] = flagSimsOverThreshold(scenarioList, reducedSeriesList, newSelectedDates, idxMin, idxMax, indicatorThreshold, dateThreshold);

        const percExceedenceList = getExceedences(scenarioList, reducedSeriesList, simsOverList);

        const confBoundsList = getConfBounds(dataset, scenarioList, severityList, indicator, dates, idxMin, idxMax);
        const actualList = getActuals(actuals, indicator, scenarioList);

        setSeriesList(flaggedSeriesList);
        setAllDatesSeries(seriesList[0]);
        setSelectedDates(newSelectedDates);
        setIndicatorThreshold(indicatorThreshold);
        setDateThreshold(dateThreshold);
        setSeriesMax(seriesMax);
        setPercExceedenceList(percExceedenceList);
        setConfBoundsList(confBoundsList);
        setActualList(actualList);
    }, [ dataset, actuals, dates ]);

    const initialize = useCallback((dataset) => {
        // initialize() trigged on mount and Dataset change
        if (Object.keys(dataset).length > 0 && 
            Object.keys(indicators).length > 0) {
            // SCENARIOS: various scenario variables used for a given geoid
            const SCENARIOS = buildScenarios(dataset);  
            const scenarioMap = buildScenarioMap(dataset);
            const firstScenario = SCENARIOS[0];
            const firstIndicator = indicators[0];
            const firstSeverity = scenarioMap[firstScenario.key][0];
            // '2020-07-19-21-44-47-inference'
            const dateString = firstScenario.key.substring(0, 10);
            let dateThreshold = parseDate(dateString);
            if (!dateThreshold) {
                dateThreshold = parseDate(dataset[firstScenario.key].dates[0]);
            }

            // firstSeverity need to be designated in case not all death rate LEVELS exist
            const dates = dataset[firstScenario.key].dates.map( d => parseDate(d));
            const series = dataset[firstScenario.key][firstSeverity][firstIndicator.key].slice(0, numDisplaySims);
            const severityList = buildSeverities(scenarioMap, [], firstScenario.key);
            const sevList = _.cloneDeep(severityList);
            sevList[0].scenario = firstScenario.key;

            // allSims used for R0 histogram
            const allSims = dataset[firstScenario.key][firstSeverity][firstIndicator.key];

            // set dateRange to a default based on equal padding around date of scenario run
            const currIdx = dates.findIndex(date => formatDate(date) === formatDate(dateThreshold));
            const datePadding = dates.length - currIdx;
            const startIdx = dates.length - 1 - (datePadding * 2);
            
            // have a multiple of ten pad each side of the dateRange - alternative way
            // const numDates = dates.length
            // const dateMargin =  Math.ceil(Math.ceil(numDates / 10) / 10) * 10
            const dateRange = [dates[startIdx], dates[dates.length - 1]];

            // initialize Threshold and slider ranges
            const idxMin = timeDay.count(dates[0], dateRange[0]);
            const idxMax = timeDay.count(dates[0], dateRange[1]);
            const [indicatorThreshold, , seriesMax] = getindicatorThreshold([firstScenario], [series], idxMin, idxMax);
            
            // flagSims uses filtered dates and series so that threshold slider
            // shows over/under based on selected date range
            const newSelectedDates = Array.from(dates).slice(idxMin, idxMax);
            const filteredSeries = filterByDate(series, idxMin, idxMax);
            const simsOver = flagSims(filteredSeries, indicatorThreshold, newSelectedDates, dateThreshold);       
            
            const confBoundsList = getConfBounds(dataset, [firstScenario], severityList, firstIndicator, dates, idxMin, idxMax);

            let actualList = [];
            if (Object.keys(actuals).length > 0) {
                actualList = getActuals(actuals, firstIndicator, [firstScenario]);
            } else {
                console.log('Graph Warning: Actuals is empty');
            }

            const r0full = getR0range(dataset, firstScenario, sevList[0], firstIndicator);
            // seriesListForBrush used by handleBrush to initialize instead of R0 filtering 
            // series is updated and set to state in scenario, sev, indicator, r0 change handlers
            const seriesListForBrush = filterR0(r0full, [firstScenario], sevList, firstIndicator, dataset, numDisplaySims);
            
            setSCENARIOS(SCENARIOS);
            setScenarioList([firstScenario]);
            setScenarioMap(scenarioMap);
            setIndicator(indicators[0]);
            setSelectedDates(newSelectedDates);
            setDateRange(dateRange);
            setDateThreshold(dateThreshold);
            setRunDate(dateThreshold);
            setDates(Array.from(dates));
            setAllDatesSeries(Array.from(series));
            setAllSims(allSims);
            setSeriesList([filteredSeries]);
            setSeverityList(sevList);
            setSeverity(firstSeverity);
            setSeriesMax(seriesMax);
            setIndicatorThreshold(indicatorThreshold);
            setPercExceedenceList([simsOver / series.length]);
            setConfBoundsList(confBoundsList);
            setShowConfBounds(true);
            setActualList(actualList);
            setShowActual(false);
            setR0full(r0full);
            setR0selected(r0selected);
            setSeriesListForBrush(seriesListForBrush);
            setDataLoaded(true);
        } else {
            if (Object.keys(dataset).length === 0) console.log('Graph Error: Dataset is empty');
            if (Object.keys(actuals).length === 0) console.log('Graph Error: Actuals is empty');
            if (Object.keys(indicators).length === 0) console.log('Graph Error: Indicators is empty');
        }
    }, [ indicators, actuals, r0selected ]);

    const handleIndicatorClick = useCallback((indicator) => {
        const seriesList = filterR0(r0selected, scenarioList, severityList, indicator, dataset, numDisplaySims);
        setIndicator(indicator);
        setSeriesListForBrush(seriesList);
        setAnimateTransition(true);
        update(seriesList, scenarioList, indicator, severityList, dateRange);
    }, [ dataset, scenarioList, severityList, r0selected, dateRange, update ]);

    const handleScenarioClickGraph = useCallback((scenarios) => {
        const scenarioClkCntr = scenarioClickCounter + 1;
        let scenarioList = [];
        let severityList = [];

        // associate each severity with a scenario to enable hover over severity label
        for (let scenObj of scenarios) {
            const scenario = SCENARIOS.filter(s => s.key === scenObj)[0];
            scenarioList.push(scenario);
            severityList = buildSeverities(scenarioMap, severityList, scenObj);
        }

        const seriesList = filterR0(r0selected, scenarioList, severityList, indicator, dataset, numDisplaySims);
        
        setScenarioList(scenarioList);
        setScenarioClickCounter(scenarioClkCntr);
        setSeverityList(severityList);
        setSeriesListForBrush(seriesList);
        setAnimateTransition(true);
        update(seriesList, scenarioList, indicator, severityList, dateRange); 
    }, [ dataset, indicator, r0selected, dateRange, scenarioMap, scenarioClickCounter, SCENARIOS, update ]);

    const handleSeveritiesClick = useCallback((i) => {
        let severityListClone = _.cloneDeep(severityList);
        severityListClone.forEach(sev => {
            if (sev.scenario === i.scenario) {
                return sev.key = i.key;
            }
        })
        const seriesList = filterR0(r0selected, scenarioList, severityListClone, indicator, dataset, numDisplaySims);
        setSeverityList(severityListClone);
        setSeriesListForBrush(seriesList);
        setAnimateTransition(true);
        update(seriesList, scenarioList, indicator, severityListClone, dateRange); 
    }, [ dataset, scenarioList, indicator, r0selected, dateRange, severityList, update ]);

    const handleSeveritiesHover = (i) => {
        setScenarioHovered(i);
    };

    const handleSeveritiesHoverLeave = () => {
        setScenarioHovered('');
    }

    const handleR0Change = useCallback((r0selected) => {
        const seriesList = filterR0(r0selected, scenarioList, severityList, indicator, dataset, numDisplaySims);
        setR0selected(r0selected);
        setResampleClicks(0);
        setSeriesListForBrush(seriesList);
        setAnimateTransition(true);
        update(seriesList, scenarioList, indicator, severityList, dateRange);     
    }, [ dataset, scenarioList, severityList, indicator, dateRange, update ]);

    const handleR0Resample = useCallback(() => {
        const seriesList = filterR0(r0selected, scenarioList, severityList, indicator, dataset, numDisplaySims, resampleClicks);
        setR0selected(r0selected);
        setResampleClicks(resampleClicks+1);
        setSeriesListForBrush(seriesList);
        setAnimateTransition(true);
        update(seriesList, scenarioList, indicator, severityList, dateRange);     
    }, [ dataset, scenarioList, severityList, indicator, r0selected, resampleClicks, dateRange, update ]);

    const handleActualChange = useCallback(() => {
        setShowActual(!showActual);
    }, [ showActual ]);

    const handleStatSliderChange = useCallback((thresh) => {
        const seriesListLocal = Array.from(seriesList);
        const allDatesSeriesLocal = Array.from(allDatesSeries);
        // flag Sims for Brush
        flagSims(allDatesSeriesLocal, thresh, dates, dateThreshold);
        const percExceedenceList = [];
        // flag Sims for seriesList
        for (let i = 0; i < seriesListLocal.length; i++) {
            const simsOver = flagSims(seriesListLocal[i], thresh, selectedDates, dateThreshold);
            const percExceedence = simsOver / seriesListLocal[i].length;
            percExceedenceList.push(percExceedence);
        }
        setIndicatorThreshold(+thresh);
        setPercExceedenceList(percExceedenceList);
        setAnimateTransition(false);
    }, [ seriesList, allDatesSeries, selectedDates, dateThreshold, dates ]);

    const handleDateSliderChange = useCallback((thresh) => {
        const seriesListLocal = Array.from(seriesList);
        const allDatesSeriesLocal = Array.from(allDatesSeries);
        // flag Sims for Brush
        flagSims(allDatesSeriesLocal, indicatorThreshold, dates, thresh);
        const percExceedenceList = [];
        // flag Sims for seriesList
        for (let i = 0; i < seriesListLocal.length; i++) {
            const simsOver = flagSims(seriesListLocal[i], indicatorThreshold, selectedDates, thresh);
            const percExceedence = simsOver / seriesListLocal[i].length;
            percExceedenceList.push(percExceedence);
        }
        setDateThreshold(thresh);
        setPercExceedenceList(percExceedenceList);
        setAnimateTransition(false);
    }, [ seriesList, allDatesSeries, selectedDates, indicatorThreshold, dates ]);

    const handleBrushRange = useCallback((dateRange) => {
        setDateRange(dateRange);
        setAnimateTransition(false);
        update(seriesListForBrush, scenarioList, indicator, severityList, dateRange);
    }, [ update, seriesListForBrush, scenarioList, indicator, severityList ]);

    const handleBrushStart = () => { 
        setBrushActive(true);
        setAnimateTransition(false);
    };

    const handleConfClick = useCallback(() => {
        const idxMin = timeDay.count(dates[0], dateRange[0]);
        const idxMax = timeDay.count(dates[0], dateRange[1]);

        const confBoundsList = getConfBounds(dataset, scenarioList, severityList, indicator, dates, idxMin, idxMax);

        setConfBoundsList(confBoundsList);
        setAnimateTransition(false);
        setShowConfBounds(!showConfBounds);
    }, [ dataset, scenarioList, severityList, indicator, dates, dateRange, showConfBounds ]);

    const handleBrushEnd = () => { 
        setBrushActive(false);
        setAnimateTransition(false);
    };

    const handleSliderMouseEvent = (type, slider, view) => {
        if (view === 'graph') {
            if (slider === 'indicator') {
                if (type === 'mousedown') {
                    setStatSliderActive(true);
                } else {
                    setStatSliderActive(false);
                }
            } else {
                if (type === 'mousedown') {
                    setDateSliderActive(true);
                } else {
                    setDateSliderActive(false);
                }
            }
        } 
    };

    const handleModalCancel = () => {
        setModalVisible(false);
        setFirstModalVisit(false);
    }

    const showModal = () => {
        setModalVisible(false);
    };

    const handleScroll = useCallback(() => {        
        if (scrollElem.current && firstModalVisit && 
            (document.body.scrollTop > scrollElem.current.offsetTop - 60 && 
                document.body.scrollTop < scrollElem.current.offsetTop)) {
            setModalVisible(true);
        }
    }, [ scrollElem, firstModalVisit ]);

    
    useEffect(() => {
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
        }
    }, [ handleScroll ]);

    useLayoutEffect(() => {
        initialize(dataset);
        return () => {};
    }, [ initialize, dataset ]);

    const datasetLen = Object.keys(dataset).length;
    const dimensions = { 
        width: margin.yAxis + margin.left, 
        height: 40
    };

    return (
        <div ref={scrollElem}>
            <Content id="interactive-graph" style={styles.ContainerGray} > 
                {/* Loaded Graph, dataset has been fetched successfully */}
                {dataLoaded && datasetLen > 0 &&
                <Row gutter={styles.gutter}>
                    <Col className="gutter-row container">
                        <div className="graph-title-row">
                            <div style={dimensions}></div>
                            <div className="section-title">Simulations Graph</div>
                        </div>
                        <ViewModal 
                            modalTitle="Interpreting the daily projections graph"
                            modalVisible={modalVisible}
                            onCancel={handleModalCancel}
                            modalContainer="#interactive-graph"
                            modalText={
                                <div>
                                    <p>This graph shows a sample of the daily model projections for an indicator 
                                    (e.g., confirmed cases, hospitalizations, deaths) 
                                    over time for a given modeled scenario. 
                                    Each line represents a single stochastic model simulation, 
                                    and all simulation curves are equally likely to occur. 
                                    Note that not all simulation curves are displayed at once, 
                                    for visualization purposes.</p>
                                    <p>Use the control panel on the right side to:</p>
                                    <ul>
                                        <li>Choose one or more scenarios to compare (e.g., model forecasts made on two different dates)</li> 
                                        <li>Change the displayed indicator (e.g., confirmed cases)</li>
                                        <li>Compare scenarios with different severity assumptions (e.g., high infection fatality ratio)</li>
                                        <li>Filter simulations within a specific range of the baseline reproduction number </li>
                                        <li>Toggle the display of reported ground truth data, when available</li>
                                    </ul>
                                    <p>Drag, lengthen, or shorten the grey area in the miniature simulation 
                                    image below the main display graph in order to capture the time period of interest.</p>
                                    <p>Typically, we interpret all of the simulation outputs from a single model run collectively and probabilistically. 
                                    This dashboard presents this summarized information with two modes. In “Confidence Bounds” mode, 
                                    you can see a time-averaged median line and 10-90% prediction interval ribbon overlaid 
                                    on top of the individual simulations. 
                                    In “Threshold Exceedance” mode, you can use the Threshold and Date Threshold sliders 
                                    to change values and dates to determine how likely a given indicator 
                                    will exceed a certain threshold number by a given threshold date.</p>
                                    <div className="mobile-alert">
                                        &#9888; Please use a desktop to access the full feature set.
                                    </div>
                                </div>
                            }
                        />
                        <GraphContainer 
                            geoid={geoid}
                            width={width}
                            height={height}
                            selectedDates={selectedDates}
                            scenarioList={scenarioList}
                            seriesList={seriesList}
                            indicator={indicator}
                            severity={severity}
                            r0full={r0full}
                            r0selected={r0selected}
                            animateTransition={animateTransition}
                            showConfBounds={showConfBounds}
                            confBoundsList={confBoundsList}
                            actualList={actualList}
                            showActual={showActual}
                            indicatorThreshold={indicatorThreshold}
                            dateThreshold={dateThreshold}
                            runDate={runDate}
                            percExceedenceList={percExceedenceList}
                            dateRange={dateRange}
                            brushActive={brushActive}
                            scenarioClickCounter={scenarioClickCounter}
                            scenarioHovered={scenarioHovered}
                            statSliderActive={statSliderActive}
                            dateSliderActive={dateSliderActive}
                            seriesMax={seriesMax}
                        /> 
                        <Brush
                            width={width}
                            height={80}
                            series={allDatesSeries}
                            dates={dates}
                            x={margin.yAxis + (width * dimMultipliers.brushOffset)}
                            y={0}
                            animateTransition={animateTransition}
                            // toggleAnimateTransition={this.toggleAnimateTransition}
                            dateRange={dateRange}
                            dateThreshold={dateThreshold}
                            indicatorThreshold={indicatorThreshold}
                            showConfBounds={showConfBounds}
                            onBrushChange={handleBrushRange}
                            onBrushStart={handleBrushStart}
                            onBrushEnd={handleBrushEnd}
                        />
                    </Col>

                    <Col className="gutter-row container mobile-only">
                        <div className="mobile-alert">
                            &#9888; The filters below are disabled on mobile devices.
                        </div>
                    </Col>

                    <Col className="gutter-row graph-filters mobile">
                        <div className="instructions-wrapper" onClick={showModal}>
                            <div className="param-header instructions-label">
                                INSTRUCTIONS
                            </div>
                            <div className="instructions-icon">
                                <PlusCircleTwoTone />
                            </div>
                        </div>
                        <Scenarios
                            view="graph"
                            SCENARIOS={SCENARIOS}
                            scenario={SCENARIOS[0]}
                            scenarioList={scenarioList}
                            onScenarioClick={handleScenarioClickGraph} />
                        <Indicators
                            indicator={indicator}  // TODO: remove this
                            indicators={indicators}
                            onIndicatorClick={handleIndicatorClick} />        
                        <SeverityContainer
                            indicator={indicator}
                            severityList={severityList}
                            scenarioList={scenarioList} 
                            scenarioMap={scenarioMap}
                            onSeveritiesClick={handleSeveritiesClick}
                            onSeveritiesHover={handleSeveritiesHover}
                            onSeveritiesHoverLeave={handleSeveritiesHoverLeave} />
                        <R0
                            r0full={r0full}
                            r0selected={r0selected}
                            onR0Change={handleR0Change}
                            onR0Resample={handleR0Resample}
                            allSims={allSims} 
                            selectedSims={seriesList[0]} />
                        <ActualSwitch
                            onChange={handleActualChange}
                            showActual={showActual}
                            actualList={actualList} />
                        <ModeToggle
                            showConfBounds={showConfBounds}
                            onConfClick={handleConfClick} /> 
                        <Sliders 
                            indicator={indicator}
                            selectedDates={selectedDates}
                            seriesMax={seriesMax}
                            showConfBounds={showConfBounds}
                            indicatorThreshold={indicatorThreshold}
                            dateThreshold={dateThreshold}
                            // dateThresholdIdx={dateThresholdIdx}
                            dateRange={dateRange}
                            onStatSliderChange={handleStatSliderChange}
                            onDateSliderChange={handleDateSliderChange}
                            onSliderMouseEvent={handleSliderMouseEvent} />
                    </Col>
                </Row>}
                {/* Loaded Graph,but dataset is undefined */}
                {datasetLen === 0 && 
                <div className="error-container">
                    <Spin spinning={false}>
                        <Alert
                        message="Data Unavailable"
                        description={
                            <div>
                                Simulation data for county {geoid} is
                                unavailable or in an unexpected format. <br />
                                Please select a different county or state. <br />
                                Contact the IDD Working Group to run data files through the validator script. <br />
                                {fetchErrors}
                            </div>
                        }
                        type="info" />
                    </Spin>
                </div>}
            </Content>
        </div>
    )
};

MainGraph.propTypes = {
    geoid: PropTypes.string.isRequired,
    dataset: PropTypes.object.isRequired,
    indicators: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]).isRequired,
    actuals: PropTypes.object.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    fetchErrors: PropTypes.string.isRequired,
};

export default MainGraph;
