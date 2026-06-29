import { message } from '../lib/antdStatic'

export function useNotification() {
  return {
    success: (msg: string) => message.success(msg),
    error:   (msg: string) => message.error(msg),
    warning: (msg: string) => message.warning(msg),
  }
}
