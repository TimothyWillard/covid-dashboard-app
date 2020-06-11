import React, { Component, Fragment } from 'react';
import { Radio } from 'antd';
import TooltipHandler from '../Filters/TooltipHandler';
import { styles } from '../../utils/constants';

class Switch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showTooltip: false
        }
    }

    handleTooltipClick = () => {
        this.setState({showTooltip: !this.state.showTooltip})
    }

    render() {
        const value = this.props.showConfBounds ? "confidence" : "exceedence";
        return (  
            <Fragment>
                <div className="param-header">MODE
                    <TooltipHandler
                        showTooltip={this.state.showTooltip}
                        onClick={this.handleTooltipClick}
                        >
                        <div className="tooltip">&nbsp;&#9432;
                            {this.state.showTooltip ?
                            <span className="tooltip-text">
                                The Threshold Exceedence mode allows you to interact
                                with the model simulation curves by sliding the 
                                threshold sliders below to determine 
                                how likely an indicator will exceed a certain number
                                by a certain date. Simulation curves that exceed the
                                designated threshold will appear red, while the 
                                rest of the curves will be green. <br />
                                The Confidence Bounds mode displays the 10%, 50%, 
                                and 90% confidence intervals based on all 
                                model simulations.
                            </span> 
                            : null}
                        </div>
                    </TooltipHandler>
                </div>
                <Radio.Group
                    value={value}
                    style={{ width: '70%', display: 'flex' }}
                    onChange={this.props.onConfClick}>
                    <Radio.Button
                        key="exceedence" 
                        style={styles.Switch}
                        value="exceedence">
                        Threshold Exceedence
                    </Radio.Button>
                    <Radio.Button
                        key="confidence"
                        style={styles.Switch}
                        value="confidence">
                        Confidence Bounds
                    </Radio.Button>
                </Radio.Group> 
            </Fragment>  
        )
    }
}

export default Switch