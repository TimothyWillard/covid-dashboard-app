import React, { Component } from 'react';
import { Radio } from 'antd';
import { InfoCircleTwoTone } from '@ant-design/icons';
import { styles } from '../../utils/constants';
import TooltipHandler from '../Filters/TooltipHandler';

const ScaleTypeEnum = {
    linear: 'linear',
    power: 'power'
};

class ScaleToggle extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showTooltip: false
        };
    }

    handleTooltipClick = () => {
        this.setState({ showTooltip: !this.state.showTooltip });
    }

    handleChange = (e) => {
        this.props.onScaleToggle(e.target.value);
    };

    render() {
        return (
            <div>
                <div className="param-header">Y-AXIS SCALE
                    <TooltipHandler
                        showTooltip={this.state.showTooltip}
                        onClick={this.handleTooltipClick}
                    >
                        <div className="tooltip">
                            &nbsp;<InfoCircleTwoTone />
                            {this.state.showTooltip &&
                                <span className="tooltip-text">
                                    Toggle between a linear scale or a power scale, 
                                    which reveals more granularity at lower levels.
                                </span>}
                        </div>
                    </TooltipHandler>
                </div>
                <Radio.Group
                    value={this.props.scale}
                    style={styles.Selector}
                    onChange={this.handleChange}>
                    <Radio.Button value={ScaleTypeEnum.linear}>Linear</Radio.Button>
                    <Radio.Button value={ScaleTypeEnum.power}>Power</Radio.Button>
                </Radio.Group>
            </div>
        );
    }
}

export default ScaleToggle;
