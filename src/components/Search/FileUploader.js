import React, { Component } from 'react';
import { Col, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import { validateSize, validateJson } from '../../utils/utils';

class FileUploader extends Component {

    beforeUpload = (file) => {
        const reader = new FileReader();
        if (validateSize(file)) {
            reader.onload = () => {
                if (typeof reader.result === "string") {
                    const json = JSON.parse(reader.result);
                    const geoid = file.name.replace('.json', '');

                    if (validateJson(json)) {
                        this.props.onUpload(json, geoid);
                    }
                }
            };
            reader.readAsText(file);

            // Prevent upload
            return false;
        }
    };

    render() {
        return (
            <Col className="gutter-row" span={6}>
                <Upload
                    accept=".json"
                    beforeUpload={this.beforeUpload}>
                    <Button>
                        <UploadOutlined /> Click to Upload
                    </Button>
                </Upload>
            </Col>
        )
    }
}

export default FileUploader;
