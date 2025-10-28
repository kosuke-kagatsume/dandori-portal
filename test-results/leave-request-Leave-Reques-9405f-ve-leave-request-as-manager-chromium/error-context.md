# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - heading "404" [level=1] [ref=e3]
    - heading "ページが見つかりません" [level=2] [ref=e4]
    - paragraph [ref=e5]: お探しのページは存在しないか、移動された可能性があります。
    - link "ダッシュボードに戻る" [ref=e6] [cursor=pointer]:
      - /url: /ja/dashboard
  - region "Notifications alt+T"
  - alert [ref=e7]
```