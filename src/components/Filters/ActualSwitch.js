import React, { Component } from 'react';
import { Row, Switch } from 'antd';
import { InfoCircleTwoTone } from '@ant-design/icons';
import TooltipHandler from './TooltipHandler';
import { styles } from '../../utils/constants';

class ActualSwitch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showTooltip: false
        };
    }

    handleTooltipClick = () => {
        this.setState({ showTooltip: !this.state.showTooltip });
    };

    render() {
        const { showActual, actualList } = this.props;
        // assumes ground truth data exists for all scenarios if it exists for one
        const isDisabled = actualList[0].length === 0;
        return (
            <Row gutter={styles.gutter} style={styles.Switch}>
                <Switch
                    style={{ marginTop: '0.1rem' }}
                    checked={showActual}
                    onChange={this.props.onChange}
                    disabled={isDisabled}
                    size="small"
                />
                <div className="upload-toggle">REPORTED DATA
                    <TooltipHandler
                        showTooltip={this.state.showTooltip}
                        onClick={this.handleTooltipClick}
                    >
                        <div className="tooltip">
                            &nbsp;<InfoCircleTwoTone />
                            {this.state.showTooltip &&
                                <span className="tooltip-text">
                                    Daily reported confirmed cases and deaths are from USA Facts.
                                    If the toggle is disabled, then data is unavailable for the selected indicator.
                                </span>}
                        </div>
                    </TooltipHandler>
                </div>
            </Row>
        );
    }
}

export default ActualSwitch;
