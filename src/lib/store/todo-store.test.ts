/**
 * Todo ストアのテスト
 */

import { useTodoStore } from './todo-store';
import type { Todo } from './todo-store';

describe('TodoStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    const state = useTodoStore.getState();
    state.todos = [];
    state.filter = {};
  });

  describe('addTodo', () => {
    it('新しいTodoを追加できる', () => {
      const { addTodo, todos } = useTodoStore.getState();

      addTodo({
        title: 'テストTodo',
        description: 'テスト説明',
        status: 'pending',
        priority: 'high',
        category: 'design',
      });

      const newTodos = useTodoStore.getState().todos;
      expect(newTodos).toHaveLength(1);
      expect(newTodos[0].title).toBe('テストTodo');
      expect(newTodos[0].status).toBe('pending');
    });

    it('追加時にIDと日時が自動生成される', () => {
      const { addTodo } = useTodoStore.getState();

      addTodo({
        title: 'ID生成テスト',
        status: 'pending',
        priority: 'medium',
        category: 'other',
      });

      const newTodos = useTodoStore.getState().todos;
      expect(newTodos[0].id).toBeDefined();
      expect(newTodos[0].createdAt).toBeInstanceOf(Date);
      expect(newTodos[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateTodo', () => {
    it('既存のTodoを更新できる', () => {
      const { addTodo, updateTodo } = useTodoStore.getState();

      addTodo({
        title: '元のタイトル',
        status: 'pending',
        priority: 'low',
        category: 'other',
      });

      const todoId = useTodoStore.getState().todos[0].id;

      updateTodo(todoId, {
        title: '更新後のタイトル',
        priority: 'high',
      });

      const updatedTodo = useTodoStore.getState().todos[0];
      expect(updatedTodo.title).toBe('更新後のタイトル');
      expect(updatedTodo.priority).toBe('high');
    });

    it('completedステータスに変更するとcompletedAtが設定される', () => {
      const { addTodo, updateTodo } = useTodoStore.getState();

      addTodo({
        title: '完了テスト',
        status: 'pending',
        priority: 'medium',
        category: 'other',
      });

      const todoId = useTodoStore.getState().todos[0].id;

      updateTodo(todoId, {
        status: 'completed',
      });

      const updatedTodo = useTodoStore.getState().todos[0];
      expect(updatedTodo.status).toBe('completed');
      expect(updatedTodo.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteTodo', () => {
    it('Todoを削除できる', () => {
      const { addTodo, deleteTodo } = useTodoStore.getState();

      addTodo({
        title: '削除対象',
        status: 'pending',
        priority: 'low',
        category: 'other',
      });

      const todoId = useTodoStore.getState().todos[0].id;
      expect(useTodoStore.getState().todos).toHaveLength(1);

      deleteTodo(todoId);

      expect(useTodoStore.getState().todos).toHaveLength(0);
    });
  });

  describe('toggleTodoStatus', () => {
    it('pending → in_progress → completed → pending とステータスが切り替わる', () => {
      const { addTodo, toggleTodoStatus } = useTodoStore.getState();

      addTodo({
        title: 'ステータス切り替えテスト',
        status: 'pending',
        priority: 'medium',
        category: 'other',
      });

      const todoId = useTodoStore.getState().todos[0].id;

      // pending → in_progress
      toggleTodoStatus(todoId);
      expect(useTodoStore.getState().todos[0].status).toBe('in_progress');

      // in_progress → completed
      toggleTodoStatus(todoId);
      expect(useTodoStore.getState().todos[0].status).toBe('completed');
      expect(useTodoStore.getState().todos[0].progress).toBe(100);

      // completed → pending
      toggleTodoStatus(todoId);
      expect(useTodoStore.getState().todos[0].status).toBe('pending');
    });
  });

  describe('setFilter', () => {
    it('フィルターを設定できる', () => {
      const { setFilter } = useTodoStore.getState();

      setFilter({
        status: 'completed',
        priority: 'high',
      });

      const { filter } = useTodoStore.getState();
      expect(filter.status).toBe('completed');
      expect(filter.priority).toBe('high');
    });
  });

  describe('getFilteredTodos', () => {
    beforeEach(() => {
      const { addTodo } = useTodoStore.getState();

      addTodo({
        title: 'Todo 1',
        status: 'pending',
        priority: 'high',
        category: 'design',
      });

      addTodo({
        title: 'Todo 2',
        status: 'completed',
        priority: 'low',
        category: 'engineering',
      });

      addTodo({
        title: 'Todo 3',
        status: 'pending',
        priority: 'high',
        category: 'design',
      });
    });

    it('ステータスでフィルタリングできる', () => {
      const { setFilter, getFilteredTodos } = useTodoStore.getState();

      setFilter({ status: 'pending' });

      const filtered = getFilteredTodos();
      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.status === 'pending')).toBe(true);
    });

    it('優先度でフィルタリングできる', () => {
      const { setFilter, getFilteredTodos } = useTodoStore.getState();

      setFilter({ priority: 'high' });

      const filtered = getFilteredTodos();
      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.priority === 'high')).toBe(true);
    });

    it('複数条件でフィルタリングできる', () => {
      const { setFilter, getFilteredTodos } = useTodoStore.getState();

      setFilter({
        status: 'pending',
        priority: 'high',
        category: 'design',
      });

      const filtered = getFilteredTodos();
      expect(filtered).toHaveLength(2);
      expect(
        filtered.every(
          (t) => t.status === 'pending' && t.priority === 'high' && t.category === 'design'
        )
      ).toBe(true);
    });
  });

  describe('getTodosByStatus', () => {
    it('指定ステータスのTodoを取得できる', () => {
      const { addTodo, getTodosByStatus } = useTodoStore.getState();

      addTodo({
        title: 'Pending Todo',
        status: 'pending',
        priority: 'medium',
        category: 'other',
      });

      addTodo({
        title: 'Completed Todo',
        status: 'completed',
        priority: 'medium',
        category: 'other',
      });

      const pendingTodos = getTodosByStatus('pending');
      expect(pendingTodos).toHaveLength(1);
      expect(pendingTodos[0].title).toBe('Pending Todo');
    });
  });

  describe('getTodosByCategory', () => {
    it('指定カテゴリのTodoを取得できる', () => {
      const { addTodo, getTodosByCategory } = useTodoStore.getState();

      addTodo({
        title: 'Design Todo',
        status: 'pending',
        priority: 'medium',
        category: 'design',
      });

      addTodo({
        title: 'Engineering Todo',
        status: 'pending',
        priority: 'medium',
        category: 'engineering',
      });

      const designTodos = getTodosByCategory('design');
      expect(designTodos).toHaveLength(1);
      expect(designTodos[0].category).toBe('design');
    });
  });

  describe('getOverdueTodos', () => {
    it('期限切れのTodoを取得できる', () => {
      const { addTodo, getOverdueTodos } = useTodoStore.getState();

      // 過去の日付
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      // 未来の日付
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      addTodo({
        title: '期限切れTodo',
        status: 'pending',
        priority: 'high',
        category: 'other',
        dueDate: pastDate,
      });

      addTodo({
        title: '期限内Todo',
        status: 'pending',
        priority: 'high',
        category: 'other',
        dueDate: futureDate,
      });

      const overdueTodos = getOverdueTodos();
      expect(overdueTodos).toHaveLength(1);
      expect(overdueTodos[0].title).toBe('期限切れTodo');
    });

    it('完了済みTodoは期限切れに含まれない', () => {
      const { addTodo, getOverdueTodos } = useTodoStore.getState();

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      addTodo({
        title: '期限切れだが完了済み',
        status: 'completed',
        priority: 'high',
        category: 'other',
        dueDate: pastDate,
      });

      const overdueTodos = getOverdueTodos();
      expect(overdueTodos).toHaveLength(0);
    });
  });

  describe('getTodoStats', () => {
    beforeEach(() => {
      const { addTodo } = useTodoStore.getState();

      addTodo({
        title: 'Todo 1',
        status: 'pending',
        priority: 'high',
        category: 'other',
      });

      addTodo({
        title: 'Todo 2',
        status: 'in_progress',
        priority: 'medium',
        category: 'other',
      });

      addTodo({
        title: 'Todo 3',
        status: 'completed',
        priority: 'low',
        category: 'other',
      });

      addTodo({
        title: 'Todo 4',
        status: 'completed',
        priority: 'low',
        category: 'other',
      });
    });

    it('統計情報を正しく計算する', () => {
      const { getTodoStats } = useTodoStore.getState();

      const stats = getTodoStats();

      expect(stats.total).toBe(4);
      expect(stats.pending).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(2);
      expect(stats.completionRate).toBe(50); // 2/4 = 50%
    });

    it('Todoがない場合は完了率0%', () => {
      // ストアをクリア
      useTodoStore.setState({ todos: [] });

      const { getTodoStats } = useTodoStore.getState();
      const stats = getTodoStats();

      expect(stats.total).toBe(0);
      expect(stats.completionRate).toBe(0);
    });
  });
});
