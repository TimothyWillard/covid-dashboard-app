import React, { useEffect, useRef, useState } from 'react';
import { InfoCircleTwoTone } from '@ant-design/icons';
import { getReadableDate } from '../../utils/utils';
import { timeDay }  from 'd3-time';
import TooltipHandler from '../Filters/TooltipHandler';
import PropTypes from 'prop-types';

const DateSlider = ({ dates, currentDateIndex, onMapSliderChange, onSliderMouseEvent }) => {
  const [ showTooltip, setShowTooltip ] = useState(false);
  const [ dateIndex, setDateIndex ] = useState('');
  const inputRef = useRef(null);

  function handleTooltipClick() {
    setShowTooltip(!showTooltip);
  }

  useEffect(() => {
    const dateIdx = (dates.length - 1).toString();
    setDateIndex(dateIdx);
    return () => {};
  }, [ dates ]);

  return (
    <div>
      <div className="param-header">DATE SELECTOR
        <TooltipHandler
          showTooltip={showTooltip}
          onClick={handleTooltipClick}>
          <div className="tooltip">
            &nbsp;<InfoCircleTwoTone />
            {showTooltip &&
            <span className="tooltip-text">
              Indicators are calculated after accounting for the appropriate 
              time delays and probabilities of transitioning into a given state 
              (e.g., initial infection to hospitalization). 
            </span> }
          </div>
        </TooltipHandler>
      </div>
      <div className="filter-label">
        <span className='callout'>
          {getReadableDate(dates[currentDateIndex])}
        </span>
      </div>
      <div className="slidecontainer">
        <input
          id="mapDateSlider"
          type="range"
          min={0}
          max={dateIndex.toString()}
          defaultValue={currentDateIndex.toString()}
          ref={inputRef}
          onChange={() => {onMapSliderChange(inputRef.current.value)}}
          onMouseDown={(e) => onSliderMouseEvent(e.type)}
          onMouseUp={(e) => onSliderMouseEvent(e.type)}>
        </input> 
        <div className="slider-label-row slider-label">
        <p className="filter-label callout">
          {/* {firstDateStr} */}
          {getReadableDate(dates[0])}
        </p>
        <p className="filter-label slider-max callout">
          {/* {lastDateStr} */}
          {getReadableDate(timeDay.offset(dates[dates.length - 1], -1))}
        </p>
      </div>
      </div>
    </div>
  );
};

DateSlider.propTypes = {
  dates: PropTypes.array.isRequired,
  currentDateIndex: PropTypes.string.isRequired,
  onMapSliderChange: PropTypes.func.isRequired,
  onSliderMouseEvent: PropTypes.func.isRequired
};

export default DateSlider;
