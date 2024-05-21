import React, { useCallback, useState } from 'react';
import { DatePicker } from 'antd';
import { InfoCircleTwoTone } from '@ant-design/icons';
import PropTypes from 'prop-types';

import TooltipHandler from '../Filters/TooltipHandler';

import { styles } from '../../utils/constants';

const { RangePicker } = DatePicker

const ChartRangePicker = ({ firstDate, lastDate, onHandleSummaryDates, onHandleDatePicker }) => {
    const [ showTooltip, setShowTooltip ] = useState(false);

    const handleTooltipClick = useCallback(() => {
        setShowTooltip(!showTooltip);
    }, [ showTooltip ]);

    const handleChange = useCallback((dates) => {
        let start;
        let end;
        if (dates) {
            start = dates[0]._d;
            end = dates[1]._d;
        } else {
            start = new Date();
            end = new Date();
            end.setDate(end.getDate() - 14);
        }
        onHandleSummaryDates(start, end);
    }, [ onHandleSummaryDates ]);

    const disabledDate = useCallback((dateMoment) => {
        // prevent user from selecting beyond modeled date range
        const date = dateMoment._d;
        return date < firstDate || date > lastDate;
    }, [ firstDate, lastDate ]);

    const handleOpen = useCallback((datePickerOpen) => {
        onHandleDatePicker(datePickerOpen)
    }, [ onHandleDatePicker ]);

    return (
        <div>
            <div className="param-header">
                DATE RANGE
                <TooltipHandler
                    showTooltip={showTooltip}
                    onClick={handleTooltipClick}>
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {showTooltip &&
                        <span className="tooltip-text">
                            Choose a date range across which to calculate and display aggregate statistics. 
                        </span>}
                    </div>
                </TooltipHandler>
            </div>
            <RangePicker
                disabledDate={disabledDate} 
                style={styles.Selector}
                // renderExtraFooter={() => "Select a summary period in weekly increments"}
                onChange={handleChange}
                onOpenChange={handleOpen}/>
        </div>
    );
};

ChartRangePicker.propTypes = {
    firstDate: PropTypes.instanceOf(Date), 
    lastDate: PropTypes.instanceOf(Date), 
    onHandleSummaryDates: PropTypes.func.isRequired,
    onHandleDatePicker: PropTypes.func.isRequired,
};

export default ChartRangePicker;
