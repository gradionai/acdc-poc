import { Router, type Request, type Response } from 'express';

/** OpenAPI 3.1 document describing every route in the API. */
const spec = {
  openapi: '3.1.0',
  info: {
    title: 'ACDC Notes API',
    version: '0.1.0',
    description: 'In-memory notes API with attachment support.',
  },
  servers: [{ url: '/api', description: 'Current host' }],
  components: {
    schemas: {
      Note: {
        type: 'object',
        required: ['id', 'title', 'body', 'tags', 'createdAt', 'pinned'],
        properties: {
          id: { type: 'string', example: '1' },
          title: { type: 'string', example: 'My first note' },
          body: { type: 'string', example: 'Hello, world!' },
          tags: { type: 'array', items: { type: 'string' }, example: ['work', 'idea'] },
          createdAt: {
            type: 'number',
            description: 'Monotonic insertion counter (not a wall-clock timestamp).',
            example: 1,
          },
          pinned: { type: 'boolean', example: false },
        },
      },
      AttachmentMeta: {
        type: 'object',
        required: ['filename', 'contentType', 'size'],
        properties: {
          filename: { type: 'string', example: 'photo.png' },
          contentType: { type: 'string', example: 'image/png' },
          size: { type: 'integer', description: 'Byte length.', example: 4096 },
        },
      },
      HealthResponse: {
        type: 'object',
        required: ['status', 'uptime'],
        properties: {
          status: { type: 'string', enum: ['ok'], example: 'ok' },
          uptime: { type: 'number', description: 'Process uptime in seconds.', example: 42.3 },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', example: 'not found' },
        },
      },
      CreateNoteRequest: {
        type: 'object',
        required: ['title', 'body'],
        properties: {
          title: { type: 'string', example: 'My note' },
          body: { type: 'string', example: 'Note body text.' },
          tags: { type: 'array', items: { type: 'string' }, example: ['alpha', 'beta'] },
        },
      },
      UpdateNoteRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Updated title' },
          body: { type: 'string', example: 'Updated body.' },
          tags: { type: 'array', items: { type: 'string' }, example: ['new-tag'] },
        },
        description: 'At least one of title, body, or tags must be provided.',
      },
    },
    responses: {
      NotFound: {
        description: 'Resource not found.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      BadRequest: {
        description: 'Invalid request payload.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health / liveness check',
        operationId: 'getHealth',
        tags: ['system'],
        security: [],
        responses: {
          '200': {
            description: 'Server is healthy.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/openapi.json': {
      get: {
        summary: 'OpenAPI specification',
        operationId: 'getOpenApiSpec',
        tags: ['system'],
        security: [],
        responses: {
          '200': {
            description: 'OpenAPI 3.x document.',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/notes': {
      get: {
        summary: 'List notes',
        operationId: 'listNotes',
        tags: ['notes'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: '1-based page number.',
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 10 },
            description: 'Number of items per page.',
          },
          {
            name: 'q',
            in: 'query',
            schema: { type: 'string' },
            description: 'Full-text search term (case-insensitive, matches title or body).',
          },
          {
            name: 'tag',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter notes that include this tag (case-insensitive exact match).',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of notes. Pinned notes sort before unpinned.',
            headers: {
              'X-Total-Count': {
                schema: { type: 'integer' },
                description: 'Total number of notes matching the current filter.',
              },
            },
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Note' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a note',
        operationId: 'createNote',
        tags: ['notes'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateNoteRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Note created.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Note' } },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/notes/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Note ID.',
        },
      ],
      get: {
        summary: 'Get a single note',
        operationId: 'getNote',
        tags: ['notes'],
        responses: {
          '200': {
            description: 'Note found.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Note' } },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Update a note (partial update)',
        operationId: 'updateNote',
        tags: ['notes'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateNoteRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Note updated.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Note' } },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete a note',
        operationId: 'deleteNote',
        tags: ['notes'],
        responses: {
          '204': { description: 'Note deleted.' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/notes/{id}/pin': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Note ID.',
        },
      ],
      patch: {
        summary: 'Toggle pin on a note',
        operationId: 'togglePinNote',
        tags: ['notes'],
        responses: {
          '200': {
            description: 'Updated note with toggled pinned field.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Note' } },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/notes/{id}/attachments': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Note ID.',
        },
      ],
      get: {
        summary: 'List attachments for a note',
        operationId: 'listAttachments',
        tags: ['attachments'],
        responses: {
          '200': {
            description: 'List of attachment metadata.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AttachmentMeta' },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        summary: 'Upload an attachment to a note',
        operationId: 'uploadAttachment',
        tags: ['attachments'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description:
                      'File to upload. Max 5 MB. ' +
                      'Allowed types: image/png, image/jpeg, image/gif, image/webp, ' +
                      'application/pdf, text/plain, text/csv, application/json.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Attachment uploaded.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AttachmentMeta' } },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '413': {
            description: 'Attachment limit (20 per note) reached or file too large.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/notes/{id}/attachments/{name}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Note ID.',
        },
        {
          name: 'name',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Attachment filename.',
        },
      ],
      get: {
        summary: 'Download an attachment',
        operationId: 'downloadAttachment',
        tags: ['attachments'],
        responses: {
          '200': {
            description: 'Raw file bytes with the original content type.',
            content: { '*/*': { schema: { type: 'string', format: 'binary' } } },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
};

export function createOpenApiRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json(spec);
  });

  return router;
}
