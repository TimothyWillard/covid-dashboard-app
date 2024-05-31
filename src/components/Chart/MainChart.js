import React, { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Layout, Row, Col, Spin, Alert } from 'antd';
const { Content } = Layout;
import { PlusCircleTwoTone } from '@ant-design/icons';
import { utcParse } from 'd3-time-format'

import ChartContainer from './ChartContainer';
import Scenarios from '../Filters/Scenarios';
import ChartRangePicker from './ChartRangePicker';
import ScaleToggle from './ScaleToggle';
import IndicatorSelection from './IndicatorSelection';
import ViewModal from '../ViewModal';
import { styles } from '../../utils/constants';
import { buildScenarios, buildScenarioMap } from '../../utils/utils';

const parseDate = utcParse('%Y-%m-%d')

const MainChart = ({ 
    geoid,
    dataset,
    indicators,
    width, 
    height
}) => {
    // this.state = {
    //     dataLoaded: false,
    //     datasetChart: {},
    //     dates: [],
    //     SCENARIOS: [],
    //     scenarioList: [],   // selected scenarios in Chart view
    //     scenarioMap: {},    // maps all scenarios to list of severities
    //     statList: [],
    //     datePickerActive: false,
    //     start: new Date(),
    //     end: new Date(),
    //     scale: 'power', // TS migration: ScaleTypeEnum
    //     modalVisible: false,
    //     firstModalVisit: true,
    // };
    const [dataLoaded, setDataLoaded] = useState(false);
    const [datasetChart, setDatasetChart] = useState({});
    const [dates, setDates] = useState([]);
    const [SCENARIOS, setSCENARIOS] = useState([]);
    const [scenarioList, setScenarioList] = useState([]);
    const [scenarioMap, setScenarioMap] = useState({});
    const [statList, setStatList] = useState([]);
    const [start, setStart] = useState(new Date());
    const [end, setEnd] = useState(new Date());
    const [datePickerActive, setDatePickerActive] = useState(false);
    const [scale, setScale] = useState('power');
    const [modalVisible, setModalVisible] = useState(false);
    const [firstModalVisit, setFirstModalVisit] = useState(true);

    const scrollElemChart = useRef(null);

    const handleScenarioClickChart = (items) => {
        let scenarioList = [];
        for (let item of items) {
            scenarioList.push(item)
        }
        setScenarioList(scenarioList);
    }
    
    const handleStatClickChart = useCallback((items) => {
        // items is Array of scenario names
        let newIndicators = [];
        for (let item of items) {
            const indicator = indicators.filter(s => s.key === item)[0];
            newIndicators.push(indicator);
        }
        setStatList(newIndicators);
    }, [ indicators ]);

    const handleSummaryDates = (start, end) => {
        setStart(start);
        setEnd(end);
    };

    const handleDatePicker = (open) => {
        setDatePickerActive(open);
    };

    const handleScaleToggle = (scale) => {
        setScale(scale);
    };

    const handleModalCancel = () => {
        setModalVisible(false);
        setFirstModalVisit(false);
    }

    const showModal = () => {
        setModalVisible(true);
    }

    const handleScroll = useCallback(() => {
        if (scrollElemChart.current && firstModalVisit && 
            (document.body.scrollTop > scrollElemChart.current.offsetTop - 60 && 
                document.body.scrollTop < scrollElemChart.current.offsetTop)) {
            setModalVisible(true);
        }
    }, [ scrollElemChart, firstModalVisit ]);

    const initializeChart = (dataset, indicators) => {
        if (Object.keys(dataset).length > 0) {
            // instantiate scenarios, initial default indicators
            const SCENARIOS = buildScenarios(dataset);  
            const scenarioList = SCENARIOS.map(s => s.name);
            const scenarioMap = buildScenarioMap(dataset);
            const statList = indicators.slice(0,2)

            // instantiate start and end date (past 2 weeks) for summary indicators
            const dates = dataset[SCENARIOS[0].key].dates.map( d => parseDate(d));
            const start = new Date(); 
            start.setDate(start.getDate() - 14); 

            // dataset needs to be set to state at the same time as other props
            // otherwise, children updates will occur at different times
            setDatasetChart(dataset);
            setDates(dates);
            setSCENARIOS(SCENARIOS);
            setScenarioList(scenarioList);
            setScenarioMap(scenarioMap);
            setStatList(statList);
            setStart(start);
            setDataLoaded(true);
        }
    };

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, true);
        return () => {
            window.removeEventListener("scroll", handleScroll, true);
        }
    }, [ handleScroll ]);

    useLayoutEffect(() => {
        initializeChart(dataset, indicators);
        return () => {};
    }, [ dataset, indicators ]);

    const datasetLen = Object.keys(dataset).length;

    return (
        <div ref={scrollElemChart}>
            <Content id="exploration" style={styles.ContainerWhite}>
                {/* Loaded Chart, dataset has been fetched successfully */}
                {dataLoaded && datasetLen > 0 &&
                <Row gutter={styles.gutter}>
                    <Col className="gutter-row container">
                        <div className="graph-title-row">
                            <div className="section-title">
                                Aggregate Stats Graph
                            </div>
                        </div>
                        <ViewModal 
                            modalTitle="Interpreting the aggregate statistics graph"
                            modalVisible={modalVisible}
                            onCancel={handleModalCancel}
                            modalContainer="#exploration"
                            modalText={
                                <div>
                                    <p>This graph shows the distribution of a projected indicator 
                                    (e.g., confirmed cases, hospitalizations, deaths) 
                                    across model simulations in your state or county for 
                                    different scenarios over a specific period of time.</p>
                                    <p>Use the control panel on the right side to:</p>
                                    <ul>
                                        <li>Select scenarios for comparison</li>
                                        <li>Select indicators of interest</li>
                                        <li>Narrow the date range of interest</li>
                                        <li>Change the transformation applied to the y-axis scale</li>
                                    </ul>
                                    <div className="mobile-alert">
                                        &#9888; Please use a desktop to access the full feature set, 
                                        including selecting indicators and date range.
                                    </div>
                                </div>}
                            />
                        <div className="map-container">
                            <ChartContainer
                                geoid={geoid}
                                width={width}
                                height={height} 
                                dataset={datasetChart}
                                scenarios={scenarioList}
                                scenarioMap={scenarioMap}
                                indicators={statList}
                                firstDate={dates[0]}
                                start={start}
                                end={end}
                                scale={scale}
                                datePickerActive={datePickerActive} />
                        </div>
                    </Col>
                    <Col className="gutter-row container mobile-only">
                        <div className="mobile-alert">
                            &#9888; The filters below are disabled on mobile devices.
                        </div>
                    </Col>
                    <Col className="gutter-row filters mobile">
                        <Fragment>
                            <div className="instructions-wrapper" onClick={showModal}>
                                <div className="param-header instructions-label">
                                    INSTRUCTIONS
                                </div>
                                <div className="instructions-icon">
                                    <PlusCircleTwoTone />
                                </div>
                            </div>
                            <Fragment>
                                <Scenarios 
                                    view="chart"
                                    SCENARIOS={SCENARIOS}
                                    scenarioList={scenarioList}
                                    onScenarioClickChart={handleScenarioClickChart} />
                                <IndicatorSelection
                                    statList={statList}
                                    indicators={indicators}
                                    onStatClickChart={handleStatClickChart} />
                            </Fragment>
                            <ChartRangePicker 
                                firstDate={dates[0]}
                                start={start}
                                end={end}
                                onHandleSummaryDates={handleSummaryDates}
                                onHandleDatePicker={handleDatePicker} />
                            <ScaleToggle
                                scale={scale}
                                onScaleToggle={handleScaleToggle} />
                        </Fragment>
                    </Col>
                </Row>}
                {/* Loaded Chart,but dataset is undefined */}
                {datasetLen === 0 && 
                <div className="error-container">
                    <Spin spinning={false}>
                        <Alert
                            message="Data Unavailable"
                            description={
                                <div>
                                    Aggregate data for county {geoid} is
                                    unavailable or in an unexpected format.
                                </div>}
                            type="info" />
                    </Spin>
                </div>}
            </Content>
        </div>
    );
};

MainChart.propTypes = {
    geoid: PropTypes.string.isRequired,
    dataset: PropTypes.object.isRequired,
    indicators: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]).isRequired,
    width: PropTypes.number.isRequired, 
    height: PropTypes.number.isRequired,
}

export default MainChart;
