import React, { useCallback, useState } from 'react';
import { Layout, Col, Row, Switch } from 'antd';
import PropTypes from 'prop-types';

import FileUploader from './FileUploader';
import SearchBar from "./SearchBar";
import { styles } from '../../utils/constants';
import { ReactComponent as GraphLogo } from '../../assets/graph.svg';
import { ReactComponent as ChartLogo } from '../../assets/chart.svg';
import { ReactComponent as MapLogo } from '../../assets/globe.svg';

const { Content } = Layout;

const Search = ({onFileUpload, onCountySelect}) => {
    const [ showFileUpload, setShowFileUpload ] = useState(false);

    const handleUpload = useCallback((json, geoId) => {
        onFileUpload(json, geoId);
    }, [ onFileUpload ]);

    const handleUploadToggle = () => {
        setShowFileUpload(!showFileUpload);
    };

    const uploadMessage = showFileUpload ?
            "Upload File provided by the Johns Hopkins IDD Working Group, for example, geo06085.json" :
            "Upload File";

    return (
        <Content id="search" style={styles.ContainerWhite}>
            <Col className="gutter-row container">
                <div className="title-header">COVID-19 Intervention Scenario Modeling</div>
            </Col>

            <Col className="gutter-row container">
                <div className="content-section">
                    <div>Welcome to the visualization dashboard for COVID-19 projections from the&nbsp;
                        <a className="customLink" href="http://www.iddynamics.jhsph.edu/">
                        Johns Hopkins ID Dynamics COVID-19 Working Group</a>.
                        Here we display more detailed data on the weekly model 
                        projections that we submit to the&nbsp;
                        <a className="customLink" href="https://viz.covid19forecasthub.org/">
                        COVID-19 Forecast Hub </a>
                        as well as occasional long-term scenario planning projections 
                        for locations in the United States. 
                        Scroll down and use this dashboard to:
                    </div>
                    <ul className="search-bullets">
                        <li>
                            <span>
                                <GraphLogo
                                    className="nav-active"
                                    height={20}
                                    width={35}
                                    style={styles.iconGraph}/>
                            </span>
                            Interact with individual simulation curves
                        </li>
                        <li>
                            <span>
                                <ChartLogo
                                    className="nav-active"
                                    height={20}
                                    width={25}
                                    style={styles.iconChart}/>
                            </span>
                            Explore the estimated number of confirmed cases, 
                            hospitalizations, and deaths in coming weeks
                        </li>
                        <li>
                            <span>
                                <MapLogo
                                    className="nav-active"
                                    height={20}
                                    width={30}
                                    style={styles.iconMap}/>
                            </span>
                            Visualize county-level and state-level trends
                        </li>
                    </ul>
                    <br/>
                    <div>
                        Find your state or county in our registry to start 
                        examining projections now.
                    </div>
                    <SearchBar
                        onCountySelect={onCountySelect}
                        style={styles.SearchBar}/>
                    <Row gutter={styles.gutter} style={styles.Switch}>
                        <Switch
                            style={{ 'marginTop': '0.1rem' }}
                            onChange={handleUploadToggle}
                            size="small"/>
                        <div className="upload-toggle">{uploadMessage}</div>
                    </Row>
                    <br/>
                    {showFileUpload &&
                    <FileUploader onUpload={handleUpload}/>}
                </div>
            </Col>
        </Content>
    );
};

Search.propTypes = {
    // geoid: PropTypes.string.isRequired,
    onFileUpload: PropTypes.func.isRequired,
    onCountySelect: PropTypes.func.isRequired,
};

export default Search;
