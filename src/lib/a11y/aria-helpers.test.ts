/**
 * ARIA属性ヘルパー関数のテスト
 */

import {
  getExpandableProps,
  getDialogProps,
  getTabPanelProps,
  getTabProps,
  getMenuProps,
  getMenuItemProps,
  getTooltipProps,
  getAlertProps,
  getFieldProps,
  getTableProps,
  getProgressProps,
  getSearchProps,
  getListboxProps,
  getOptionProps,
  getLiveRegionProps,
  srOnly,
  srOnlyClass,
} from './aria-helpers'

describe('getExpandableProps', () => {
  it('展開時の正しいARIA属性を返す', () => {
    const props = getExpandableProps(true)
    expect(props).toEqual({
      'aria-expanded': true,
      'role': 'button',
      'tabIndex': 0,
    })
  })

  it('折りたたみ時の正しいARIA属性を返す', () => {
    const props = getExpandableProps(false)
    expect(props).toEqual({
      'aria-expanded': false,
      'role': 'button',
      'tabIndex': 0,
    })
  })
})

describe('getDialogProps', () => {
  it('開いているダイアログの属性を返す', () => {
    const props = getDialogProps(true, 'label-id', 'desc-id')
    expect(props).toEqual({
      'role': 'dialog',
      'aria-modal': true,
      'aria-labelledby': 'label-id',
      'aria-describedby': 'desc-id',
      'aria-hidden': false,
    })
  })

  it('閉じているダイアログの属性を返す', () => {
    const props = getDialogProps(false)
    expect(props).toEqual({
      'role': 'dialog',
      'aria-modal': true,
      'aria-labelledby': undefined,
      'aria-describedby': undefined,
      'aria-hidden': true,
    })
  })
})

describe('getTabPanelProps', () => {
  it('選択されたタブパネルの属性を返す', () => {
    const props = getTabPanelProps('panel-1', 'tab-1', true)
    expect(props).toEqual({
      'id': 'panel-1',
      'role': 'tabpanel',
      'aria-labelledby': 'tab-1',
      'tabIndex': 0,
      'hidden': false,
    })
  })

  it('選択されていないタブパネルの属性を返す', () => {
    const props = getTabPanelProps('panel-2', 'tab-2', false)
    expect(props).toEqual({
      'id': 'panel-2',
      'role': 'tabpanel',
      'aria-labelledby': 'tab-2',
      'tabIndex': -1,
      'hidden': true,
    })
  })
})

describe('getTabProps', () => {
  it('選択されたタブの属性を返す', () => {
    const props = getTabProps('tab-1', 'panel-1', true, 0)
    expect(props).toEqual({
      'id': 'tab-1',
      'role': 'tab',
      'aria-selected': true,
      'aria-controls': 'panel-1',
      'tabIndex': 0,
      'data-index': 0,
    })
  })

  it('選択されていないタブの属性を返す', () => {
    const props = getTabProps('tab-2', 'panel-2', false, 1)
    expect(props).toEqual({
      'id': 'tab-2',
      'role': 'tab',
      'aria-selected': false,
      'aria-controls': 'panel-2',
      'tabIndex': -1,
      'data-index': 1,
    })
  })
})

describe('getMenuProps', () => {
  it('開いているメニューの属性を返す', () => {
    const props = getMenuProps(true, 'button-1')
    expect(props).toEqual({
      'role': 'menu',
      'aria-orientation': 'vertical',
      'aria-labelledby': 'button-1',
      'aria-hidden': false,
    })
  })

  it('閉じているメニューの属性を返す', () => {
    const props = getMenuProps(false)
    expect(props).toEqual({
      'role': 'menu',
      'aria-orientation': 'vertical',
      'aria-labelledby': undefined,
      'aria-hidden': true,
    })
  })
})

describe('getMenuItemProps', () => {
  it('メニューアイテムの属性を返す', () => {
    const props = getMenuItemProps(2)
    expect(props).toEqual({
      'role': 'menuitem',
      'tabIndex': 0,
      'data-index': 2,
    })
  })
})

describe('getTooltipProps', () => {
  it('表示中のツールチップ属性を返す', () => {
    const props = getTooltipProps('tooltip-1', true)
    expect(props).toEqual({
      'id': 'tooltip-1',
      'role': 'tooltip',
      'aria-hidden': false,
    })
  })

  it('非表示のツールチップ属性を返す', () => {
    const props = getTooltipProps('tooltip-1', false)
    expect(props).toEqual({
      'id': 'tooltip-1',
      'role': 'tooltip',
      'aria-hidden': true,
    })
  })
})

describe('getAlertProps', () => {
  it('infoアラートの属性を返す', () => {
    const props = getAlertProps('info')
    expect(props).toEqual({
      'role': 'status',
      'aria-live': 'polite',
      'aria-atomic': true,
    })
  })

  it('warningアラートの属性を返す', () => {
    const props = getAlertProps('warning')
    expect(props).toEqual({
      'role': 'alert',
      'aria-live': 'assertive',
      'aria-atomic': true,
    })
  })

  it('errorアラートの属性を返す', () => {
    const props = getAlertProps('error')
    expect(props).toEqual({
      'role': 'alert',
      'aria-live': 'assertive',
      'aria-atomic': true,
    })
  })

  it('successアラートの属性を返す', () => {
    const props = getAlertProps('success')
    expect(props).toEqual({
      'role': 'status',
      'aria-live': 'polite',
      'aria-atomic': true,
    })
  })
})

describe('getFieldProps', () => {
  it('必須フィールドの属性を返す', () => {
    const props = getFieldProps('field-1', 'label-1', undefined, undefined, true, false)
    expect(props).toEqual({
      'id': 'field-1',
      'aria-labelledby': 'label-1',
      'aria-describedby': undefined,
      'aria-required': true,
      'aria-invalid': false,
    })
  })

  it('エラーのあるフィールドの属性を返す', () => {
    const props = getFieldProps('field-1', 'label-1', 'error-1', 'desc-1', false, true)
    expect(props).toEqual({
      'id': 'field-1',
      'aria-labelledby': 'label-1',
      'aria-describedby': 'desc-1 error-1',
      'aria-required': false,
      'aria-invalid': true,
    })
  })

  it('説明のみのフィールド属性を返す', () => {
    const props = getFieldProps('field-1', 'label-1', undefined, 'desc-1', false, false)
    expect(props).toEqual({
      'id': 'field-1',
      'aria-labelledby': 'label-1',
      'aria-describedby': 'desc-1',
      'aria-required': false,
      'aria-invalid': false,
    })
  })
})

describe('getTableProps', () => {
  it('キャプション付きテーブルの属性を返す', () => {
    const props = getTableProps('ユーザー一覧')
    expect(props).toEqual({
      'role': 'table',
      'aria-label': 'ユーザー一覧',
    })
  })

  it('キャプションなしテーブルの属性を返す', () => {
    const props = getTableProps()
    expect(props).toEqual({
      'role': 'table',
      'aria-label': undefined,
    })
  })
})

describe('getProgressProps', () => {
  it('プログレスバーの属性を返す', () => {
    const props = getProgressProps(50, 100, 'ダウンロード中')
    expect(props).toEqual({
      'role': 'progressbar',
      'aria-valuenow': 50,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-label': 'ダウンロード中',
      'aria-valuetext': '50%',
    })
  })

  it('デフォルトmax値でプログレスバーの属性を返す', () => {
    const props = getProgressProps(75)
    expect(props).toEqual({
      'role': 'progressbar',
      'aria-valuenow': 75,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-label': undefined,
      'aria-valuetext': '75%',
    })
  })
})

describe('getSearchProps', () => {
  it('検索入力フィールドの属性を返す', () => {
    const props = getSearchProps('search-1', 'results-1', 5)
    expect(props).toEqual({
      'id': 'search-1',
      'role': 'searchbox',
      'aria-controls': 'results-1',
      'aria-autocomplete': 'list',
      'aria-haspopup': 'listbox',
      'aria-expanded': true,
    })
  })

  it('結果なしの検索入力フィールド属性を返す', () => {
    const props = getSearchProps('search-1', 'results-1', 0)
    expect(props).toEqual({
      'id': 'search-1',
      'role': 'searchbox',
      'aria-controls': 'results-1',
      'aria-autocomplete': 'list',
      'aria-haspopup': 'listbox',
      'aria-expanded': false,
    })
  })
})

describe('getListboxProps', () => {
  it('単一選択リストボックスの属性を返す', () => {
    const props = getListboxProps('listbox-1', 'label-1', false)
    expect(props).toEqual({
      'id': 'listbox-1',
      'role': 'listbox',
      'aria-labelledby': 'label-1',
      'aria-multiselectable': false,
    })
  })

  it('複数選択リストボックスの属性を返す', () => {
    const props = getListboxProps('listbox-1', 'label-1', true)
    expect(props).toEqual({
      'id': 'listbox-1',
      'role': 'listbox',
      'aria-labelledby': 'label-1',
      'aria-multiselectable': true,
    })
  })
})

describe('getOptionProps', () => {
  it('選択されたオプションの属性を返す', () => {
    const props = getOptionProps('option-1', true, false, 0)
    expect(props).toEqual({
      'id': 'option-1',
      'role': 'option',
      'aria-selected': true,
      'aria-disabled': false,
      'tabIndex': 0,
      'data-index': 0,
    })
  })

  it('無効化されたオプションの属性を返す', () => {
    const props = getOptionProps('option-2', false, true, 1)
    expect(props).toEqual({
      'id': 'option-2',
      'role': 'option',
      'aria-selected': false,
      'aria-disabled': true,
      'tabIndex': -1,
      'data-index': 1,
    })
  })
})

describe('getLiveRegionProps', () => {
  it('politeライブリージョンの属性を返す', () => {
    const props = getLiveRegionProps('polite', true)
    expect(props).toEqual({
      'aria-live': 'polite',
      'aria-atomic': true,
      'role': 'status',
    })
  })

  it('assertiveライブリージョンの属性を返す', () => {
    const props = getLiveRegionProps('assertive', false)
    expect(props).toEqual({
      'aria-live': 'assertive',
      'aria-atomic': false,
      'role': 'status',
    })
  })

  it('デフォルト値でライブリージョンの属性を返す', () => {
    const props = getLiveRegionProps()
    expect(props).toEqual({
      'aria-live': 'polite',
      'aria-atomic': true,
      'role': 'status',
    })
  })
})

describe('srOnly', () => {
  it('スクリーンリーダー専用テキストの属性を返す', () => {
    const props = srOnly('メインメニュー')
    expect(props).toEqual({
      'className': 'sr-only',
      'children': 'メインメニュー',
    })
  })
})

describe('srOnlyClass', () => {
  it('sr-onlyクラス名を返す', () => {
    expect(srOnlyClass).toBe('sr-only')
  })
})
