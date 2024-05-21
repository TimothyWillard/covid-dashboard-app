import React, { useState, useCallback } from 'react';
import { Select } from 'antd';
import { InfoCircleTwoTone } from '@ant-design/icons';
import PropTypes from 'prop-types';

import TooltipHandler from '../Filters/TooltipHandler';

import { styles } from '../../utils/constants';

const { Option } = Select;

const IndicatorSelection = ({ indicators, statList, onStatClickChart }) => {
    const [ showTooltip, setShowTooltip ] = useState(false);

    const handleTooltipClick = useCallback(() => {
        setShowTooltip(!showTooltip);
    }, [ showTooltip ]);

    const handleChange = useCallback((event) => {
        if (event.length === 1)
            return;
        onStatClickChart(event);
    }, [ onStatClickChart ]);

    let indicatorsForChart = [];
    let children = []
    if (statList && statList.length > 0) {
        const keys = Object
            .values(statList)
            .map(indicator => indicator.key);
        indicatorsForChart = Array.from(indicators);
        
        if (statList.length >= 3) {
            indicatorsForChart.map(indicator => {
                if (keys.includes(indicator.key)) {
                    return indicator.disabled = false;
                }
                return indicator.disabled = true;
            })
        } else {
            indicatorsForChart.map(indicator => {
                return indicator.disabled = false
            })
        }

        for (let indicator of indicatorsForChart) {
            const child = {
                key: indicator.key,
                checkbox: []
            } 
            child.checkbox.push(
                <Option
                    key={indicator.key}
                    disabled={indicator.disabled}>
                    {indicator.name}
                </Option>
            )
            children.push(child);
        }
    }

    return (
        <div>
            <div className="param-header">
                INDICATORS
                <TooltipHandler
                    showTooltip={showTooltip}
                    onClick={handleTooltipClick}>
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltip &&
                        <span className="tooltip-text">
                        Indicators are calculated after accounting for the 
                        appropriate time delays and probabilities of transitioning 
                        into a given state (e.g., initial infection to hospitalization). 
                        </span>}
                    </div>
                </TooltipHandler>
            </div>
            <Select
                mode="multiple"
                style={styles.Selector}
                defaultValue={statList.map(s => s.key)}
                value={statList.map(s => s.key)}
                maxTagTextLength={12}
                onChange={handleChange}>
                {children.map(child => child.checkbox)}
            </Select>
        </div>
    );
};

IndicatorSelection.propTypes = {
    indicators: PropTypes.array.isRequired,
    statList: PropTypes.array.isRequired,
    onStatClickChart: PropTypes.func.isRequired,
};

export default IndicatorSelection;
