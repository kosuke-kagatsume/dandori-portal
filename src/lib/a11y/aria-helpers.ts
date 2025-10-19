/**
 * ARIA属性ヘルパー関数
 *
 * アクセシビリティ向上のためのARIA属性を簡単に追加できるユーティリティ
 */

/**
 * 要素が展開/折りたたみ可能であることを示すARIA属性
 */
export function getExpandableProps(isExpanded: boolean) {
  return {
    'aria-expanded': isExpanded,
    role: 'button',
    tabIndex: 0,
  };
}

/**
 * モーダル・ダイアログ用のARIA属性
 */
export function getDialogProps(
  isOpen: boolean,
  labelId?: string,
  descriptionId?: string
) {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': labelId,
    'aria-describedby': descriptionId,
    'aria-hidden': !isOpen,
  };
}

/**
 * タブパネル用のARIA属性
 */
export function getTabPanelProps(
  id: string,
  tabId: string,
  isSelected: boolean
) {
  return {
    id,
    role: 'tabpanel',
    'aria-labelledby': tabId,
    tabIndex: isSelected ? 0 : -1,
    hidden: !isSelected,
  };
}

/**
 * タブボタン用のARIA属性
 */
export function getTabProps(
  id: string,
  panelId: string,
  isSelected: boolean,
  index: number
) {
  return {
    id,
    role: 'tab',
    'aria-selected': isSelected,
    'aria-controls': panelId,
    tabIndex: isSelected ? 0 : -1,
    'data-index': index,
  };
}

/**
 * ドロップダウンメニュー用のARIA属性
 */
export function getMenuProps(isOpen: boolean, buttonId?: string) {
  return {
    role: 'menu',
    'aria-orientation': 'vertical' as const,
    'aria-labelledby': buttonId,
    'aria-hidden': !isOpen,
  };
}

/**
 * メニューアイテム用のARIA属性
 */
export function getMenuItemProps(index: number) {
  return {
    role: 'menuitem',
    tabIndex: 0,
    'data-index': index,
  };
}

/**
 * ツールチップ用のARIA属性
 */
export function getTooltipProps(id: string, isVisible: boolean) {
  return {
    id,
    role: 'tooltip',
    'aria-hidden': !isVisible,
  };
}

/**
 * アラート用のARIA属性
 */
export function getAlertProps(type: 'info' | 'warning' | 'error' | 'success') {
  const roleMap = {
    info: 'status',
    warning: 'alert',
    error: 'alert',
    success: 'status',
  } as const;

  const ariaLiveMap = {
    info: 'polite',
    warning: 'assertive',
    error: 'assertive',
    success: 'polite',
  } as const;

  return {
    role: roleMap[type],
    'aria-live': ariaLiveMap[type],
    'aria-atomic': true,
  };
}

/**
 * フォームフィールド用のARIA属性
 */
export function getFieldProps(
  id: string,
  labelId?: string,
  errorId?: string,
  descriptionId?: string,
  isRequired = false,
  isInvalid = false
) {
  return {
    id,
    'aria-labelledby': labelId,
    'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
    'aria-required': isRequired,
    'aria-invalid': isInvalid,
  };
}

/**
 * テーブル用のARIA属性
 */
export function getTableProps(caption?: string) {
  return {
    role: 'table',
    'aria-label': caption,
  };
}

/**
 * プログレスバー用のARIA属性
 */
export function getProgressProps(
  value: number,
  max = 100,
  label?: string
) {
  return {
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-label': label,
    'aria-valuetext': `${value}%`,
  };
}

/**
 * 検索入力フィールド用のARIA属性
 */
export function getSearchProps(
  id: string,
  resultsId?: string,
  resultCount?: number
) {
  return {
    id,
    role: 'searchbox',
    'aria-controls': resultsId,
    'aria-autocomplete': 'list' as const,
    'aria-haspopup': 'listbox' as const,
    'aria-expanded': resultCount !== undefined && resultCount > 0,
  };
}

/**
 * リストボックス用のARIA属性
 */
export function getListboxProps(
  id: string,
  labelId?: string,
  isMultiselectable = false
) {
  return {
    id,
    role: 'listbox',
    'aria-labelledby': labelId,
    'aria-multiselectable': isMultiselectable,
  };
}

/**
 * リストボックスオプション用のARIA属性
 */
export function getOptionProps(
  id: string,
  isSelected: boolean,
  isDisabled = false,
  index: number
) {
  return {
    id,
    role: 'option',
    'aria-selected': isSelected,
    'aria-disabled': isDisabled,
    tabIndex: isDisabled ? -1 : 0,
    'data-index': index,
  };
}

/**
 * スクリーンリーダー専用テキスト用のクラス
 */
export const srOnlyClass = 'sr-only';

/**
 * スクリーンリーダー専用テキストを生成
 */
export function srOnly(text: string) {
  return {
    className: srOnlyClass,
    children: text,
  };
}

/**
 * ライブリージョン用のARIA属性
 * 動的に変更されるコンテンツをスクリーンリーダーに通知
 */
export function getLiveRegionProps(
  level: 'polite' | 'assertive' = 'polite',
  atomic = true
) {
  return {
    'aria-live': level,
    'aria-atomic': atomic,
    role: 'status',
  };
}
