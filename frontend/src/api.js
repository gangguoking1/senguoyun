const base = '/api'

async function handle(res) {
  if (res.status === 204) return null
  const text = await res.text()
  if (!res.ok) {
    let detail = text
    try {
      const j = JSON.parse(text)
      detail = j.detail ?? text
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return text ? JSON.parse(text) : null
}

export function fetchTasks(completed) {
  const q = new URLSearchParams()
  if (completed !== undefined) q.set('completed', String(completed))
  const qs = q.toString()
  return fetch(`${base}/tasks${qs ? `?${qs}` : ''}`).then(handle)
}

export function createTask(body) {
  return fetch(`${base}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(handle)
}

export function patchTask(id, body) {
  return fetch(`${base}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(handle)
}

export function deleteTask(id) {
  return fetch(`${base}/tasks/${id}`, { method: 'DELETE' }).then(handle)
}
