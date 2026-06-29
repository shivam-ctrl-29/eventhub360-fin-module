import { App as AntApp } from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'
import type { ModalStaticFunctions } from 'antd/es/modal/confirm'
import { useEffect } from 'react'

// Context-aware antd message/modal instances captured from <App>.
// This lets us call message.* / modal.* from anywhere (incl. non-component code)
// while still consuming the ConfigProvider theme — clearing antd's
// "Static function can not consume context" warning under React 19.

let _message: MessageInstance | null = null
let _modal: Omit<ModalStaticFunctions, 'warn'> | null = null

export const message = {
  success: (...a: Parameters<MessageInstance['success']>) => _message?.success(...a),
  error: (...a: Parameters<MessageInstance['error']>) => _message?.error(...a),
  info: (...a: Parameters<MessageInstance['info']>) => _message?.info(...a),
  warning: (...a: Parameters<MessageInstance['warning']>) => _message?.warning(...a),
  loading: (...a: Parameters<MessageInstance['loading']>) => _message?.loading(...a),
}

export const modal = {
  confirm: (...a: Parameters<ModalStaticFunctions['confirm']>) => _modal?.confirm(...a),
  info: (...a: Parameters<ModalStaticFunctions['info']>) => _modal?.info(...a),
  success: (...a: Parameters<ModalStaticFunctions['success']>) => _modal?.success(...a),
  error: (...a: Parameters<ModalStaticFunctions['error']>) => _modal?.error(...a),
  warning: (...a: Parameters<ModalStaticFunctions['warning']>) => _modal?.warning(...a),
}

/** Mount once inside <App> to wire the context instances into the holders above. */
export function AntdStaticBridge() {
  const staticApi = AntApp.useApp()
  useEffect(() => {
    _message = staticApi.message
    _modal = staticApi.modal
  }, [staticApi])
  return null
}
