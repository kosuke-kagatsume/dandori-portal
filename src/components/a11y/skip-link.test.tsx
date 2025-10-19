/**
 * SkipLink コンポーネントのテスト
 */

import { render, screen } from '@testing-library/react';
import { SkipLink } from './skip-link';

describe('SkipLink', () => {
  it('正しくレンダリングされる', () => {
    render(<SkipLink />);

    const link = screen.getByText('メインコンテンツへスキップ');
    expect(link).toBeInTheDocument();
  });

  it('リンクがaタグである', () => {
    render(<SkipLink />);

    const link = screen.getByText('メインコンテンツへスキップ');
    expect(link.tagName).toBe('A');
  });

  it('main-contentへのhref属性を持つ', () => {
    render(<SkipLink />);

    const link = screen.getByText('メインコンテンツへスキップ');
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('正しいアクセシビリティクラスが適用されている', () => {
    render(<SkipLink />);

    const link = screen.getByText('メインコンテンツへスキップ');

    // absoluteクラスが含まれることを確認
    expect(link).toHaveClass('absolute');

    // z-indexが高い（z-[9999]）ことを確認
    const className = link.className;
    expect(className).toContain('z-[9999]');
  });

  it('テキストコンテンツが正しい', () => {
    render(<SkipLink />);

    expect(screen.getByText('メインコンテンツへスキップ')).toBeInTheDocument();
  });

  it('キーボードフォーカス用のスタイルが適用されている', () => {
    render(<SkipLink />);

    const link = screen.getByText('メインコンテンツへスキップ');
    const className = link.className;

    // フォーカス関連のクラスが含まれることを確認
    expect(className).toContain('focus:translate-y-0');
    expect(className).toContain('focus:outline-none');
  });

  it('デフォルトで画面外に配置されている', () => {
    render(<SkipLink />);

    const link = screen.getByText('メインコンテンツへスキップ');
    const className = link.className;

    // -translate-y-fullで画面外に配置されている
    expect(className).toContain('-translate-y-full');
  });

  it('トランジション効果が適用されている', () => {
    render(<SkipLink />);

    const link = screen.getByText('メインコンテンツへスキップ');
    const className = link.className;

    expect(className).toContain('transition-transform');
  });

  it('適切な色とパディングが設定されている', () => {
    render(<SkipLink />);

    const link = screen.getByText('メインコンテンツへスキップ');
    const className = link.className;

    expect(className).toContain('bg-blue-600');
    expect(className).toContain('text-white');
    expect(className).toContain('px-4');
    expect(className).toContain('py-2');
  });

  it('左上に配置されている', () => {
    render(<SkipLink />);

    const link = screen.getByText('メインコンテンツへスキップ');
    const className = link.className;

    expect(className).toContain('left-0');
    expect(className).toContain('top-0');
  });
});
