import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Layout, Row, Col, Spin, Alert } from 'antd';
import { PlusCircleTwoTone } from '@ant-design/icons';
import MapContainer from './MapContainer';
import Scenarios from '../Filters/Scenarios';
import DateSlider from './DateSlider';
import ViewModal from '../ViewModal.js';
import PropTypes from 'prop-types';

import { styles } from '../../utils/constants';
import { buildScenarios } from '../../utils/utils';
import { fetchJSON } from '../../utils/fetch';
import { utcParse, timeFormat } from 'd3-time-format'

const { Content } = Layout;
const parseDate = utcParse('%Y-%m-%d')
const formatDate = timeFormat('%Y-%m-%d')

const MainMap = ({ geoid, dataset, indicators, width, height }) => {
    const [ dataLoaded, setDataLoaded ] = useState(false);
    const [ datasetMap, setDatasetMap ] = useState({});
    const [ dates, setDates ] = useState([]);
    const [ scenarios, setScenarios ] = useState([]);
    const [ scenario, setScenario ] = useState('');
    const [ dateSliderActiveMap, setDateSliderActiveMap ] = useState(false);
    const [ indicatorsForMap, setIndicatorsForMap ] = useState({});
    const [ indicatorsForCounty, setIndicatorsForCounty ] = useState({});
    const [ stateBoundaries, setStateBoundaries ] = useState({});
    const [ countyBoundaries, setCountyBoundaries ] = useState({});
    const [ fetchErrors, setFetchErrors ] = useState('');
    const [ currentDateIndex, setCurrentDateIndex ] = useState(0);
    const [ modalVisible, setModalVisible ] = useState(false);
    const firstModalVisitRef = useRef(true);

    function initializeMap() {
        const stateFips = geoid.slice(0, 2);
        if (Object.keys(dataset).length > 0 &&
            Object.keys(indicatorsForMap).length > 0 &&
            Object.keys(stateBoundaries).length > 0) {
            // Test if we have county level data, if so we render the map
            let countyLevelData = false;
            const indicatorsForMapKeys = Object.keys(indicatorsForMap);
            for (let i = 0; i < indicatorsForMapKeys.length; ++i) {
                let stateGeoid = indicatorsForMapKeys[i];
                let countyGeoids = Object.keys(indicatorsForMap[stateGeoid]);
                if (countyGeoids.length > 1 || countyGeoids[0] !== stateGeoid) {
                    countyLevelData = true;
                    break;
                }
            }
            if (countyLevelData) {
                // instantiate scenarios and dates
                const scenarios = buildScenarios(dataset);
                const scenario = scenarios[0].key;       
                const dates = dataset[scenario].dates.map( d => parseDate(d));
            
                // '2020-07-19-21-44-47-inference'
                const dateString = scenario.substring(0,10)
                const dateThreshold = parseDate(dateString)

                const currentDateIndex = dates
                    .findIndex(date => formatDate(date) === formatDate(dateThreshold));

                setDatasetMap(dataset);
                setDates(dates);
                setScenarios(scenarios);
                setScenario(scenario);
                setIndicatorsForCounty(indicatorsForMap[stateFips]);
                setCountyBoundaries(stateBoundaries[stateFips]);
                setCurrentDateIndex(currentDateIndex);
                setDataLoaded(true);
            }
        } else {
            if (Object.keys(dataset).length === 0) console.log('Map Error: Dataset is empty');
            if (Object.keys(indicatorsForMap).length === 0) console.log('Map Error: indicatorsForMap is empty');
            if (Object.keys(stateBoundaries).length === 0) console.log('Map Error: stateBoundaries is empty');
        }
    }

    function showModal() {
        setModalVisible(true);
        firstModalVisitRef.current = false;
    }

    function mainMapScrollHandler() {
        const mainMapDiv = document.getElementById('main-map-div');
        if (mainMapDiv && firstModalVisitRef.current && 
            (document.body.scrollTop > mainMapDiv.offsetTop - 60 && 
                document.body.scrollTop < mainMapDiv.offsetTop)) {
            showModal();
        } 
    }

    function handleScenarioClick(item) {
        setScenario(item);
    }

    function handleMapSliderChange(index) {
        setCurrentDateIndex(+index);
    }

    function handleSliderMouseEvent(type) {
        if (type === 'mousedown') {
            setDateSliderActiveMap(true);
        } else {
            setDateSliderActiveMap(false);
        }
    }

    function handleModalCancel() {
        setModalVisible(false);
    }

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        const fetchData = async() => {
            const indForMap = await fetchJSON('statsForMap');
            const stateBound = await fetchJSON('countyBoundaries');
            setIndicatorsForMap(indForMap);
            setStateBoundaries(stateBound);
        }
        fetchData()
            .then(() => {
                setDataLoaded(true);
            })
            .catch((e) => {
                setFetchErrors(e.message);
                console.error(e.message);
            });
        window.addEventListener('scroll', mainMapScrollHandler, true);
        return () => {
            setFetchErrors('');
            setDataLoaded(false);
            setIndicatorsForMap({});
            setStateBoundaries({});
            window.removeEventListener('scroll', mainMapScrollHandler, true);
        };
    }, []);
    
    useEffect(() => {
        initializeMap();
        return () => {};
    }, [ dataLoaded, geoid ]);
    /* eslint-enable react-hooks/exhaustive-deps */

    const indicatorsLen = Object.keys(indicatorsForCounty) ? Object.keys(indicatorsForCounty).length : 0;

    return (
        <div id="main-map-div">
            <Content id="geographic-map" style={styles.ContainerGray}>
                {/* Loaded Map, indicatorsForCounty has been fetched */}
                {dataLoaded && indicatorsLen > 0 &&
                <Row gutter={styles.gutter}>
                    <Col className="gutter-row container" style={styles.MapContainer}>
                    <div className="graph-title-row">
                            <div className="section-title">Map View</div>
                        </div>
                        <ViewModal 
                            modalTitle="Interpreting the map view"
                            modalVisible={modalVisible}
                            onCancel={handleModalCancel}
                            modalContainer="#geographic-map"
                            modalText={
                                <div>
                                    <p>This map displays the projected mean point estimate mean value 
                                    (e.g., confirmed cases, hospitalizations, deaths) 
                                    per 10,000 population by county on a specific date.</p>
                                    <p>Use the control panel on the right to select a scenario and date for display in the map. 
                                    Hover over individual counties with your cursor for additional information. 
                                    Use the right and left arrow keys to increase or decrease by day.</p>
                                    <div className="mobile-alert">
                                        &#9888; Please use a desktop to access the full feature set.
                                    </div>
                                </div>
                            }
                        />
                        <div className="map-container">
                            <MapContainer
                                geoid={geoid}
                                dataset={datasetMap}
                                indicators={indicators}
                                width={width}
                                height={height}
                                scenario={scenario}
                                firstDate={dates[0]}
                                selectedDate={dates[currentDateIndex]}
                                countyBoundaries={countyBoundaries}
                                indicatorsForCounty={indicatorsForCounty}
                                dateSliderActive={dateSliderActiveMap}
                            />
                        </div>
                    </Col>

                    <Col className="gutter-row filters"> 
                        {dataLoaded &&
                        <Fragment>
                            <div className="instructions-wrapper" onClick={showModal}>
                                <div className="param-header instructions-label">INSTRUCTIONS</div>
                                <div className="instructions-icon">
                                    <PlusCircleTwoTone />
                                </div>
                            </div>
                            <Scenarios
                                view="map"
                                SCENARIOS={scenarios}
                                scenario={scenario}
                                onScenarioClickMap={handleScenarioClick}
                            />
                            <DateSlider
                                dates={dates}
                                currentDateIndex={currentDateIndex.toString()}
                                onMapSliderChange={handleMapSliderChange}
                                onSliderMouseEvent={handleSliderMouseEvent}
                            />
                        </Fragment>
                        }
                    </Col>
                </Row>}
                {/* Loading finished but indicatorsForCounty is undefined */}
                {indicatorsLen === 0 && 
                <div className="error-container">
                    <Spin spinning={false}>
                        <Alert
                        message="Data Unavailable"
                        description={
                            <div>
                                Geographic data is unavailable for county {geoid}. <br />
                                {fetchErrors}
                            </div>
                        }
                        type="info"
                        />
                    </Spin>
                </div>}
            </Content>
        </div>
    );
};

MainMap.propTypes = {
    geoid: PropTypes.string.isRequired,
    dataset: PropTypes.object.isRequired, 
    indicators: PropTypes.array.isRequired, 
    width: PropTypes.number.isRequired, 
    height: PropTypes.number.isRequired
};

export default MainMap;
