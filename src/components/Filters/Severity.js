import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Radio } from 'antd';
import { InfoCircleTwoTone } from '@ant-design/icons';
import _ from 'lodash';

import TooltipHandler from './TooltipHandler';
import { LEVELS, styles } from '../../utils/constants';
import { capitalize, formatTitle } from '../../utils/utils';

const Severity = ({ 
    existingSevs, 
    scenario, 
    onSeverityClick, 
    onSeverityHover, 
    onSeverityHoverLeave, 
    isDisabled, 
    sevCount, 
    severity 
}) => {
    const [ showTooltip, setShowTooltip ] = useState(false);

    const handleChange = useCallback((e) => {
        const item = LEVELS.filter(level => level.key === e.target.value)[0];
        const itemClone = _.assign({}, item, {
            scenario: scenario.key
        });
        onSeverityClick(itemClone);
    }, [ scenario, onSeverityClick ]);

    const handleTooltipClick = useCallback(() => {
        setShowTooltip(!showTooltip);
    }, [ showTooltip ]);

    const handleMouseEnter = useCallback((e) => {
        onSeverityHover(e)
    }, [ onSeverityHover ]);

    const handleMouseLeave = useCallback((e) => {
        onSeverityHoverLeave(e)
    }, [ onSeverityHoverLeave ]);

    let children = [];
    for (let level of LEVELS) {
        const child = {
            key: `${level.key}-severity`,
            button: []
        } 
        child.button.push(
            <Radio.Button
                key={`${level.key}-severity`}
                // disable radio button if severity level does not exist
                disabled={!existingSevs.includes(level.key)}
                value={level.key}>{capitalize(level.key)}
            </Radio.Button>
        )
        children.push(child);
    }

    const title = sevCount === 1 ? 'SEVERITY' : ('Severity for ' + formatTitle(scenario.name));

    return ( 
        <div
            onMouseEnter={() => handleMouseEnter(scenario.name)}
            onMouseLeave={() => handleMouseLeave(scenario.name)}>
            <div className="param-header">
                {title}
                <TooltipHandler
                    showTooltip={showTooltip}
                    onClick={handleTooltipClick}>
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltip &&
                        <span className="tooltip-text">
                            The high, medium, and low severity labels correspond 
                            to 1%, 0.5%, and 0.25% infection fatality ratios (IFR), 
                            and 10%, 5% and 2.5% hospitalization rates, respectively. 
                            Note that models are simulated independently for each severity level, 
                            even for the same model scenario.
                        </span>}
                    </div>
                </TooltipHandler>
            </div>
            <Radio.Group
                value={severity.key} 
                style={styles.Severity}
                disabled={isDisabled}
                onChange={handleChange}>
                {children.map(child => child.button)}
            </Radio.Group>
        </div>
    );
};

Severity.propTypes = { 
    existingSevs: PropTypes.array.isRequired, 
    scenario: PropTypes.object.isRequired, 
    onSeverityClick: PropTypes.func.isRequired, 
    onSeverityHover: PropTypes.func.isRequired, 
    onSeverityHoverLeave: PropTypes.func.isRequired, 
    isDisabled: PropTypes.bool.isRequired, 
    sevCount: PropTypes.number.isRequired, 
    severity: PropTypes.object.isRequired, 
};

export default Severity;
