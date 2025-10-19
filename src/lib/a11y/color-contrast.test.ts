/**
 * カラーコントラストチェッカーのテスト
 */

import {
  getContrastRatio,
  meetsWCAG_AA,
  meetsWCAG_AAA,
  getContrastInfo,
} from './color-contrast'

describe('getContrastRatio', () => {
  it('白と黒の最大コントラスト比を計算する', () => {
    const ratio = getContrastRatio('#ffffff', '#000000')
    expect(ratio).toBeCloseTo(21, 1)
  })

  it('同じ色のコントラスト比は1である', () => {
    const ratio = getContrastRatio('#ff0000', '#ff0000')
    expect(ratio).toBeCloseTo(1, 1)
  })

  it('グレーのコントラスト比を計算する', () => {
    const ratio = getContrastRatio('#ffffff', '#767676')
    expect(ratio).toBeCloseTo(4.54, 1)
  })

  it('#なしのHex色を処理できる', () => {
    const ratio = getContrastRatio('ffffff', '000000')
    expect(ratio).toBeCloseTo(21, 1)
  })

  it('無効な色でエラーを投げる', () => {
    expect(() => getContrastRatio('invalid', '#000000')).toThrow('Invalid color format')
  })

  it('3桁の短縮形Hex色は無効な色としてエラーを投げる', () => {
    // 3桁の短縮形は対応していない
    expect(() => getContrastRatio('#fff', '#000')).toThrow('Invalid color format')
  })
})

describe('meetsWCAG_AA', () => {
  describe('通常テキスト', () => {
    it('4.5:1以上のコントラストでtrueを返す', () => {
      // 白背景に濃いグレーテキスト（約4.54:1）
      expect(meetsWCAG_AA('#767676', '#ffffff', false)).toBe(true)
    })

    it('4.5:1未満のコントラストでfalseを返す', () => {
      // 白背景に薄いグレーテキスト（約3:1）
      expect(meetsWCAG_AA('#959595', '#ffffff', false)).toBe(false)
    })

    it('黒背景に白テキストでtrueを返す', () => {
      expect(meetsWCAG_AA('#ffffff', '#000000', false)).toBe(true)
    })
  })

  describe('大きなテキスト', () => {
    it('3:1以上のコントラストでtrueを返す', () => {
      // 白背景に濃いめのグレーテキスト（約3.5:1）
      expect(meetsWCAG_AA('#8a8a8a', '#ffffff', true)).toBe(true)
    })

    it('3:1未満のコントラストでfalseを返す', () => {
      // 白背景にかなり薄いグレーテキスト（約1.5:1）
      expect(meetsWCAG_AA('#c0c0c0', '#ffffff', true)).toBe(false)
    })
  })
})

describe('meetsWCAG_AAA', () => {
  describe('通常テキスト', () => {
    it('7:1以上のコントラストでtrueを返す', () => {
      // 白背景にかなり濃いグレーテキスト（約7:1以上）
      expect(meetsWCAG_AAA('#595959', '#ffffff', false)).toBe(true)
    })

    it('7:1未満のコントラストでfalseを返す', () => {
      // 白背景に中程度のグレーテキスト（約4.54:1）
      expect(meetsWCAG_AAA('#767676', '#ffffff', false)).toBe(false)
    })

    it('黒背景に白テキストでtrueを返す', () => {
      expect(meetsWCAG_AAA('#ffffff', '#000000', false)).toBe(true)
    })
  })

  describe('大きなテキスト', () => {
    it('4.5:1以上のコントラストでtrueを返す', () => {
      // 白背景に濃いグレーテキスト（約4.54:1）
      expect(meetsWCAG_AAA('#767676', '#ffffff', true)).toBe(true)
    })

    it('4.5:1未満のコントラストでfalseを返す', () => {
      // 白背景に薄いグレーテキスト（約3:1）
      expect(meetsWCAG_AAA('#959595', '#ffffff', true)).toBe(false)
    })
  })
})

describe('getContrastInfo', () => {
  it('すべてのWCAG基準情報を返す', () => {
    const info = getContrastInfo('#000000', '#ffffff')

    expect(info.ratio).toBeCloseTo(21, 1)
    expect(info.passAA).toBe(true)
    expect(info.passAAA).toBe(true)
    expect(info.passAA_large).toBe(true)
    expect(info.passAAA_large).toBe(true)
  })

  it('AA準拠のみの色情報を返す', () => {
    // 白背景に中程度のグレー（約4.54:1）
    const info = getContrastInfo('#767676', '#ffffff')

    expect(info.ratio).toBeCloseTo(4.54, 1)
    expect(info.passAA).toBe(true) // 4.5:1以上
    expect(info.passAAA).toBe(false) // 7:1未満
    expect(info.passAA_large).toBe(true) // 3:1以上
    expect(info.passAAA_large).toBe(true) // 4.5:1以上
  })

  it('どの基準も満たさない色情報を返す', () => {
    // 白背景にかなり薄いグレー（約1.82:1）
    const info = getContrastInfo('#c0c0c0', '#ffffff')

    expect(info.ratio).toBeCloseTo(1.82, 1)
    expect(info.passAA).toBe(false)
    expect(info.passAAA).toBe(false)
    expect(info.passAA_large).toBe(false)
    expect(info.passAAA_large).toBe(false)
  })

  it('大きなテキスト用AA準拠のみの色情報を返す', () => {
    // 白背景に濃いめのグレー（約3.5:1）
    const info = getContrastInfo('#8a8a8a', '#ffffff')

    expect(info.ratio).toBeCloseTo(3.5, 1)
    expect(info.passAA).toBe(false) // 4.5:1未満
    expect(info.passAAA).toBe(false) // 7:1未満
    expect(info.passAA_large).toBe(true) // 3:1以上
    expect(info.passAAA_large).toBe(false) // 4.5:1未満
  })
})
