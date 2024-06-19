import React, { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { defaultGeoid, margin, dimMultipliers } from '../utils/constants';
import { getGraphContainerDimensions, getMapContainerDimensions } from '../utils/dimensions';
import { fetchJSON } from '../utils/fetch';
import Search from './Search/Search'
import MainGraph from './Graph/MainGraph';
import MainChart from './Chart/MainChart';
import MainMap from './Map/MainMap';
import Methodology from './Methodology';
import About from './About';

export default function MainContainer() {
    const [ initialGraphW, initialGraphH ] = getGraphContainerDimensions();
    const [ initialMapContainerW, initialMapContainerH ] = getGraphContainerDimensions();

    const [ dataset, setDataset ] = useState({});
    const [ geoid, setGeoid ] = useState(-1); 
    const [ actuals, setActuals ] = useState({});
    const [ indicators, setIndicators ] = useState([]);
    const [ validGeoids, setValidGeoids ] = useState([]);
    const [ fetchErrors, setFetchErrors ] = useState(''); 
    const [ dataLoaded, setDataLoaded ] = useState(false);
    const [ graphW, setGraphW ] = useState(initialGraphW);
    const [ graphH, setGraphH ] = useState(initialGraphH);
    const [ mapContainerW, setMapContainerW ] = useState(initialMapContainerW);
    const [ mapContainerH, setMapContainerH ] = useState(initialMapContainerH);

    function containerResizeHandler() {
        const [ mapWidth, mapHeight ] = getMapContainerDimensions();
        const [ graphWidth, graphHeight ] = getGraphContainerDimensions();
        setGraphW(graphWidth);
        setGraphH(graphHeight);
        setMapContainerW(mapWidth);
        setMapContainerH(mapHeight);
    }

    useEffect(() => {
        const fetchData = async() => {
            const validGeoids = await fetchJSON('validGeoids', null, {});
            let localGeoid = geoid;
            if (localGeoid === -1) {
                // Populate the default value dynamically
                // to handle incomplete geographies
                if (validGeoids && validGeoids['geoids']) {
                    localGeoid = validGeoids['geoids'][0];
                    setGeoid(localGeoid);
                } else {
                    localGeoid = defaultGeoid;
                    setGeoid(defaultGeoid);
                }
            }
            const dataset = await fetchJSON('dataset', localGeoid);
            const actuals = await fetchJSON('actuals', localGeoid, {});
            const outcomes = await fetchJSON('outcomes', null, {});
            const indicators = Object.keys(outcomes).map((obj) => outcomes[obj]);
            setDataset(dataset);
            setActuals(actuals);
            setIndicators(indicators);
            if (validGeoids && validGeoids['geoids']) {
                setValidGeoids(validGeoids['geoids']);
            } else {
                setValidGeoids([]);
            }
        }
        fetchData()
            .then(() => {
                setDataLoaded(true)
            })
            .catch((e) => {
                setFetchErrors(e.message);
                console.error(e.message);
            })
        window.addEventListener('resize', containerResizeHandler);
        return () => {
            setFetchErrors('');
            setDataLoaded(false);
            setDataset({});
            setActuals({});
            setIndicators([]);
            window.removeEventListener('resize', containerResizeHandler);
        };
    }, [geoid]);

    function handleCountySelect(geoid) {
        setGeoid(geoid);
    }

    function handleUpload(dataset, geoid) {
        // TODO: I think file upload handling is going to be a bit 
        // broken at the moment because the setGeoid call here will 
        // invoke the useEffect above the resets/reloads the dataset.
        setDataset(dataset); 
        setGeoid(geoid);
    }

    const mainChartWidth = graphW - margin.left - margin.right;
    const mainChartHeight = graphH * dimMultipliers.chartDesktopH
    const mainMapWidth = mapContainerW - margin.left - margin.right;
    const mainMapHeight = mapContainerH;

    return (
        <Layout>
            <Search
                geoid={geoid}
                onFileUpload={handleUpload}
                onCountySelect={handleCountySelect}
                validGeoids={validGeoids} >
            </Search>
            { dataLoaded &&
                <MainGraph
                    geoid={geoid}
                    dataset={dataset}
                    indicators={indicators}
                    actuals={actuals}
                    width={graphW}
                    height={graphH}
                    fetchErrors={fetchErrors}
                />
            }
            { dataLoaded &&
                <MainChart
                    geoid={geoid}
                    dataset={dataset}
                    indicators={indicators}
                    width={mainChartWidth}
                    height={mainChartHeight}
                />
            }
            { dataLoaded &&
                <MainMap
                    geoid={geoid}
                    dataset={dataset}
                    indicators={indicators}
                    width={mainMapWidth}
                    height={mainMapHeight}
                />
            }
            <Methodology/>
            <About/>
        </Layout>
    )
}
