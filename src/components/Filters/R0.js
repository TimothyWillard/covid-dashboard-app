import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import { min, max } from 'd3-array';
import { Button, Slider } from 'antd';
import { InfoCircleTwoTone } from '@ant-design/icons';

import TooltipHandler from './TooltipHandler';
import Histogram from './Histogram';
import { styles } from '../../utils/constants';

const R0 = ({
    r0full,
    r0selected,
    onR0Change,
    onR0Resample,
    allSims,
    selectedSims
}) => {
    const [ showTooltip, setShowTooltip ] = useState(false);

    const stepRef = useRef(0.1);

    const handleChange = useCallback((r0new) => {
        // prevent user from selecting no range
        const range = r0new[1] - r0new[0] < stepRef.current ? r0selected : r0new;
        onR0Change(range);
    }, [ r0selected, onR0Change, stepRef ]);

    const handleTooltipClick = useCallback(() => {
        setShowTooltip(!showTooltip);
    }, [ showTooltip ]);

    const showMarks = (min, max) => {
        return {
            [min]: {style: styles.Marks, label: [min]}, 
            [max]: {style: styles.Marks, label: [max]}
        }
    }

    const sortedSims = allSims.slice().sort((a,b) => a.r0 - b.r0);
    const r0min = min(sortedSims, d => d.r0);
    const r0max = max(sortedSims, d => d.r0);
    stepRef.current = (r0max - r0min) / 10;
    const minR0 = r0full[0], maxR0 = r0full[1];
    const activeMin = r0selected[0].toFixed(1);
    const activeMax = r0selected[1].toFixed(1);

    return (
        <div>
            <div className="param-header">
                REPRODUCTION NUMBER 
                <TooltipHandler
                    showTooltip={showTooltip}
                    onClick={handleTooltipClick}>
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltip &&
                        <span className="tooltip-text">
                            The reproduction number, or R<sub>0</sub>, indicates
                            the intensity of an infection and describes the
                            expected number of people directly infected by
                            one person. For example, a person with an infection
                            having an R<sub>0</sub> of 4 will transmit it to an
                            average of 4 other people. <br /><br />
                            The displayed simulation curves are only a sample of the
                            total simulation curves within the selected R<sub>0</sub>&nbsp;
                            range. Click the <b>resample</b> button to display 
                            a different sample set of simulation curves.
                        </span>}
                    </div>
                </TooltipHandler>
            </div>
            <div className="map-wrapper">
                <div className="r0-histogram">
                    <Histogram
                        allSims={allSims}
                        selectedSims={selectedSims}
                        sortedSims={sortedSims}
                        selected={r0selected}
                        r0min={r0min}
                        r0max={r0max}
                        height={25}
                        step={stepRef.current} />
                </div>
                <div className="filter-label">
                    <span className='callout r0-range'>
                        [{activeMin}-{activeMax}]
                    </span>
                </div>
            </div>
            <div className="map-wrapper">
                <div className="r0-slider" id="r0Slider">
                    <Slider
                        range
                        marks={showMarks(minR0, maxR0)}
                        min={minR0}
                        max={maxR0} 
                        step={stepRef.current}
                        included={true}
                        tooltipOpen={false}
                        defaultValue={r0selected}
                        value={r0selected}
                        onChange={handleChange} />
                </div>
                <div className="resample">
                    <Button 
                        type="dashed" 
                        size="small"
                        onClick={onR0Resample}>
                        Resample
                    </Button>
                </div>
            </div>
        </div>
    );
};

R0.propTypes = {
    r0full: PropTypes.array.isRequired,
    r0selected: PropTypes.array.isRequired,
    onR0Change: PropTypes.func.isRequired,
    onR0Resample: PropTypes.func.isRequired,
    allSims: PropTypes.array.isRequired,
    selectedSims: PropTypes.array.isRequired,
};

export default R0;
