<script setup>
import { computed, onMounted, ref } from 'vue'
import { createTask, deleteTask, fetchTasks, patchTask } from './api.js'

const tasks = ref([])
const loading = ref(true)
const error = ref('')
const filter = ref('all')
const title = ref('')
const description = ref('')
const priority = ref(0)
const editingId = ref(null)
const editDraft = ref({ title: '', description: '', priority: 0 })

const priorityLabels = ['普通', '重要', '紧急']

async function load() {
  error.value = ''
  loading.value = true
  try {
    let completed
    if (filter.value === 'active') completed = false
    else if (filter.value === 'done') completed = true
    else completed = undefined
    tasks.value = await fetchTasks(completed)
  } catch (e) {
    error.value = e.message || '加载失败'
    tasks.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)

const stats = computed(() => {
  const all = tasks.value.length
  const done = tasks.value.filter((t) => t.completed).length
  return { all, done, active: all - done }
})

async function submit() {
  const t = title.value.trim()
  if (!t) return
  error.value = ''
  try {
    await createTask({
      title: t,
      description: description.value.trim() || null,
      priority: Number(priority.value),
      completed: false,
    })
    title.value = ''
    description.value = ''
    priority.value = 0
    await load()
  } catch (e) {
    error.value = e.message || '创建失败'
  }
}

async function toggle(task) {
  error.value = ''
  try {
    await patchTask(task.id, { completed: !task.completed })
    await load()
  } catch (e) {
    error.value = e.message || '更新失败'
  }
}

async function remove(task) {
  if (!confirm(`删除「${task.title}」？`)) return
  error.value = ''
  try {
    await deleteTask(task.id)
    await load()
  } catch (e) {
    error.value = e.message || '删除失败'
  }
}

function startEdit(task) {
  editingId.value = task.id
  editDraft.value = {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
  }
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(id) {
  const t = editDraft.value.title.trim()
  if (!t) return
  error.value = ''
  try {
    await patchTask(id, {
      title: t,
      description: editDraft.value.description.trim() || null,
      priority: Number(editDraft.value.priority),
    })
    editingId.value = null
    await load()
  } catch (e) {
    error.value = e.message || '保存失败'
  }
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="app">
    <header class="hero">
      <p class="eyebrow">森国云 · 本地待办</p>
      <h1>今日事项</h1>
      <p class="lede">
        与 FastAPI + MySQL 同步；筛选、优先级与备注，足够应付日常清单。
      </p>
    </header>

    <section v-if="error" class="banner err" role="alert">{{ error }}</section>

    <section class="toolbar">
      <div class="filters">
        <button
          type="button"
          :class="{ on: filter === 'all' }"
          @click="filter = 'all'; load()"
        >
          全部
        </button>
        <button
          type="button"
          :class="{ on: filter === 'active' }"
          @click="filter = 'active'; load()"
        >
          进行中
        </button>
        <button
          type="button"
          :class="{ on: filter === 'done' }"
          @click="filter = 'done'; load()"
        >
          已完成
        </button>
      </div>
      <p class="meta" v-if="!loading">
        共 {{ stats.all }} 条 · 未完成 {{ stats.active }} · 已完成 {{ stats.done }}
      </p>
    </section>

    <section class="card compose">
      <h2>新建任务</h2>
      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span>标题</span>
          <input v-model="title" type="text" placeholder="例如：写完接口文档" maxlength="255" />
        </label>
        <label class="field">
          <span>备注（可选）</span>
          <textarea v-model="description" rows="2" placeholder="补充上下文…" />
        </label>
        <label class="field inline">
          <span>优先级</span>
          <select v-model.number="priority">
            <option :value="0">普通</option>
            <option :value="1">重要</option>
            <option :value="2">紧急</option>
          </select>
        </label>
        <button type="submit" class="btn primary" :disabled="!title.trim()">添加</button>
      </form>
    </section>

    <section class="list-wrap">
      <p v-if="loading" class="muted">加载中…</p>
      <ul v-else class="list">
        <li v-for="task in tasks" :key="task.id" class="task" :class="{ done: task.completed }">
          <div class="row" v-if="editingId !== task.id">
            <label class="check">
              <input type="checkbox" :checked="task.completed" @change="toggle(task)" />
              <span class="pri" :data-p="task.priority">{{ priorityLabels[task.priority] }}</span>
            </label>
            <div class="body">
              <p class="task-title">{{ task.title }}</p>
              <p v-if="task.description" class="task-desc">{{ task.description }}</p>
              <p class="time">{{ formatTime(task.created_at) }}</p>
            </div>
            <div class="actions">
              <button type="button" class="btn ghost" @click="startEdit(task)">编辑</button>
              <button type="button" class="btn danger" @click="remove(task)">删除</button>
            </div>
          </div>
          <div v-else class="edit">
            <input v-model="editDraft.title" type="text" />
            <textarea v-model="editDraft.description" rows="2" placeholder="备注" />
            <div class="edit-foot">
              <select v-model.number="editDraft.priority">
                <option :value="0">普通</option>
                <option :value="1">重要</option>
                <option :value="2">紧急</option>
              </select>
              <button type="button" class="btn primary" @click="saveEdit(task.id)">保存</button>
              <button type="button" class="btn ghost" @click="cancelEdit">取消</button>
            </div>
          </div>
        </li>
        <li v-if="!loading && tasks.length === 0" class="empty muted">暂无任务，先添加一条吧。</li>
      </ul>
    </section>

    <footer class="foot">
      <p>后端 <code>uvicorn app.main:app --reload</code> · 前端 <code>npm run dev</code></p>
    </footer>
  </div>
</template>
