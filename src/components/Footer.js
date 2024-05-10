import React from 'react';
import { Row, Col } from 'antd';
import { ReactComponent as Logo } from '../assets/logo-john-hopkins.svg';
import { styles } from '../utils/constants';

export default function Footer() {
  return (
    <div id="footer" className="App-header">
      <Row gutter={styles.gutter}>
        <Col className="gutter-row" span={6}>
          <Logo height="60" />
        </Col>
        <Col className="gutter-row" offset={14} span={4}>
          <div className="footer">© 2020 IDD Working Group</div>
        </Col>
      </Row>
    </div>
  )
}
