import React, { Component } from 'react';
import { InfoCircleTwoTone } from '@ant-design/icons';
import TooltipHandler from '../Filters/TooltipHandler';
import { addCommas, getReadableDate, getStepValue } from '../../utils/utils';
import { getClassForActiveState, LabelClassNameEnum } from "../../utils/typeUtils";

class ThresholdLabel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showTooltip: false,
            chance: Math.round(100 * props.percExceedence),
            val: addCommas(Math.ceil(props.indicatorThreshold / getStepValue(props.seriesMax)) * getStepValue(props.seriesMax)),
            date: getReadableDate(props.dateThreshold),
            activeClass: LabelClassNameEnum.boldUnderline,
            statClass: LabelClassNameEnum.boldUnderline,
            dateClass: LabelClassNameEnum.boldUnderline
        }
    }

    componentDidUpdate(prevProps) {
        const { percExceedence, indicatorThreshold, dateThreshold, statSliderActive, dateSliderActive, seriesMax } = this.props;

        if (percExceedence !== prevProps.percExceedence) {
            this.setState({ chance: Math.round(100 * percExceedence) });
        }
        if (indicatorThreshold !== prevProps.indicatorThreshold) {
            const stepVal = getStepValue(seriesMax);
            const roundedStat = Math.ceil(indicatorThreshold / stepVal) * stepVal;
            this.setState({ val: addCommas(roundedStat) });
        }
        if (dateThreshold !== prevProps.dateThreshold) {
            this.setState({ date: getReadableDate(dateThreshold) });
        }
        if (statSliderActive !== prevProps.statSliderActive || dateSliderActive !== prevProps.dateSliderActive) {
            this.setState({
                activeClass: getClassForActiveState(statSliderActive || dateSliderActive),
                statClass: getClassForActiveState(statSliderActive),
                dateClass: getClassForActiveState(dateSliderActive),
            });
        }
    }

    handleTooltipClick = () => {
        this.setState({ showTooltip: !this.state.showTooltip });
    }

    render() {
        const { chance, val, date, activeClass, statClass, dateClass } = this.state;

        return (
            <div className={`${this.props.classProps} desktop-only`}>
                <span className={activeClass}>{chance}%</span>
                &nbsp;{`of simulations shown predict daily ${this.props.label} to exceed`}&nbsp;
                <span className={statClass}>{val}</span>
                &nbsp;by&nbsp;
                <span className={dateClass}>{date}</span>
                <TooltipHandler
                    showTooltip={this.state.showTooltip}
                    onClick={this.handleTooltipClick}
                    >
                    <div className="tooltip">
                        &nbsp;<InfoCircleTwoTone />
                        {this.state.showTooltip &&
                        <span className="tooltip-text">
                            This percentage is calculated only for model simulations that 
                            meet the criteria specified in the control panel. 
                            Modify the Threshold and Date Threshold sliders in 
                            “Threshold Exceedance” mode to see how this percentage changes.
                        </span> }
                    </div>
                </TooltipHandler>
            </div>
        )
    }
}

export default ThresholdLabel;
