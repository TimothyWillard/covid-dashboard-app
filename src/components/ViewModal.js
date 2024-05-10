import React from 'react';
import { Modal } from 'antd';

export default function ViewModal(prop) {
  return (
    <Modal
      title={prop.modalTitle}
      open={prop.modalVisible}
      onCancel={prop.onCancel}
      footer={null}
      getContainer={prop.modalContainer}
      centered={true}
    >
      {prop.modalText}
    </Modal>
  )
}
