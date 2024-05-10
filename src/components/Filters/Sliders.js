import React, { Component, useState, useRef } from 'react';
import { InfoCircleTwoTone } from '@ant-design/icons';
import TooltipHandler from '../Filters/TooltipHandler';
import { addCommas } from '../../utils/utils.js';
import { timeFormat } from 'd3-time-format';
import { timeDay }  from 'd3-time';
import { styles } from '../../utils/constants';
import { getStepValue } from '../../utils/utils';

const getDate = timeFormat('%b %d, %Y');
const getMonth = timeFormat('%b %d');

{/* <Sliders 
                                indicator={this.state.indicator}
                                selectedDates={this.state.selectedDates}
                                seriesMax={this.state.seriesMax}
                                showConfBounds={this.state.showConfBounds}
                                indicatorThreshold={this.state.indicatorThreshold}
                                dateThreshold={this.state.dateThreshold}
                                dateThresholdIdx={this.state.dateThresholdIdx}
                                dateRange={this.state.dateRange}
                                onStatSliderChange={this.handleStatSliderChange}
                                onDateSliderChange={this.handleDateSliderChange}
                                onSliderMouseEvent={this.handleSliderMouseEvent} /> */}

export default function Sliders({ 
    indicator, 
    selectedDates, 
    seriesMax, 
    showConfBounds, 
    indicatorThreshold, 
    dateThreshold, 
    dateThresholdIdx, 
    dateRange, 
    onStatSliderChange, 
    onDateSliderChange, 
    onSliderMouseEvent 
}) {
    const [ showTooltipThreshold, setShowTooltipThreshold ] = useState(false);
    const [ showTooltipDateThreshold, setShowTooltipDateThreshold ] = useState(false);
    // const [ dateIdx, setDateIdx ] = useState("150");
    // const [ val, setVal ] = useState(indicatorThreshold);
    let thresholdRef = useRef(indicatorThreshold);
    let dateRef = useRef(dateThreshold);

    function handleStatChange(i) {
        onStatSliderChange(i);
    }

    function handleDateChange(e) {
        const selectedDate = selectedDates[e];
        onDateSliderChange(selectedDate);
    }

    function handleStatMouseEvent(e) {
        onSliderMouseEvent(e.type, 'indicator', 'graph')
    }

    function handleDateMouseEvent(e) {
        onSliderMouseEvent(e.type, 'date', 'graph')
    }

    function handleTooltipClickThresh() {
        setShowTooltipThreshold(!showTooltipThreshold)
    }

    function handleTooltipClickDate() {
        setShowTooltipDateThreshold(!showTooltipDateThreshold)
    }

    const isDisabled = showConfBounds ? "disabled" : "";
    const valFormatted = addCommas(indicatorThreshold.toString());
    const stepVal = getStepValue(seriesMax);
    
    return (
        <div className={`slider-menu`}>
            {/* Indicator Threshold */}
            <div className="param-header">THRESHOLD
                <TooltipHandler
                    showTooltip={showTooltipThreshold}
                    onClick={handleTooltipClickThresh}
                    >
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltipThreshold &&
                        <span className="tooltip-text">
                        This is the Threshold value used for the display in “Threshold Exceedance” mode. 
                        You will not be able to modify this slider when in “Confidence Bounds” mode.
                        </span> }
                    </div>
                </TooltipHandler>
            </div>
            <div className="filter-label">
                <span className='callout'>
                    {valFormatted}&nbsp;{indicator.name}
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
                // ref={ref => statInput = ref}
                disabled={isDisabled}
                onChange={() => {handleStatChange(thresholdRef)}}
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
                    onClick={handleTooltipClickDate}
                    >
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
                // ref={ref => dateInput = ref}
                disabled={isDisabled}
                onChange={() => {handleDateChange(dateRef)}}
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
}
