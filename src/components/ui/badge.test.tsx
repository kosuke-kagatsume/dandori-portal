/**
 * Badge コンポーネントのテスト
 */

import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('デフォルトバリアントで正しくレンダリングされる', () => {
    render(<Badge>Test Badge</Badge>);

    const badge = screen.getByText('Test Badge');
    expect(badge).toBeInTheDocument();
  });

  it('テキストコンテンツを表示できる', () => {
    render(<Badge>新着</Badge>);

    expect(screen.getByText('新着')).toBeInTheDocument();
  });

  it('secondary バリアントを適用できる', () => {
    render(<Badge variant="secondary">Secondary</Badge>);

    const badge = screen.getByText('Secondary');
    expect(badge).toBeInTheDocument();
  });

  it('destructive バリアントを適用できる', () => {
    render(<Badge variant="destructive">Error</Badge>);

    const badge = screen.getByText('Error');
    expect(badge).toBeInTheDocument();
  });

  it('outline バリアントを適用できる', () => {
    render(<Badge variant="outline">Outline</Badge>);

    const badge = screen.getByText('Outline');
    expect(badge).toBeInTheDocument();
  });

  it('カスタムクラス名を追加できる', () => {
    render(<Badge className="custom-class">Custom</Badge>);

    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });

  it('HTML属性を渡すことができる', () => {
    render(
      <Badge data-testid="test-badge" aria-label="Test Badge">
        Badge
      </Badge>
    );

    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveAttribute('aria-label', 'Test Badge');
  });

  it('子要素として複数の要素を持てる', () => {
    render(
      <Badge>
        <span>Icon</span>
        <span>Text</span>
      </Badge>
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('数値を表示できる', () => {
    render(<Badge>{42}</Badge>);

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('空のコンテンツでもレンダリングできる', () => {
    const { container } = render(<Badge />);

    const badge = container.querySelector('div');
    expect(badge).toBeInTheDocument();
  });

  it('複数のバッジを同時にレンダリングできる', () => {
    render(
      <div>
        <Badge>Badge 1</Badge>
        <Badge variant="secondary">Badge 2</Badge>
        <Badge variant="destructive">Badge 3</Badge>
      </div>
    );

    expect(screen.getByText('Badge 1')).toBeInTheDocument();
    expect(screen.getByText('Badge 2')).toBeInTheDocument();
    expect(screen.getByText('Badge 3')).toBeInTheDocument();
  });
});
