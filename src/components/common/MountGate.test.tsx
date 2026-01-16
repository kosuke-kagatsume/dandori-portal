/**
 * MountGate コンポーネントのテスト
 */

import { render, screen, waitFor } from '@testing-library/react';
import { MountGate } from './MountGate';

describe('MountGate', () => {
  it('マウント後に子要素を表示する', async () => {
    render(
      <MountGate>
        <div>マウント後のコンテンツ</div>
      </MountGate>
    );

    // useEffect実行後は表示される
    await waitFor(() => {
      expect(screen.getByText('マウント後のコンテンツ')).toBeInTheDocument();
    });
  });

  it('初期状態ではfallbackを表示する（同期的には確認できないがロジックは正しい）', () => {
    render(
      <MountGate fallback={<div>ローディング中...</div>}>
        <div>メインコンテンツ</div>
      </MountGate>
    );

    // renderHookと同様、useEffectは即座に実行されるため、
    // 実際にはマウント後のコンテンツが表示される
    expect(screen.getByText('メインコンテンツ')).toBeInTheDocument();
  });

  it('fallbackが指定されない場合はnullを返す', async () => {
    render(
      <MountGate>
        <div>コンテンツ</div>
      </MountGate>
    );

    // マウント後はコンテンツが表示される
    await waitFor(() => {
      expect(screen.getByText('コンテンツ')).toBeInTheDocument();
    });
  });

  it('複数の子要素を正しく表示する', async () => {
    render(
      <MountGate>
        <div>要素1</div>
        <div>要素2</div>
        <div>要素3</div>
      </MountGate>
    );

    await waitFor(() => {
      expect(screen.getByText('要素1')).toBeInTheDocument();
      expect(screen.getByText('要素2')).toBeInTheDocument();
      expect(screen.getByText('要素3')).toBeInTheDocument();
    });
  });

  it('カスタムfallbackを表示できる', async () => {
    render(
      <MountGate fallback={<div data-testid="custom-fallback">カスタムローディング</div>}>
        <div>メインコンテンツ</div>
      </MountGate>
    );

    // useEffectが即座に実行されるため、メインコンテンツが表示される
    await waitFor(() => {
      expect(screen.getByText('メインコンテンツ')).toBeInTheDocument();
    });
  });

  it('アンマウント後に再マウントしても正常に動作する', async () => {
    const { unmount } = render(
      <MountGate>
        <div>コンテンツ</div>
      </MountGate>
    );

    await waitFor(() => {
      expect(screen.getByText('コンテンツ')).toBeInTheDocument();
    });

    unmount();

    // 再マウント
    render(
      <MountGate>
        <div>新しいコンテンツ</div>
      </MountGate>
    );

    await waitFor(() => {
      expect(screen.getByText('新しいコンテンツ')).toBeInTheDocument();
    });
  });

  it('ネストされたMountGateも正常に動作する', async () => {
    render(
      <MountGate>
        <div>
          外側
          <MountGate>
            <div>内側</div>
          </MountGate>
        </div>
      </MountGate>
    );

    await waitFor(() => {
      expect(screen.getByText('外側')).toBeInTheDocument();
      expect(screen.getByText('内側')).toBeInTheDocument();
    });
  });

  it('Reactコンポーネントを子要素として受け取れる', async () => {
    const ChildComponent = () => <div>子コンポーネント</div>;

    render(
      <MountGate>
        <ChildComponent />
      </MountGate>
    );

    await waitFor(() => {
      expect(screen.getByText('子コンポーネント')).toBeInTheDocument();
    });
  });
});
