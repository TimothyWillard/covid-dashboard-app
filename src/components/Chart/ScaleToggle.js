import React, { useState, useCallback } from 'react';
import { Radio } from 'antd';
import { InfoCircleTwoTone } from '@ant-design/icons';
import PropTypes from 'prop-types';

import TooltipHandler from '../Filters/TooltipHandler';

import { styles } from '../../utils/constants';

const ScaleTypeEnum = {
    linear: 'linear',
    power: 'power'
};

const ScaleToggle = ({ scale, onScaleToggle }) => {
    const [ showTooltip, setShowTooltip ] = useState(false);

    const handleTooltipClick = useCallback(() => {
        setShowTooltip(!showTooltip);
    }, [ showTooltip ]);

    const handleScaleChange = useCallback((event) => {
        onScaleToggle(event.target.value);
    }, [ onScaleToggle ]);

    return (
        <div>
            <div className="param-header">
                Y-AXIS SCALE
                <TooltipHandler
                    showTooltip={showTooltip}
                    onClick={handleTooltipClick}>
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltip &&
                        <span className="tooltip-text">
                            Toggle between a linear scale or a power scale, 
                            which reveals more granularity at lower levels.
                        </span>}
                    </div>
                </TooltipHandler>
            </div>
            <Radio.Group
                value={scale}
                style={styles.Selector}
                onChange={handleScaleChange}>
                <Radio.Button value={ScaleTypeEnum.linear}>Linear</Radio.Button>
                <Radio.Button value={ScaleTypeEnum.power}>Power</Radio.Button>
            </Radio.Group>
        </div>
    );
};

ScaleToggle.propTypes = {
    scale: PropTypes.string.isRequired,
    onScaleToggle: PropTypes.func.isRequired,
};

export default ScaleToggle;
