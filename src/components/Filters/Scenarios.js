import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import { Select } from 'antd';
const { Option } = Select;
import { InfoCircleTwoTone } from '@ant-design/icons';

import TooltipHandler from './TooltipHandler';
import { formatTitle } from '../../utils/utils';
import { styles } from '../../utils/constants';

const ScenariosModeEnum = {
    chart: 'chart',
    map: 'map',
    graph: 'graph',
    multiple: 'multiple',
};

const Scenarios = ({
    view,
    scenarioList,
    SCENARIOS,
    scenario,
    onScenarioClick,
    onScenarioClickChart,
    onScenarioClickMap,
}) => {
    const [ showTooltip, setShowTooltip ] = useState(false);

    const handleTooltipClick = useCallback(() => {
        setShowTooltip(!showTooltip);
    }, [ showTooltip ]);

    const handleChange = useCallback((event) => {
        // prevent user from deselecting all scenarios
        if (event.length === 0) {
            return;
        }
        switch (view) {
            case ScenariosModeEnum.graph:
                onScenarioClick(event);
                break;
            case ScenariosModeEnum.chart:
                onScenarioClickChart(event);
                break;
            case ScenariosModeEnum.map:
                onScenarioClickMap(event);
                break;
            default:
                break;
        }
    }, [ view, onScenarioClick, onScenarioClickChart, onScenarioClickMap ]);


    let children = [];
    if (view === ScenariosModeEnum.graph && SCENARIOS && SCENARIOS.length > 0 && scenarioList && scenarioList.length > 0 && scenario) {
        const keys = Object.values(scenarioList).map(scen => scen.key);
        const scenariosGraph = Array.from(SCENARIOS);

        scenariosGraph.map(scenario => {
            if (keys.includes(scenario.key) || scenarioList.length < 2) {
                return scenario.disabled = false;
            } else {
                return scenario.disabled = true;
            }
        });

        for (let scenario of scenariosGraph) {
            const child = {
                key: scenario.key,
                checkbox: []
            };
            child.checkbox.push(
                <Option
                    key={scenario.key}
                    disabled={scenario.disabled}>
                    {formatTitle(scenario.key)}
                </Option>
            );
            children.push(child);
        }
    } else if (SCENARIOS && SCENARIOS.length > 0) {
        const scenariosChart = Array.from(SCENARIOS);

        for (let scenario of scenariosChart) {
            const child = {
                key: scenario.key,
                checkbox: []
            };
            child.checkbox.push(
                <Option
                    key={scenario.key}>
                    {formatTitle(scenario.key)}
                </Option>
            );
            children.push(child);
        }
    }

    let defaultScenario;
    let graphTags;
    switch (view) {
        case ScenariosModeEnum.graph:
            defaultScenario = [scenarioList[0].key];
            graphTags = scenarioList.map(s => s.key);
            break;
        case ScenariosModeEnum.chart:
            defaultScenario = SCENARIOS.map(s => s.name);
            graphTags = scenarioList;
            break;
        case ScenariosModeEnum.map:
            defaultScenario = [scenario];
            graphTags = defaultScenario;
            break;
        default:
            break;
    }

    return (
        <div>
            <div className="param-header">
                SCENARIOS
                <TooltipHandler
                    showTooltip={showTooltip}
                    onClick={handleTooltipClick}>
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltip &&
                        <span className="tooltip-text">
                            Scenarios are named for the model run date. 
                            This means that the model is calibrated only to ground truth data 
                            that was reported prior to the model run date.
                        </span>}
                    </div>
                </TooltipHandler>
            </div>
            <Select
                mode={view === ScenariosModeEnum.map ? undefined : ScenariosModeEnum.multiple}
                style={styles.Selector}
                defaultValue={defaultScenario}
                value={graphTags}
                maxTagTextLength={12}
                onChange={handleChange}>
                {children.map(child => child.checkbox)}
            </Select>
        </div>
    );
};

Scenarios.propTypes = {
    view: PropTypes.string.isRequired,
    scenarioList: PropTypes.array,
    SCENARIOS: PropTypes.array,
    scenario: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]),
    onScenarioClick: PropTypes.func,
    onScenarioClickChart: PropTypes.func,
    onScenarioClickMap: PropTypes.func,
};

export default Scenarios;
