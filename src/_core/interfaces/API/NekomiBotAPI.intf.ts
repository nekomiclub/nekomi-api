export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  url?: string | undefined;
  callback_data?: string | undefined;
  web_app?: null;
  login_url?: null | undefined;
  switch_inline_query?: string | undefined;
  switch_inline_query_current_chat?: string | undefined;
  callback_game?: null | undefined;
  pay?: boolean | undefined;
}

export interface NekomiBot_PostBroadcast {
  message: string
  audience: number[]

  photo?: string
  replyMarkup?: InlineKeyboardMarkup
}