import React, { useState, useCallback, Fragment } from 'react';
import PropTypes from 'prop-types';

import { Radio } from 'antd';
import { InfoCircleTwoTone } from '@ant-design/icons';

import TooltipHandler from './TooltipHandler';
import { styles } from '../../utils/constants';

const ModeToggle = ({
    showConfBounds,
    onConfClick
}) => {
    const [ showTooltip, setShowTooltip ] = useState(false);

    const handleTooltipClick = useCallback(() => {
        setShowTooltip(!showTooltip);
    }, [ showTooltip ]);

    const value = showConfBounds ? "confidence" : "exceedance";

    return (
        <Fragment>
            <div className="param-header">
                MODE
                <TooltipHandler
                    showTooltip={showTooltip}
                    onClick={handleTooltipClick}>
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltip &&
                        <span className="tooltip-text">
                            In “Confidence Bounds” mode, you can see a time-averaged 
                            median line and 10-90% prediction interval ribbon for all 
                            model simulations overlaid in green on top of the individual simulations. 
                            <br /><br />
                            In “Threshold Exceedance” mode, you can use the Threshold and Date 
                            Threshold sliders to change values and dates to determine how likely 
                            a given indicator will exceed a certain threshold number by 
                            a given threshold date. Simulation curves that exceed the 
                            designated threshold will appear red, while the rest 
                            of the curves will be green.
                        </span>}
                    </div>
                </TooltipHandler>
            </div>
            <Radio.Group
                value={value}
                style={{ width: '70%', display: 'flex' }}
                onChange={onConfClick}>
                <Radio.Button
                    key="confidence"
                    style={styles.Radio}
                    value="confidence">
                    Confidence Bounds
                </Radio.Button>
                <Radio.Button
                    key="exceedance"
                    style={styles.Radio}
                    value="exceedance">
                    Threshold Exceedance
                </Radio.Button>
            </Radio.Group>
        </Fragment>
    );
};

ModeToggle.propTypes = {
    showConfBounds: PropTypes.bool.isRequired,
    onConfClick: PropTypes.func.isRequired,
};

export default ModeToggle;
