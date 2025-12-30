import React from 'react';
import { App } from 'antd';
import antdGlobal from '../utils/antd';

const AntdGlobal: React.FC = () => {
  const { message, notification, modal } = App.useApp();

  antdGlobal.message = message;
  antdGlobal.notification = notification;
  antdGlobal.modal = modal;

  return null;
};

export default AntdGlobal;
