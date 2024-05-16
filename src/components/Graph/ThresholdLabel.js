import React, { useState } from 'react';
import { InfoCircleTwoTone } from '@ant-design/icons';
import PropTypes from 'prop-types';

import TooltipHandler from '../Filters/TooltipHandler';
import { addCommas, getReadableDate, getStepValue } from '../../utils/utils';
import { getClassForActiveState } from "../../utils/typeUtils";

const ThresholdLabel = ({ classProps, indicatorThreshold, seriesMax, dateThreshold, percExceedence, label, statSliderActive, dateSliderActive }) => {
    const [ showTooltip, setShowTooltip ] = useState(false);
    
    const handleTooltipClick = () => {
        setShowTooltip(!showTooltip);
    }

    const activeClass = getClassForActiveState(statSliderActive || dateSliderActive);
    const dateClass = getClassForActiveState(dateSliderActive);
    const statClass = getClassForActiveState(statSliderActive);
    const chance = Math.round(100 * percExceedence);

    const stepVal = getStepValue(seriesMax);
    const roundedStat = Math.ceil(indicatorThreshold / stepVal) * stepVal;
    const val = addCommas(roundedStat);
    const date = getReadableDate(dateThreshold);

    return (
        <div className={`${classProps} desktop-only`}>
            <span className={activeClass}>{chance}%</span>
            &nbsp;{`of simulations shown predict daily ${label} to exceed`}&nbsp;
            <span className={statClass}>{val}</span>
            &nbsp;by&nbsp;
            <span className={dateClass}>{date}</span>
            <TooltipHandler
                showTooltip={showTooltip}
                onClick={handleTooltipClick}
                >
                <div className="tooltip">
                    &nbsp;<InfoCircleTwoTone />
                    {showTooltip &&
                    <span className="tooltip-text">
                        This percentage is calculated only for model simulations that 
                        meet the criteria specified in the control panel. 
                        Modify the Threshold and Date Threshold sliders in 
                        “Threshold Exceedance” mode to see how this percentage changes.
                    </span> }
                </div>
            </TooltipHandler>
        </div>
    );
};

ThresholdLabel.propTypes = {
    classProps: PropTypes.string.isRequired,
    indicatorThreshold: PropTypes.number.isRequired,
    seriesMax: PropTypes.number.isRequired,
    dateThreshold: PropTypes.instanceOf(Date).isRequired,
    percExceedence: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
    statSliderActive: PropTypes.bool.isRequired,
    dateSliderActive: PropTypes.bool.isRequired,
};

export default ThresholdLabel;
