import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import { Select } from 'antd';
const { Option } = Select; 
import { InfoCircleTwoTone } from '@ant-design/icons';

import { styles } from '../../utils/constants';
import TooltipHandler from './TooltipHandler';

const Indicators = ({
    indicators,
    indicator,
    onIndicatorClick
}) => {
    const [ showTooltip, setShowTooltip ] = useState(false);

    const handleTooltipClick = useCallback(() => {
        setShowTooltip(!showTooltip);
    }, [ showTooltip ]);

    const handleChange = useCallback((e) => {
        const item = indicators.filter(i => i.key === e)[0];
        onIndicatorClick(item);
    }, [ indicators, onIndicatorClick ]);

    let children = [];
    if (indicators) {
        for (let indicator of indicators) {
            const child = {
                key: `${indicator.key}-indicator`,
                button: []
            };
            child.button.push(
                <Option
                    key={`${indicator.key}-indicator`}
                    value={indicator.key}>
                    {indicator.name}
                </Option>
            );
            children.push(child);
        }
    }

    return (
        <div>
            <div className="param-header">
                INDICATOR    
                <TooltipHandler
                    showTooltip={showTooltip}
                    onClick={handleTooltipClick}>
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltip &&
                        <span className="tooltip-text">
                            Indicators are calculated after accounting for the 
                            appropriate time delays and probabilities of 
                            transitioning into a given state 
                            (e.g., initial infection to hospitalization).
                        </span>}
                    </div>
                </TooltipHandler>
            </div>
            <Select
                // re-render every time indicator key changes
                key={indicator.key}
                defaultValue={indicator.key}
                style={styles.Selector}
                onChange={handleChange}>
                {children.map(child => child.button)}
            </Select>
        </div>
    );
};

Indicators.propTypes = {
    indicators: PropTypes.array.isRequired,
    indicator: PropTypes.object.isRequired,
    onIndicatorClick: PropTypes.func.isRequired,
};

export default Indicators;
