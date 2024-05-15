import React, { useCallback } from 'react';
import { Col, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types'

import { validateSize, validateJson } from '../../utils/utils';

const FileUploader = ({ onUpload }) => {
    const beforeUpload = useCallback((file) => {
        const reader = new FileReader();
        if (validateSize(file)) {
            reader.onload = () => {
                if (typeof reader.result === "string") {
                    const json = JSON.parse(reader.result);
                    const geoid = file.name.replace('.json', '');
                    if (validateJson(json)) {
                        onUpload(json, geoid);
                    }
                }
            };
            reader.readAsText(file);
            // Prevent upload
            return false;
        }
    }, [ onUpload ]);

    return (
        <Col className="gutter-row" span={6}>
            <Upload
                accept=".json"
                beforeUpload={beforeUpload}>
                <Button>
                    <UploadOutlined /> Click to Upload
                </Button>
            </Upload>
        </Col>
    );
};

FileUploader.propTypes = {
    onUpload: PropTypes.func.isRequired,
}

export default FileUploader;
