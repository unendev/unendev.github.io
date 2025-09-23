---
layout: post
title: "Nexus#4: 从后端时序Bug到前端UI/UX的深度打磨"
tags: [React, Debug, 前端, TS]
date: 2025-9-23
comments: true
author: helpfulcraft
---

### 一、深入理解乐观更新与异步时序

**1. 发现问题**

在日志（`/log`）页面，我发现了一个奇怪的现象：创建一个新计时任务并立即开始计时后，如果马上刷新页面，这个任务会“回溯”到未开始的状态。我的临时解决方法是养成一个习惯：**每次创建任务后，都等待大约5秒再刷新页面**。这显然不是一个合理的解决方案

**2. 初步分析**

我猜测问题出在前端的“乐观更新”与后端数据库操作之间的时序上。流程大致是：

-   **前端**：为了即时反馈，点击“创建”后，UI上立刻出现一个新任务
-   **后端**：一个异步请求被发送到服务器，在数据库中创建这条记录
-   **问题点**：刷新页面时，前端的临时状态丢失，数据从数据库重新获取。如果此时数据库中的记录状态与UI显示不一致，就会出现“回溯”

**3. 深入代码**

经过对代码的分析，我发现了导致问题的确切流程：

1.  **乐观更新 (UI)**：前端在本地状态中创建了一个`tempTask`，其`isRunning`状态为`false`
2.  **创建任务 (API)**：一个`POST`请求被发送到`/api/timer-tasks`，在数据库中创建了一个新任务，其`isRunning`同样被设置为`false`
3.  **延迟开始 (UI)**：在`POST`请求**成功返回后**，前端代码使用了一个`setTimeout(..., 100)`来触发计时开始
4.  **更新状态 (API)**：在`setTimeout`的回调中，前端UI状态被更新为`isRunning: true`，**同时**，又发送了一个`PUT`请求去更新数据库中任务的状态

**问题的根源**：在步骤2和步骤4的数据库更新完成之间，存在一个明显的时间窗口。如果用户在此期间刷新页面，数据库中存储的仍然是`isRunning: false`的状态，导致刷新后任务显示为未开始。我的“等待5秒”大法，本质上就是在硬等这个窗口期过去

```typescript
// 修复前：分离的创建和开始逻辑
const handleAddToTimer = async (taskName: string, ...) => {
  // 1. 临时任务状态为 isRunning: false
  const tempTask = {
    // ...
    isRunning: false,
    startTime: null,
    // ...
  };

  // 立即更新UI
  setTimerTasks([tempTask, ...timerTasks]);

  try {
    // 2. 向数据库创建一个 isRunning: false 的任务
    const response = await fetch('/api/timer-tasks', {
      method: 'POST',
      body: JSON.stringify({
        // ...
        isRunning: false,
        startTime: null,
        // ...
      }),
    });

    const createdTask = await response.json();

    // 3. 成功后，延迟100ms再开始计时
    setTimeout(() => {
      // 4. 更新UI为运行状态，并发起第二次API调用更新数据库
      setTimerTasks(prevTasks => /* ... update to isRunning: true ... */);
      fetch('/api/timer-tasks', { method: 'PUT', /* ... update isRunning to true ... */ });
    }, 100);
    
  } catch (error) {
    // ...
  }
};
```

**4. 解决方案**

核心思想是**将“创建任务”和“开始计时”合并为一个原子操作**，确保数据库在创建记录时就已经是“正在运行”的状态

-   **后端改造**：修改`POST /api/timer-tasks`接口。在创建新任务时，直接将`isRunning`设置为`true`，并记录下当前的`startTime`。不再需要后续的`PUT`更新

-   **前端改造**：
    1.  **移除延迟**：彻底删除了`setTimeout`逻辑，不再有100ms的延迟和二次API调用
    2.  **状态同步**：修改前端的乐观更新逻辑。创建`tempTask`时，就直接将其状态设置为`isRunning: true`和当前的`startTime`，使其与后端将要创建的最终状态保持一致
    3.  **数据替换**：当后端成功返回创建的任务数据后，用返回的真实数据（包含数据库生成的ID和时间戳）替换掉`tempTask`

```typescript
// 修复后：合并的原子操作
const handleAddToTimer = async (taskName: string, ...) => {
  // 1. 临时任务状态直接设为 isRunning: true
  const tempTask = {
    // ...
    isRunning: true,
    startTime: Math.floor(Date.now() / 1000),
    // ...
  };
  
  // 立即更新UI
  setTimerTasks([tempTask, ...timerTasks]);

  try {
    // 2. 向数据库直接创建一个 isRunning: true 的任务
    const response = await fetch('/api/timer-tasks', {
      method: 'POST',
      body: JSON.stringify({
        // ...
        isRunning: true, // 直接设置为运行状态
        startTime: Math.floor(Date.now() / 1000), // 立即设置开始时间
        // ...
      }),
    });

    const createdTask = await response.json();
    
    // 3. 用真实数据替换临时数据，不再有延迟和二次API调用
    setTimerTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === tempTask.id ? { ...createdTask } : task
      )
    );
  } catch (error) {
    // ...
  }
};
```

---

### 二、图表的演进

在日志页面的“时间统计”部分，我希望在保留现有旭日图的基础上，新增一个图表，用于统计“可用事务项”（Instance Tags）的使用耗时

**1. 在旭日图中加入切换模式**

-   **引入`viewMode`状态**：在组件内部增加了`useState<'category' | 'instance'>('category')`，用于控制图表显示“按分类”还是“按事务项”
-   **新增API Endpoint**：为了获取“总时长”数据，我在后端创建了一个新的API路由`/api/timer-tasks/stats/by-instance`，它会根据`userId`查询数据库中所有`TimerTask`记录，按`instanceTag`分组并计算总耗时后返回聚合结果
-   **动态数据获取**：使用`useEffect`监听`viewMode`的变化。当切换到`'instance'`模式时，组件会异步请求上述新API，并将数据存入`instanceStats`状态

```typescriptreact
// EChartsSunburstChart.tsx
const [viewMode, setViewMode] = React.useState<'category' | 'instance'>('category');
const [instanceStats, setInstanceStats] = React.useState<InstanceStat[]>([]);
const [loadingInstance, setLoadingInstance] = React.useState(false);

React.useEffect(() => {
  if (viewMode !== 'instance') return; // 只在事务项模式下加载
  
  const fetchInstanceStats = async () => {
    setLoadingInstance(true);
    try {
      const res = await fetch(`/api/timer-tasks/stats/by-instance?userId=${userId}`);
      const json = await res.json();
      setInstanceStats(json.stats || []);
    } catch (e) {
      console.error('加载事务项统计失败', e);
    } finally {
      setLoadingInstance(false);
    }
  };

  fetchInstanceStats();
}, [viewMode, userId]);
```

**2. 从“全部展示”到“按需选择”**

第一版实现了切换，但它会一次性展示所有的“可用事务项”，当事务项增多时，图表会变得非常拥挤

-   **复用组件**：我直接复用了已有的`InstanceTagSelector`组件，它能获取所有可用的事务项并支持多选，保证了UI的一致性
-   **引入筛选状态**：在`EChartsSunburstChart`中增加了`selectedInstanceTags`状态，用于存储用户选中的事务项
-   **数据过滤**：修改`buildInstanceSunburstData`函数，在构建图表数据前，先根据`selectedInstanceTags`数组过滤`instanceStats`。如果筛选数组为空，则显示全部数据

**代码例证：加入筛选器和数据过滤逻辑**
```typescriptreact
// EChartsSunburstChart.tsx

// 1. 引入筛选状态
const [selectedInstanceTags, setSelectedInstanceTags] = React.useState<string[]>([]);

// 2. 渲染筛选器组件 (JSX)
{viewMode === 'instance' && (
  <div className="mb-3">
    <InstanceTagSelector
      selectedTags={selectedInstanceTags}
      onTagsChange={setSelectedInstanceTags}
      userId={userId}
    />
  </div>
)}

// 3. 在构建图表数据时应用过滤
const buildInstanceSunburstData = React.useCallback(() => {
  // ...
  const filtered = selectedInstanceTags.length > 0
    ? instanceStats.filter(it => selectedInstanceTags.includes(it.instanceTag))
    : instanceStats; // 如果未选择，则显示全部

  const children: SunburstNode[] = filtered.map(/* ... */);
  // ...
  return root;
}, [instanceStats, selectedInstanceTags]);
```

---

### 三、UI/UX改造

创建事物的模态框在移动端显示效果尚可，但在PC端大屏上显得空旷、分散，布局不美观

**1. 统一为移动端逻辑**

我简单地移除了所有PC端的响应式样式，虽然解决了PC端过于分散的问题，但也浪费了大屏幕的空间优势

```diff
- <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
+ <div className="grid grid-cols-1 gap-4">
```

**2. PC端2x2网格布局**

为了利用PC端的大屏优势，我重新设计了布局，采用了响应式2x2网格

```typescriptreact
// CreateLogFormWithCards.tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* 左上：快速分类创建 (横跨两列) */}
  <div className="... lg:col-span-2 ...">
    <CategorySelector />
  </div>

  {/* 左下：手动输入区域 */}
  <div className="...">
    <Textarea />
  </div>

  {/* 右下：操作按钮区域 */}
  <div className="...">
    <Button>添加到计时器</Button>
  </div>
</div>
```

**3. 样式美化与Dark Reader适配**

布局问题解决后，我开始进行UI美化，并注意了对Dark Reader的兼容，以避免再次出现水合问题

```diff
- <Card className="... bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 ...">
+ <Card className="... bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm ...">

- <span className="... group-hover:text-blue-700 ...">{topCategory.name}</span>
+ <span className="... group-hover:text-blue-700 dark:group-hover:text-blue-400 ...">{topCategory.name}</span>

- <Button variant="outline" className="... bg-white/80 ...">
+ <Button variant="outline" className="... bg-white/80 dark:bg-gray-700/80 ...">
```
使用带透明度的背景色（`bg-white/90`）并为`dark`模式提供专门的半透明深色背景（`dark:bg-gray-800/90`），确保了亮色与暗色模式下，UI都足够清晰、美观