import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import { ApiError, demoStore } from '../src/demo/store.ts'

const app = new Hono()
const port = Number(process.env.MOCK_API_PORT ?? 8000)

app.use('*', cors())

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          fields: err.fields,
          request_id: err.request_id,
        },
      },
      err.status as 400,
    )
  }
  return c.json(
    {
      error: {
        code: 'INTERNAL',
        message: err.message,
        request_id: 'req_mock_internal',
      },
    },
    500,
  )
})

function notFound(entity: string) {
  throw new ApiError(404, {
    code: 'NOT_FOUND',
    message: `${entity} not found.`,
    request_id: `req_mock_${entity}`,
  })
}

app.get('/', (c) => c.redirect('/docs'))

app.get('/docs', (c) =>
  c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Agentcy mock API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui' })
    </script>
  </body>
</html>`),
)

app.get('/openapi.json', (c) => c.json(openApiSpec()))

app.get('/api/v1/admin/fixtures', (c) => c.json(demoStore.fixtureCatalog()))
app.post('/api/v1/admin/reset', (c) => {
  demoStore.reset()
  return c.json({ ok: true, message: 'Mock workspace reset to the labelled Northline fixture.' })
})

app.get('/api/v1/me', (c) => c.json(demoStore.user()))
app.get('/api/v1/dashboard/briefing', (c) => c.json(demoStore.briefing()))
app.get('/api/v1/search', (c) => c.json(demoStore.search(c.req.query('q') ?? '')))
app.get('/api/v1/notifications', (c) =>
  c.json({ data: demoStore.notifications, meta: { next_cursor: null, has_more: false } }),
)
app.get('/api/v1/activity', (c) => c.json(demoStore.activityPage()))
app.post('/api/v1/ceo/ask', async (c) => {
  const body = await c.req.json<{ question?: string }>()
  return c.json(demoStore.askCeo(body.question ?? 'What needs my decision?'))
})

app.get('/api/v1/todos', (c) => c.json({ data: demoStore.todos, meta: { next_cursor: null, has_more: false } }))
app.post('/api/v1/todos', async (c) => c.json(demoStore.createTodo(await c.req.json()), 201))
app.patch('/api/v1/todos/:id', async (c) => c.json(demoStore.patchTodo(c.req.param('id'), await c.req.json())))

app.get('/api/v1/tasks', (c) => c.json({ data: demoStore.tasks, meta: { next_cursor: null, has_more: false } }))
app.post('/api/v1/tasks', async (c) => c.json(demoStore.createTask(await c.req.json()), 201))
app.get('/api/v1/tasks/:id', (c) => {
  const task = demoStore.tasks.find((item) => item.id === c.req.param('id'))
  if (!task) notFound('task')
  return c.json(task)
})
app.patch('/api/v1/tasks/:id/delegate', async (c) =>
  c.json(demoStore.delegateTask(c.req.param('id'), await c.req.json())),
)
app.patch('/api/v1/tasks/:id', async (c) => c.json(demoStore.patchTask(c.req.param('id'), await c.req.json())))

app.get('/api/v1/projects', (c) => c.json({ data: demoStore.projects, meta: { next_cursor: null, has_more: false } }))
app.get('/api/v1/projects/:id', (c) => {
  const project = demoStore.projects.find((item) => item.id === c.req.param('id'))
  if (!project) notFound('project')
  return c.json(project)
})

app.get('/api/v1/leads', (c) => c.json({ data: demoStore.leads, meta: { next_cursor: null, has_more: false } }))
app.post('/api/v1/leads', async (c) => c.json(demoStore.createLead(await c.req.json()), 201))
app.get('/api/v1/leads/:id', (c) => {
  const lead = demoStore.leads.find((item) => item.id === c.req.param('id'))
  if (!lead) notFound('lead')
  return c.json(lead)
})
app.patch('/api/v1/leads/:id', async (c) => c.json(demoStore.patchLead(c.req.param('id'), await c.req.json())))

app.get('/api/v1/tickets', (c) => c.json({ data: demoStore.tickets, meta: { next_cursor: null, has_more: false } }))
app.get('/api/v1/tickets/:id', (c) => {
  const ticket = demoStore.tickets.find((item) => item.id === c.req.param('id'))
  if (!ticket) notFound('ticket')
  return c.json(ticket)
})
app.post('/api/v1/tickets/:id/messages', async (c) =>
  c.json(demoStore.postTicketMessage(c.req.param('id'), await c.req.json())),
)
app.patch('/api/v1/tickets/:id', async (c) => c.json(demoStore.patchTicket(c.req.param('id'), await c.req.json())))

app.get('/api/v1/employees', (c) => c.json({ data: demoStore.employees, meta: { next_cursor: null, has_more: false } }))
app.get('/api/v1/employees/:id', (c) => {
  const employee = demoStore.employees.find((item) => item.id === c.req.param('id'))
  if (!employee) notFound('employee')
  return c.json(employee)
})
app.get('/api/v1/employees/:id/workload', (c) => {
  const employee = demoStore.employees.find((item) => item.id === c.req.param('id'))
  if (!employee) notFound('employee')
  return c.json(employee)
})

app.get('/api/v1/agents', (c) => c.json({ data: demoStore.agents, meta: { next_cursor: null, has_more: false } }))
app.get('/api/v1/agents/:id', (c) => {
  const agent = demoStore.agents.find((item) => item.id === c.req.param('id'))
  if (!agent) notFound('agent')
  return c.json(agent)
})
app.patch('/api/v1/agents/:id', async (c) => c.json(demoStore.patchAgent(c.req.param('id'), await c.req.json())))

app.get('/api/v1/agent-runs', (c) => c.json({ data: demoStore.runs, meta: { next_cursor: null, has_more: false } }))
app.get('/api/v1/agent-runs/:id', (c) => {
  const run = demoStore.runs.find((item) => item.id === c.req.param('id'))
  if (!run) notFound('agent_run')
  return c.json(run)
})
app.post('/api/v1/agent-runs/:id/retry', (c) => c.json(demoStore.retryRun(c.req.param('id'))))

app.get('/api/v1/reports', (c) => c.json({ data: demoStore.reports, meta: { next_cursor: null, has_more: false } }))
app.post('/api/v1/reports', async (c) => c.json(demoStore.createReport(await c.req.json().catch(() => ({}))), 201))
app.get('/api/v1/reports/:id', (c) => {
  const report = demoStore.reports.find((item) => item.id === c.req.param('id'))
  if (!report) notFound('report')
  return c.json(report)
})
app.post('/api/v1/reports/:id/regenerate', (c) => c.json(demoStore.regenerateReport(c.req.param('id'))))

app.get('/api/v1/approvals', (c) => c.json({ data: demoStore.approvals, meta: { next_cursor: null, has_more: false } }))
app.post('/api/v1/approvals/:id/decide', async (c) => {
  const body = await c.req.json<{ decision: 'approved' | 'rejected'; version?: number }>()
  return c.json(demoStore.decideApproval(c.req.param('id'), body.decision, body.version))
})

app.get('/api/v1/events', (c) =>
  streamSSE(c, async (stream) => {
    const lastId = c.req.header('Last-Event-ID')
    if (lastId) {
      const missed = demoStore.events.filter((event) => event.id > lastId).reverse()
      for (const event of missed) {
        await stream.writeSSE({ id: event.id, event: event.type, data: JSON.stringify(event) })
      }
    }
    const unsubscribe = demoStore.subscribe(async (event) => {
      await stream.writeSSE({ id: event.id, event: event.type, data: JSON.stringify(event) })
    })
    const tick = setInterval(() => demoStore.tickLive(), 8000)
    try {
      while (true) {
        await stream.sleep(15_000)
        await stream.writeSSE({ event: 'ping', data: '{}' })
      }
    } finally {
      clearInterval(tick)
      unsubscribe()
    }
  }),
)

function openApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Agentcy mock API',
      version: '0.1.0',
      description:
        'Labelled Northline Studio fixture. Same contract the dashboard expects at /api/v1. Not production.',
    },
    servers: [{ url: `http://localhost:${port}`, description: 'Local mock' }],
    paths: {
      '/api/v1/me': { get: { summary: 'Current operator', responses: { '200': { description: 'OK' } } } },
      '/api/v1/dashboard/briefing': {
        get: { summary: 'Command Center briefing', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/search': {
        get: {
          summary: 'Workspace search',
          parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }],
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/v1/notifications': { get: { summary: 'Actionable inbox', responses: { '200': { description: 'OK' } } } },
      '/api/v1/activity': { get: { summary: 'Activity feed', responses: { '200': { description: 'OK' } } } },
      '/api/v1/ceo/ask': { post: { summary: 'Ask CEO Agent', responses: { '200': { description: 'OK' } } } },
      '/api/v1/todos': {
        get: { summary: 'List todos', responses: { '200': { description: 'OK' } } },
        post: { summary: 'Create todo', responses: { '201': { description: 'Created' } } },
      },
      '/api/v1/todos/{id}': { patch: { summary: 'Update todo', responses: { '200': { description: 'OK' } } } },
      '/api/v1/tasks': {
        get: { summary: 'List tasks', responses: { '200': { description: 'OK' } } },
        post: { summary: 'Create task', responses: { '201': { description: 'Created' } } },
      },
      '/api/v1/tasks/{id}': {
        get: { summary: 'Get task', responses: { '200': { description: 'OK' } } },
        patch: { summary: 'Update task', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/tasks/{id}/delegate': { patch: { summary: 'Delegate task', responses: { '200': { description: 'OK' } } } },
      '/api/v1/projects': { get: { summary: 'List projects', responses: { '200': { description: 'OK' } } } },
      '/api/v1/projects/{id}': { get: { summary: 'Get project', responses: { '200': { description: 'OK' } } } },
      '/api/v1/leads': {
        get: { summary: 'List leads', responses: { '200': { description: 'OK' } } },
        post: { summary: 'Create lead', responses: { '201': { description: 'Created' } } },
      },
      '/api/v1/leads/{id}': {
        get: { summary: 'Get lead', responses: { '200': { description: 'OK' } } },
        patch: { summary: 'Update / transition lead', responses: { '200': { description: 'OK' }, '422': { description: 'Validation' } } },
      },
      '/api/v1/tickets': { get: { summary: 'List tickets', responses: { '200': { description: 'OK' } } } },
      '/api/v1/tickets/{id}': {
        get: { summary: 'Get ticket', responses: { '200': { description: 'OK' } } },
        patch: { summary: 'Assign, escalate, approve/send draft', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/tickets/{id}/messages': { post: { summary: 'Reply, note, or request draft', responses: { '200': { description: 'OK' } } } },
      '/api/v1/employees': { get: { summary: 'List employees', responses: { '200': { description: 'OK' } } } },
      '/api/v1/employees/{id}': { get: { summary: 'Get employee', responses: { '200': { description: 'OK' } } } },
      '/api/v1/employees/{id}/workload': { get: { summary: 'Employee workload', responses: { '200': { description: 'OK' } } } },
      '/api/v1/agents': { get: { summary: 'List agents', responses: { '200': { description: 'OK' } } } },
      '/api/v1/agents/{id}': {
        get: { summary: 'Get agent', responses: { '200': { description: 'OK' } } },
        patch: { summary: 'Pause / resume agent', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/agent-runs': { get: { summary: 'List agent runs', responses: { '200': { description: 'OK' } } } },
      '/api/v1/agent-runs/{id}': { get: { summary: 'Get agent run', responses: { '200': { description: 'OK' } } } },
      '/api/v1/agent-runs/{id}/retry': { post: { summary: 'Retry eligible failed run', responses: { '200': { description: 'OK' } } } },
      '/api/v1/reports': {
        get: { summary: 'List reports', responses: { '200': { description: 'OK' } } },
        post: { summary: 'Queue a new report', responses: { '201': { description: 'Created' } } },
      },
      '/api/v1/reports/{id}': { get: { summary: 'Get report', responses: { '200': { description: 'OK' } } } },
      '/api/v1/reports/{id}/regenerate': { post: { summary: 'Queue immutable new revision', responses: { '200': { description: 'OK' } } } },
      '/api/v1/approvals': { get: { summary: 'List approvals', responses: { '200': { description: 'OK' } } } },
      '/api/v1/approvals/{id}/decide': { post: { summary: 'Approve or reject', responses: { '200': { description: 'OK' } } } },
      '/api/v1/events': { get: { summary: 'SSE live events', responses: { '200': { description: 'Event stream' } } } },
      '/api/v1/admin/fixtures': { get: { summary: 'All fixture IDs and suggested tests', responses: { '200': { description: 'OK' } } } },
      '/api/v1/admin/reset': { post: { summary: 'Reset mock workspace', responses: { '200': { description: 'OK' } } } },
    },
    components: {},
  }
}

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Agentcy mock API  http://localhost:${info.port}/docs`)
  console.log(`Fixtures           http://localhost:${info.port}/api/v1/admin/fixtures`)
  console.log(`Dashboard brief    http://localhost:${info.port}/api/v1/dashboard/briefing`)
})
