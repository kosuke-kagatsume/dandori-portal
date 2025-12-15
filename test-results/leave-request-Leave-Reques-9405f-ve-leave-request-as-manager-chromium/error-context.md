# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - heading "404" [level=1] [ref=e3]
    - heading "ページが見つかりません" [level=2] [ref=e4]
    - paragraph [ref=e5]: お探しのページは存在しないか、移動された可能性があります。
    - button "ダッシュボードに戻る" [ref=e6] [cursor=pointer]
  - region "Notifications alt+T"
  - alert [ref=e7]
  - generic [ref=e10] [cursor=pointer]:
    - img [ref=e11]
    - generic [ref=e13]: 1 error
    - button "Hide Errors" [ref=e14]:
      - img [ref=e15]
```