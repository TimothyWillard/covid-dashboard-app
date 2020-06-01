import React, { Component, Fragment } from 'react';
import { Layout, Row, Col } from 'antd';
import _ from 'lodash';

import Search from './Search/Search'
import MainGraph from './Graph/MainGraph';
import MainChart from './Chart/MainChart';
// import GraphContainer from './Graph/GraphContainer';
import ChartContainer from './Chart/ChartContainer';
import MapContainer from './Map/MapContainer';
import Methodology from './Methodology';

// import Brush from './Filters/Brush';
// import GraphFilter from './Graph/GraphFilter';
import Scenarios from './Filters/Scenarios';
import IndicatorSelection from './Chart/IndicatorSelection';
import DatePicker from './Chart/DatePicker';
import ScaleToggle from './Chart/ScaleToggle';
import DateSlider from './Map/DateSlider';

import { buildScenarios, getRange } from '../utils/utils'
import { utcParse, timeFormat } from 'd3-time-format'
import { timeDay } from 'd3-time'
import { maxIndex } from 'd3-array';
import { STATS, LEVELS, COUNTYNAMES, margin } from '../utils/constants';

const dataset = require('../store/geo06085.json');
const geojsonStats = require('../store/statsForMap.json')

const parseDate = utcParse('%Y-%m-%d')
const formatDate = timeFormat('%Y-%m-%d')

class MainContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dataset: {},
            dataLoaded: false,
            series: {},
            seriesList: [{}],
            allTimeSeries: {},
            dates: [],
            allTimeDates: [],
            yAxisLabel: '',
            stat: STATS[0],
            geoid: '06085', 
            SCENARIOS: [],
            scenario: {},
            scenarioList: [],           
            scenarioListChart: [],
            scenarioMap: '',         
            severity: _.cloneDeep(LEVELS[0]), 
            severityList: [_.cloneDeep(LEVELS[0])],
            scenarioHovered: '',
            statThreshold: 0,
            statSliderActive: false,
            statListChart: [],
            seriesMax: Number.NEGATIVE_INFINITY,
            seriesMin: Number.POSITIVE_INFINITY,
            dateThreshold: new Date(),
            dateSliderActive: false,
            dateSliderActiveMap: false,
            datePickerActiveChart: false,
            dateRange: [parseDate('2020-03-01'), parseDate('2020-09-01')],
            firstDate: '',
            lastDate: '',
            r0: [0, 4],
            simNum: '150',
            percExceedenceList: [],
            showConfBounds: false,
            confBounds: {},
            confBoundsList: [{}],
            showActual: false,
            summaryStart: new Date(),
            summaryEnd: new Date(),
            countyBoundaries: { "type": "FeatureCollection", "features": []},
            statsForCounty: {},
            graphW: 0,
            graphH: 0,
            mapContainerW: 0,
            mapContainerH: 0,
            brushActive: false,
            animateTransition: true,
            scenarioClickCounter: 0,
            summaryScale: 'power',
            mapCurrentDateIndex: 0
        };
    };

    componentDidMount() {
        // console.log('componentDidMount')
        console.log('dataset', dataset)
        
        window.addEventListener('resize', this.updateGraphDimensions)
        window.addEventListener('resize', this.updateMapContainerDimensions)
        this.updateGraphDimensions()
        this.updateMapContainerDimensions()
        
        const [SCENARIOS, scenario, scenarioList, scenarioListChart, scenarioMap] =
            this.instantiateScenarios(dataset);

        // add default stats to chart
        const statListChart = STATS.slice(0,2)

        // instantiate initial series and dates
        const { severity, stat } = this.state;
        const series = dataset[scenario.key][severity.key][stat.key].sims;
         
        const dates = dataset[scenario.key].dates.map( d => parseDate(d));
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        
        const seriesPeaks = series.map(sim => sim.max);
        const [seriesMin, seriesMax] = getRange(series, seriesPeaks);
        const statThreshold = Math.ceil((seriesMax / 1.4) / 100) * 100;

        // iterate through SeriesList
        const simsOver = this.updateThresholdIterate(
            series,
            statThreshold,
            dates,
            this.state.dateThreshold
            )        
        const percExceedence = simsOver / series.length;

        // send these sims to brush after it's been colored
        // include in SeriesList loop
        // if (firstIndex of SeriesList)
        const allTimeSeries = Array.from(series)
        // shouldn't happen twice
        const allTimeDates = Array.from(dates)

        // take out of loop so not redundant
        const idxMin = timeDay.count(firstDate, this.state.dateRange[0]);
        const idxMax = timeDay.count(firstDate, this.state.dateRange[1]);
        const newDates = Array.from(allTimeDates.slice(idxMin, idxMax));
        const filteredSeries = series.map( s => {
            const newS = {...s}
            newS.vals = s.vals.slice(idxMin, idxMax)
            return newS
        })
        
        const yAxisLabel = `Daily ${stat.name}`;
        const percExceedenceList = [percExceedence]

        // instantiate confidence bounds
        const confBounds = dataset[scenario.key][severity.key][stat.key].conf;
        const filteredConfBounds = confBounds.slice(idxMin, idxMax)

        // instantiate start and end date (past 2 weeks) for summary stats
        const summaryStart = new Date();
        summaryStart.setDate(summaryStart.getDate() - 14); 

        // add scenario to severity list
        const sevList = _.cloneDeep(this.state.severityList);
        sevList[0].scenario = scenario.key;

        // instantiates countyBoundaries
        const state = this.state.geoid.slice(0, 2);
        const countyBoundaries = require('../store/countyBoundaries.json')[state];
        console.log('countyBoundaries in Main', countyBoundaries)
        const statsForCounty = geojsonStats[state];
        const mapCurrentDateIndex = allTimeDates.findIndex( date => formatDate(date) === formatDate(new Date()));

        this.setState({
            dataset,
            SCENARIOS,
            scenario,
            scenarioMap,
            scenarioList,
            scenarioListChart,
            statListChart,
            dates: newDates,
            allTimeDates,
            seriesList: [filteredSeries],
            severityList: sevList,
            allTimeSeries,
            seriesMax,
            seriesMin,
            statThreshold,
            yAxisLabel,
            firstDate,
            lastDate,
            percExceedenceList,
            confBoundsList: [filteredConfBounds],
            countyBoundaries,
            statsForCounty,
            summaryStart,
            mapCurrentDateIndex
            // graphW,
            // graphH
        }, () => {
            this.setState({
                dataLoaded: true
            });
        })
    };

    componentDidUpdate(prevProp, prevState) {
        if (this.state.stat !== prevState.stat ||
            this.state.scenarioList !== prevState.scenarioList ||
            this.state.severityList !== prevState.severityList ||
            this.state.dateRange !== prevState.dateRange ||
            this.state.r0 !== prevState.r0 ||
            this.state.dataset !== prevState.dataset) {

            const filteredSeriesList = []
            const percExceedenceList = []
            const confBoundsList = [];
            let brushSeries
            
            const { dataset, stat, severityList, scenarioList, r0 } = this.state;
            // filter series and dates by dateRange
            const idxMin = timeDay.count(this.state.firstDate, this.state.dateRange[0]);
            const idxMax = timeDay.count(this.state.firstDate, this.state.dateRange[1]);
            const filteredDates = Array.from(this.state.allTimeDates.slice(idxMin, idxMax));
            const dateThresholdIdx = Math.ceil(filteredDates.length / 2)
            const dateThreshold = filteredDates[dateThresholdIdx]
            let statThreshold = 0
            let sliderMin = 100000000000
            let sliderMax = 0

            for (let i = 0; i < scenarioList.length; i++) {
                const copy = Array.from(
                    dataset[scenarioList[i].key][severityList[i].key][stat.key].sims
                    );

                // filter down sims on reproductive number
                const newSeries = copy.filter(s => {
                    return (s.r0 > r0[0] && s.r0 < r0[1])
                });
                    
                const filteredSeriesForStatThreshold = newSeries.map( s => {
                    const newS = {...s}
                    newS.vals = s.vals.slice(idxMin, idxMax)
                    return newS
                });

                const seriesPeaks = filteredSeriesForStatThreshold.map(sim => sim.max);
                const [seriesMin, seriesMax] = getRange(
                    filteredSeriesForStatThreshold,
                    seriesPeaks
                    );
                if (seriesMin < sliderMin) sliderMin = seriesMin
                if (seriesMax > sliderMax) sliderMax = seriesMax
                // update dateThreshold before updating statThreshold?
                if (i === 0) statThreshold = Math.ceil(seriesMax / 1.2);

                const simsOver = this.updateThresholdIterate(
                    newSeries,
                    statThreshold,
                    this.state.allTimeDates,
                    dateThreshold
                )
                if (i === 0) brushSeries = newSeries

                const percExceedence = simsOver / newSeries.length;
                percExceedenceList.push(percExceedence)

                const filteredSeries = newSeries.map( s => {
                    const newS = {...s}
                    newS.vals = s.vals.slice(idxMin, idxMax)
                    return newS
                })
                filteredSeriesList.push(filteredSeries)
                
                // build confidence bounds list
                const confBounds = dataset[scenarioList[i].key][severityList[i].key][stat.key].conf;

                // make sure the stat has confidence bounds array
                if (confBounds && confBounds.length > 0) {
                    // filter by date range selected
                    const filteredConfBounds = confBounds.slice(idxMin, idxMax)
                    confBoundsList.push(filteredConfBounds);
                }
            }
            this.setState({
                seriesList: filteredSeriesList,
                allTimeSeries: brushSeries,
                dates: filteredDates,
                statThreshold,
                dateThreshold,
                seriesMin: sliderMin,
                seriesMax: sliderMax,
                percExceedenceList,
                confBoundsList
            })
        }
    };

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateGraphDimensions)
        window.removeEventListener('resize', this.updateMapContainerDimensions)
    }

    instantiateScenarios(dataset) {
        const SCENARIOS = buildScenarios(dataset);  // constant for geoID
        const scenario = SCENARIOS[0];              // initial scenario in Graph
        const scenarioList = [scenario];            // updated based on selection
        const scenarioListChart = SCENARIOS.map(s => s.name);
        const scenarioMap = SCENARIOS[0].key;       // initial scenario in Map
        
        return [SCENARIOS, scenario, scenarioList, scenarioListChart, scenarioMap];
    }

    updateGraphDimensions = () => {
        const graphW = this.graphEl.clientWidth - margin.yAxis;
        const graphH = this.graphEl.clientHeight;
        this.setState({ graphW, graphH, animateTransition: false });
      }

    updateMapContainerDimensions = () => {
        const mapContainerW = (this.graphEl.clientWidth  - margin.yAxis) - ( 3 * (margin.left)) - (3 * (margin.right));
        const mapContainerH = this.graphEl.clientHeight * 0.8;
        this.setState({ mapContainerW, mapContainerH });
    }

    updateThresholdIterate = (series, statThreshold, dates, dateThreshold) => {
        const dateIndex = dates.findIndex(
            date => formatDate(date) === formatDate(dateThreshold)
            );
        let simsOver = 0;
        Object.values(series).forEach((sim, simIdx) => {
            let simOver = false;
            for (let i = 0; i < dateIndex; i++) {
                if (sim.vals[i] > statThreshold){
                    simsOver = simsOver + 1;
                    simOver = true;
                    break;
                }
            }
            simOver ? sim.over = true : sim.over = false
        })
        return simsOver;
    }

    updateThreshold = (series, statThreshold, dates, dateThreshold) => {
        // update 'over' flag to true if sim peak surpasses statThreshold
        // returns numSims 'over' threshold
        // first find index of dates at dateThreshold
        const dateIndex = dates.indexOf(dateThreshold);

        let simsOver = 0;
        Object.values(series).map(sim => {
            // calculate max once, use to find maxIndex
            const maxIdx = maxIndex(sim.vals)
            const dateAtMax = dates[maxIdx]
            // we need to keep track of whether simval at dateThreshold is over statThreshold
            // as well as whether the max is over statThreshold and occured in the past
            if (sim.vals[dateIndex] > statThreshold
                || (dateAtMax < dateThreshold && sim.max > statThreshold)) {
                simsOver = simsOver + 1;
                return sim.over = true;
            } else {
                return sim.over = false;
            }
        })
        return simsOver;
    }

    initializeGeoid(geoid, dataset) {
        const [SCENARIOS, scenario, scenarioList, scenarioListChart, scenarioMap] =
            this.instantiateScenarios(dataset);

        // re-initialize severity
        const severityList = [_.cloneDeep(LEVELS[0])];
        severityList[0].scenario = scenario.key;

        // re-initialize countyBoundaries
        const state = geoid.slice(0, 2);
        const countyBoundaries = require('../store/countyBoundaries.json')[state];
        const statsForCounty = geojsonStats[state];

        this.setState({
            dataset,
            geoid,
            SCENARIOS,
            scenarioList,
            scenarioListChart,
            scenarioMap,
            severityList,
            countyBoundaries,
            statsForCounty,
            r0: [0, 4]
        })
    }

    handleCountySelect = (i) => {
        const dataset = require(`../store/geo${i.geoid}.json`);
        this.initializeGeoid(i.geoid, dataset);
    }
    
    handleUpload = (dataset, geoid) => {
        this.initializeGeoid(geoid, dataset);
    };

    handleButtonClick = (i) => {
        const yAxisLabel = `Daily ${i.name}`;
        this.setState({
            stat: i, 
            yAxisLabel,
            r0: [0, 4]
        })
    };

    handleStatClickChart = (items) => {
        // items is Array of scenario names
        let newChartStats = []

        for (let item of items) {
            const chartStat = STATS.filter(s => s.key === item)[0];
            newChartStats.push(chartStat)
        }

        this.setState({
            statListChart: newChartStats
        })
        
    }

    handleScenarioClickGraph = (items) => {
        // items is Array of scenario names
        const scenarioClkCntr = this.state.scenarioClickCounter + 1;
        let newScenarios = [];
        let newSevs = [];

        for (let item of items) {
            const defaultSev = _.cloneDeep(LEVELS[0]); 
            defaultSev.scenario = item;
            newSevs.push(defaultSev)

            const scenario = this.state.SCENARIOS.filter(s => s.key === item)[0];
            newScenarios.push(scenario);
        }

        this.setState({
            scenarioList: newScenarios,
            scenarioClickCounter: scenarioClkCntr,
            severityList: newSevs, 
            r0: [0, 4]
        })        
    };

    handleScenarioClickChart = (items) => {
        let scenarioListChart = [];
        for (let item of items) {
            scenarioListChart.push(item)
        }

        this.setState({
            scenarioListChart
        })        
    }

    handleScenarioClickMap = (item) => {
        this.setState({
            scenarioMap : item
        })        
    }

    handleSeveritiesClick = (i) => {
        let newSevList = _.cloneDeep(this.state.severityList);
        newSevList.forEach(sev => {
            if (sev.scenario === i.scenario) {
                return sev.key = i.key;
            }
        })
        this.setState({
            severityList: newSevList, 
            r0: [0, 4],
            animateTransition: true
        });
    };

    handleSeveritiesHover = (i) => {this.setState({scenarioHovered: i})};

    handleSeveritiesHoverLeave = () => {this.setState({scenarioHovered: ''});}

    handleR0Change = (e) => {
        this.setState({ r0: e, animateTransition: false })
    };

    handleStatSliderChange = (thresh) => {
        const { dates, dateThreshold, allTimeDates } = this.state;
        // const rounded = Math.ceil(i / 100) * 100;
        const copyList = Array.from(this.state.seriesList);
        const allSeriesCopy = Array.from(this.state.allTimeSeries);
        this.updateThresholdIterate(allSeriesCopy, thresh, allTimeDates, dateThreshold);
        const percExceedenceList = [];

        for (let i = 0; i < copyList.length; i++) {
            const simsOver = this.updateThresholdIterate(copyList[i], thresh, dates, dateThreshold);
            const percExceedence = simsOver / copyList[i].length;
            percExceedenceList.push(percExceedence);
        }

        this.setState({
            seriesList: copyList,
            allTimeSeries: allSeriesCopy,
            statThreshold: +thresh,
            percExceedenceList,
            animateTransition: true
        });
    };

    handleDateSliderChange = (thresh) => {
        const { statThreshold, dates, allTimeDates } = this.state;
        const copyList = Array.from(this.state.seriesList);
        const allSeriesCopy = Array.from(this.state.allTimeSeries);
        this.updateThresholdIterate(allSeriesCopy, statThreshold, allTimeDates, thresh);
        const percExceedenceList = [];

        for (let i = 0; i < copyList.length; i++) {
            const simsOver = this.updateThresholdIterate(copyList[i], statThreshold, dates, thresh);
            const percExceedence = simsOver / copyList[i].length;
            percExceedenceList.push(percExceedence);
        }
        this.setState({
            seriesList: copyList,
            allTimeSeries: allSeriesCopy,
            dateThreshold: thresh,
            percExceedenceList
        })
    }

    handleBrushRange = (i) => {this.setState({dateRange: i, animateTransition: false});};

    handleBrushStart = () => {this.setState({brushActive: true, animateTransition: false})}

    handleBrushEnd = () => {this.setState({brushActive: false, animateTransition: true})}

    handleScaleToggle = (scale) => {this.setState({ summaryScale: scale })}

    handleConfClick = () => {
        this.setState(prevState => ({
            showConfBounds: !prevState.showConfBounds
        }));
    };

    handleActualClick = () => {
        this.setState(prevState => ({
            showActual: !prevState.showActual
        }));
    };

    handleSummaryDates = (start, end) => {
        this.setState({
            summaryStart: start,
            summaryEnd: end
        });
    };

    handleMapSliderChange = (index) => {
        this.setState({
            mapCurrentDateIndex: +index
        })
    }

    handleSliderMouseEvent = (type, slider, view) => {
        if (view === 'graph') {
            if (slider === 'stat') {
                if (type === 'mousedown') {
                    this.setState({ statSliderActive: true })
                } else {
                    this.setState({ statSliderActive: false })
                }
            } else {
                if (type === 'mousedown') {
                    this.setState({ dateSliderActive: true })
                } else {
                    this.setState({ dateSliderActive: false })
                }
            }
        } else {
            // map date slider
            if (type === 'mousedown') {
                this.setState({ dateSliderActiveMap: true })
            } else {
                this.setState({ dateSliderActiveMap: false })
            }
        } 
    }

    handleDatePicker = (datePickerOpen) => {
        this.setState({ datePickerActiveChart: datePickerOpen })
    }

    toggleAnimateTransition = () => {
        this.setState({ animateTransition: !this.state.animateTransition })
    }

    render() {
        const { Content } = Layout;
        const countyName = `${COUNTYNAMES[this.state.geoid]}`;
        // console.log('animateTransition', this.state.animateTransition)
        return (
            <Layout>
                {/* Search Component */}
                <Search
                    stat={this.state.stat}
                    geoid={this.state.geoid}
                    onFileUpload={this.handleUpload}
                    onCountySelect={this.handleCountySelect}>
                </Search>

                {/* MainGraph Component */}
                {this.state.dataLoaded &&
                <div>
                    <MainGraph 
                        stat={this.state.stat}
                        geoid={this.state.geoid}
                        yAxisLabel={this.state.yAxisLabel}
                        scenarioList={this.state.scenarioList}
                        severity={this.state.severity}
                        r0={this.state.r0}
                        simNum={this.state.simNum}
                        showConfBounds={this.state.showConfBounds}
                        confBoundsList={this.state.confBoundsList}
                        showActual={this.state.showActual}
                        seriesList={this.state.seriesList}
                        dates={this.state.dates}
                        statThreshold={this.state.statThreshold}
                        dateThreshold={this.state.dateThreshold}
                        percExceedenceList={this.state.percExceedenceList}
                        dateRange={this.state.dateRange}
                        brushActive={this.state.brushActive}
                        width={this.state.graphW}
                        height={this.state.graphH}
                        scenarioClickCounter={this.state.scenarioClickCounter}
                        scenarioHovered={this.state.scenarioHovered}
                        series={this.state.allTimeSeries}
                        x={margin.yAxis}
                        y={0}
                        onBrushChange={this.handleBrushRange}
                        onBrushStart={this.handleBrushStart}
                        onBrushEnd={this.handleBrushEnd}
                        SCENARIOS={this.state.SCENARIOS}
                        scenario={this.state.scenario}
                        onScenarioClick={this.handleScenarioClick}
                        onButtonClick={this.handleButtonClick}
                        onConfClick={this.handleConfClick}
                        severityList={this.state.severityList}
                        onSeveritiesClick={this.handleSeveritiesClick}
                        onSeveritiesHover={this.handleSeveritiesHover}
                        onSeveritiesHoverLeave={this.handleSeveritiesHoverLeave}
                        seriesMax={this.state.seriesMax}
                        seriesMin={this.state.seriesMin}
                        dateThresholdIdx={this.state.dateThresholdIdx}
                        firstDate={this.state.firstDate}
                        lastDate={this.state.lastDate}
                        onStatSliderChange={this.handleStatSliderChange}
                        onDateSliderChange={this.handleDateSliderChange}
                    />
                </div>
                }

                {/* MainChart Component */}
                {this.state.dataLoaded &&
                <div>
                    <MainChart 
                        geoid={this.state.geoid}
                        width={this.state.graphW - margin.left - margin.right}
                        height={this.state.graphH * 1.15} 
                        dataset={this.state.dataset}
                        scenarios={this.state.scenarioListChart}
                        stats={this.state.statListChart}
                        firstDate={this.state.firstDate}
                        summaryStart={this.state.summaryStart}
                        summaryEnd={this.state.summaryEnd}
                        scale={this.state.summaryScale}
                        datePickerActive={this.state.datePickerActiveChart}
                        view="chart"
                        SCENARIOS={this.state.SCENARIOS}
                        scenario={this.state.scenario}
                        scenarioList={this.state.scenarioListChart}
                        onScenarioClickChart={this.handleScenarioClickChart}
                        statListChart={this.state.statListChart}
                        onStatClickChart={this.handleStatClickChart}
                        onHandleSummaryDates={this.handleSummaryDates}
                        onHandleDatePicker={this.handleDatePicker}
                        onScaleToggle={this.handleScaleToggle}
                    />
                </div>
                }

                {/* MainMap Component */}
                <Content id="map" style={{ padding: '50px 0' }}>
                    <div className="content-section">
                        <div className="content-header">{countyName}</div>
                    </div>
                    <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
                        <Col className="gutter-row container" span={16} style={{ paddingLeft: margin.yAxis + (2 * margin.left) + margin.right }}>
                            {this.state.dataLoaded &&
                            <div className="map-container">
                                <MapContainer
                                    width={this.state.mapContainerW - margin.left - margin.right}
                                    height={this.state.mapContainerH}
                                    dataset={this.state.dataset}
                                    scenario={this.state.scenarioMap}
                                    geoid={this.state.geoid}
                                    firstDate={this.state.firstDate}
                                    selectedDate={this.state.allTimeDates[this.state.mapCurrentDateIndex]}
                                    countyBoundaries={this.state.countyBoundaries}
                                    statsForCounty={this.state.statsForCounty}
                                    dateSliderActive={this.state.dateSliderActiveMap}
                                />
                            </div>
                            }
                        </Col>

                        <Col className="gutter-row filters" span={6}>
                            {this.state.dataLoaded &&
                            <Fragment>
                                <Scenarios
                                    view="map"
                                    // temporary fix for different scenario array lengths between dataset and map
                                    SCENARIOS={this.state.SCENARIOS.length > 3 ? this.state.SCENARIOS.slice(0, 3) : this.state.SCENARIOS}
                                    scenario={this.state.scenarioMap}
                                    onScenarioClickMap={this.handleScenarioClickMap}
                                />
                                <DateSlider
                                    dates={this.state.allTimeDates}
                                    endIndex={(this.state.allTimeDates.length - 1).toString()}
                                    currentDateIndex={this.state.mapCurrentDateIndex.toString()}
                                    selectedDate={this.state.allTimeDates[this.state.mapCurrentDateIndex]}
                                    onMapSliderChange={this.handleMapSliderChange}
                                    onSliderMouseEvent={this.handleSliderMouseEvent}
                                />
                            </Fragment>
                             }
                        </Col>
                    </Row>
                </Content>

                {/* Methodology Component */}
                <Methodology />

            </Layout>
        )
    }
}

export default MainContainer;
