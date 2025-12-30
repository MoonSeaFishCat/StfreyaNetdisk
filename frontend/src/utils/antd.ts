import { MessageInstance } from 'antd/es/message/interface';
import { NotificationInstance } from 'antd/es/notification/interface';
import { ModalStaticFunctions } from 'antd/es/modal/confirm';

let message: MessageInstance;
let notification: NotificationInstance;
let modal: Omit<ModalStaticFunctions, 'warn'>;

export default {
  get message() {
    return message;
  },
  set message(instance: MessageInstance) {
    message = instance;
  },
  get notification() {
    return notification;
  },
  set notification(instance: NotificationInstance) {
    notification = instance;
  },
  get modal() {
    return modal;
  },
  set modal(instance: Omit<ModalStaticFunctions, 'warn'>) {
    modal = instance;
  },
};
