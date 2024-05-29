import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import { InfoCircleTwoTone } from '@ant-design/icons';
import { timeFormat } from 'd3-time-format';
import { timeDay }  from 'd3-time';

import TooltipHandler from './TooltipHandler';
import { styles } from '../../utils/constants';
import { addCommas, getStepValue } from '../../utils/utils';

const getDate = timeFormat('%b %d, %Y');
const getMonth = timeFormat('%b %d');

const Sliders = ({
    seriesMax,
    indicator,
    indicatorThreshold,
    selectedDates,
    dateThreshold,
    dateThresholdIdx,
    dateRange,
    showConfBounds,
    onStatSliderChange,
    onDateSliderChange,
    onSliderMouseEvent
}) => {
    const [ showTooltipThreshold, setShowTooltipThreshold ] = useState(false);
    const [ showTooltipDateThreshold, setShowTooltipDateThreshold ] = useState(false);

    const statInputRef = useRef(null);
    const dateInputRef = useRef(null);

    const handleStatChange = useCallback(() => {
        if (statInputRef) {
            onStatSliderChange(statInputRef.current.value);
        }
    }, [ onStatSliderChange, statInputRef ])

    const handleDateChange = useCallback(() => {
        if (dateInputRef) {
            onDateSliderChange(selectedDates[dateInputRef.current.value]);
        }
    }, [ selectedDates, onDateSliderChange, dateInputRef ]);

    const handleStatMouseEvent = useCallback((e) => {
        onSliderMouseEvent(e.type, 'indicator', 'graph');
    }, [ onSliderMouseEvent ]);

    const handleDateMouseEvent = useCallback((e) => {
        onSliderMouseEvent(e.type, 'date', 'graph')
    }, [ onSliderMouseEvent ]);

    const handleTooltipClickThresh = useCallback(() => {
        setShowTooltipThreshold(!showTooltipThreshold);
    }, [ showTooltipThreshold ]);

    const handleTooltipClickDate = useCallback(() => {
        setShowTooltipDateThreshold(!showTooltipDateThreshold);
    }, [ showTooltipDateThreshold ]);

    // let dateIdx = '150';
    let stepVal = 0;
    let val = addCommas(indicatorThreshold.toString());
    if (seriesMax && indicatorThreshold) {
        stepVal = getStepValue(seriesMax);
        const roundedStat = Math.ceil(indicatorThreshold / stepVal) * stepVal;
        val = addCommas(roundedStat);
    }
    const isDisabled = showConfBounds ? "disabled" : "";

    return (
        <div className={`slider-menu`}>
            {/* Indicator Threshold */}
            <div className="param-header">
                THRESHOLD
                <TooltipHandler
                    showTooltip={showTooltipThreshold}
                    onClick={handleTooltipClickThresh}>
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltipThreshold &&
                        <span className="tooltip-text">
                            This is the Threshold value used for the display in “Threshold Exceedance” mode. 
                            You will not be able to modify this slider when in “Confidence Bounds” mode.
                        </span>}
                    </div>
                </TooltipHandler>
            </div>
            <div className="filter-label">
                <span className='callout'>
                    {val}&nbsp;{indicator.name}
                </span>
            </div>
            <input
                id="indicatorThreshold"
                type="range"
                min="0"
                max={seriesMax.toString()}
                value={indicatorThreshold.toString()}
                step={stepVal}
                style={styles.Selector}
                ref={statInputRef}
                disabled={isDisabled}
                onChange={handleStatChange}
                onMouseDown={handleStatMouseEvent}
                onMouseUp={handleStatMouseEvent}>
            </input> 
            <div className="slider-label-row slider-label" style={styles.Selector}>
                <p className="filter-label callout">0</p>
                <p className="filter-label slider-max callout">
                    {addCommas(seriesMax)}
                </p>
            </div>

            {/* Date Threshold */}
            <div className="param-header" style={{ marginTop: '0.5rem'}}>DATE THRESHOLD
                <TooltipHandler
                    showTooltip={showTooltipDateThreshold}
                    onClick={handleTooltipClickDate}>
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltipDateThreshold &&
                        <span className="tooltip-text">
                            This is the Date Threshold used for the display in “Threshold Exceedance” mod
                            You will not be able to modify this slider when in “Confidence Bounds” mode.
                        </span> }
                    </div>
                </TooltipHandler>
            </div>
            <div className="filter-label">
                <span className='callout'>{getDate(dateThreshold)}</span>
            </div>
            <input
                id="dateThreshold"
                className="slider"
                type="range"
                min="0"
                max={selectedDates.length.toString()-1}
                value={dateThresholdIdx}
                style={styles.Selector}
                ref={dateInputRef}
                disabled={isDisabled}
                onChange={handleDateChange}
                onMouseDown={handleDateMouseEvent}
                onMouseUp={handleDateMouseEvent}>
            </input>
            <div className="slider-label-row slider-label" style={styles.Selector}>
                <p className="filter-label callout">
                    {getMonth(dateRange[0])}
                </p>
                <p className="filter-label slider-max callout">
                    {getMonth(timeDay.offset(dateRange[1], -1))}
                </p>
            </div>
        </div>
    );
};

Sliders.propTypes = {
    seriesMax: PropTypes.number.isRequired,
    indicator: PropTypes.object.isRequired,
    indicatorThreshold: PropTypes.number.isRequired,
    selectedDates: PropTypes.array.isRequired,
    dateThreshold: PropTypes.instanceOf(Date).isRequired,
    dateThresholdIdx: PropTypes.number,
    dateRange: PropTypes.array.isRequired,
    showConfBounds: PropTypes.bool.isRequired,
    onStatSliderChange: PropTypes.func.isRequired,
    onDateSliderChange: PropTypes.func.isRequired,
    onSliderMouseEvent: PropTypes.func.isRequired,
};

export default Sliders;
