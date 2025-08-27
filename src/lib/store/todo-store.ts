import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'construction' | 'design' | 'ic' | 'engineering' | 'other';
  dueDate?: Date;
  assignedTo?: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags?: string[];
  progress?: number;
  blockers?: string[];
}

interface TodoStore {
  todos: Todo[];
  filter: {
    status?: Todo['status'];
    priority?: Todo['priority'];
    category?: Todo['category'];
    assignedTo?: string;
  };
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodoStatus: (id: string) => void;
  setFilter: (filter: TodoStore['filter']) => void;
  getFilteredTodos: () => Todo[];
  getTodosByStatus: (status: Todo['status']) => Todo[];
  getTodosByCategory: (category: Todo['category']) => Todo[];
  getOverdueTodos: () => Todo[];
  getTodaysTodos: () => Todo[];
  getTodoStats: () => {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completionRate: number;
  };
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      todos: [
        {
          id: '1',
          title: '営業→設計 引き継ぎ',
          description: '新規プロジェクトの設計要件確認',
          status: 'completed',
          priority: 'high',
          category: 'design',
          dueDate: new Date('2025-08-25'),
          assignedTo: 'user1',
          createdAt: new Date('2025-08-20'),
          updatedAt: new Date('2025-08-23'),
          completedAt: new Date('2025-08-23'),
          progress: 100,
          tags: ['引き継ぎ', '設計'],
        },
        {
          id: '2',
          title: '設計→IC 引き継ぎ',
          description: '設計図面の最終確認と施工計画',
          status: 'in_progress',
          priority: 'high',
          category: 'ic',
          dueDate: new Date('2025-08-28'),
          assignedTo: 'user2',
          createdAt: new Date('2025-08-22'),
          updatedAt: new Date('2025-08-24'),
          progress: 60,
          tags: ['引き継ぎ', 'IC'],
        },
        {
          id: '3',
          title: 'IC→工務 引き継ぎ',
          description: '施工計画の詳細確認と資材準備',
          status: 'pending',
          priority: 'urgent',
          category: 'engineering',
          dueDate: new Date('2025-08-30'),
          assignedTo: 'user3',
          createdAt: new Date('2025-08-24'),
          updatedAt: new Date('2025-08-24'),
          progress: 0,
          tags: ['引き継ぎ', '工務'],
          blockers: ['資材の納期確認待ち'],
        },
        {
          id: '4',
          title: '安全管理チェック',
          description: '現場の安全基準適合確認',
          status: 'in_progress',
          priority: 'high',
          category: 'construction',
          dueDate: new Date('2025-08-26'),
          assignedTo: 'user1',
          createdAt: new Date('2025-08-23'),
          updatedAt: new Date('2025-08-24'),
          progress: 40,
          tags: ['安全', '現場'],
        },
        {
          id: '5',
          title: '週次進捗レポート作成',
          description: '今週の進捗状況まとめ',
          status: 'pending',
          priority: 'medium',
          category: 'other',
          dueDate: new Date('2025-08-25'),
          assignedTo: 'user2',
          createdAt: new Date('2025-08-24'),
          updatedAt: new Date('2025-08-24'),
          progress: 0,
          tags: ['レポート', '週次'],
        },
        {
          id: '6',
          title: '資材発注確認',
          description: '次週必要資材の発注状況確認',
          status: 'completed',
          priority: 'medium',
          category: 'construction',
          dueDate: new Date('2025-08-24'),
          assignedTo: 'user3',
          createdAt: new Date('2025-08-22'),
          updatedAt: new Date('2025-08-24'),
          completedAt: new Date('2025-08-24'),
          progress: 100,
          tags: ['資材', '発注'],
        },
      ],
      filter: {},

      addTodo: (todo) => {
        const newTodo: Todo = {
          ...todo,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ todos: [...state.todos, newTodo] }));
      },

      updateTodo: (id, updates) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  ...updates,
                  updatedAt: new Date(),
                  completedAt: updates.status === 'completed' ? new Date() : todo.completedAt,
                }
              : todo
          ),
        }));
      },

      deleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        }));
      },

      toggleTodoStatus: (id) => {
        const todo = get().todos.find((t) => t.id === id);
        if (!todo) return;

        let newStatus: Todo['status'];
        if (todo.status === 'pending') {
          newStatus = 'in_progress';
        } else if (todo.status === 'in_progress') {
          newStatus = 'completed';
        } else {
          newStatus = 'pending';
        }

        get().updateTodo(id, { 
          status: newStatus,
          progress: newStatus === 'completed' ? 100 : todo.progress,
        });
      },

      setFilter: (filter) => {
        set({ filter });
      },

      getFilteredTodos: () => {
        const { todos, filter } = get();
        return todos.filter((todo) => {
          if (filter.status && todo.status !== filter.status) return false;
          if (filter.priority && todo.priority !== filter.priority) return false;
          if (filter.category && todo.category !== filter.category) return false;
          if (filter.assignedTo && todo.assignedTo !== filter.assignedTo) return false;
          return true;
        });
      },

      getTodosByStatus: (status) => {
        return get().todos.filter((todo) => todo.status === status);
      },

      getTodosByCategory: (category) => {
        return get().todos.filter((todo) => todo.category === category);
      },

      getOverdueTodos: () => {
        const now = new Date();
        return get().todos.filter(
          (todo) =>
            todo.dueDate &&
            new Date(todo.dueDate) < now &&
            todo.status !== 'completed'
        );
      },

      getTodaysTodos: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return get().todos.filter(
          (todo) =>
            todo.dueDate &&
            new Date(todo.dueDate) >= today &&
            new Date(todo.dueDate) < tomorrow
        );
      },

      getTodoStats: () => {
        const todos = get().todos;
        const pending = todos.filter((t) => t.status === 'pending').length;
        const inProgress = todos.filter((t) => t.status === 'in_progress').length;
        const completed = todos.filter((t) => t.status === 'completed').length;
        const overdue = get().getOverdueTodos().length;
        const total = todos.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          total,
          pending,
          inProgress,
          completed,
          overdue,
          completionRate,
        };
      },
    }),
    {
      name: 'todo-storage',
    }
  )
);