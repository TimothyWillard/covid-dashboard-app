import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Switch } from 'antd';
import { InfoCircleTwoTone } from '@ant-design/icons';

import TooltipHandler from './TooltipHandler';
import { styles } from '../../utils/constants';

const ActualSwitch = ({ showActual, actualList, onChange }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleTooltipClick = () => {
        setShowTooltip(!showTooltip);
    };

    // assumes ground truth data exists for all scenarios if it exists for one
    const isDisabled = actualList[0].length === 0;

    return (
        <Row gutter={styles.gutter} style={styles.Switch}>
            <Switch
                style={{ marginTop: '0.1rem' }}
                checked={showActual}
                onChange={onChange}
                disabled={isDisabled}
                size="small"
            />
            <div className="upload-toggle">REPORTED DATA
                <TooltipHandler
                    showTooltip={showTooltip}
                    onClick={handleTooltipClick}
                >
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltip &&
                            <span className="tooltip-text">
                                Daily reported confirmed cases and deaths are from USA Facts.
                                If the toggle is disabled, then data is unavailable for the selected indicator.
                            </span>}
                    </div>
                </TooltipHandler>
            </div>
        </Row>
    );
};

ActualSwitch.propTypes = {
    showActual: PropTypes.bool.isRequired,
    actualList: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
}

export default ActualSwitch;
