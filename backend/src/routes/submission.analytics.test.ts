import { afterAll, beforeAll, describe, expect, spyOn, test } from 'bun:test';
import express from 'express';
import { createServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { config } from '@/config';
import { Form } from '@/models/Froms.model';
import { Submission } from '@/models/Submissin.model';
import router from './submission.route';

// Only database calls are stubbed; routing, authorization, validation, and
// response serialization execute through the real Express endpoint.
const ownedFormId = new Types.ObjectId();
const userId = new Types.ObjectId().toHexString();
const findForms = spyOn(Form, 'find').mockReturnValue({ select: async () => [{ _id: ownedFormId }] } as never);
const aggregate = spyOn(Submission, 'aggregate').mockResolvedValue([{ _id: '2026-01', count: 5 }, { _id: '2026-03', count: 2 }]);
const app = express();
app.use('/submission', router);
const server = createServer(app);
let origin = '';
const token = jwt.sign({ userId }, config.jwt.secret);

beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not bind.');
  origin = `http://127.0.0.1:${address.port}/submission/analytics/submissions-over-time`;
});

afterAll(async () => {
  findForms.mockRestore();
  aggregate.mockRestore();
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
});

describe('submission analytics endpoint', () => {
  test('requires authorization', async () => {
    const response = await fetch(origin);
    expect(response.status).toBe(401);
  });

  test('returns calendar-year totals, fills empty months, and restricts data to owned forms', async () => {
    const response = await fetch(`${origin}?startDate=2026-01-01&endDate=2026-12-31&groupBy=month`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.totalSubmissions).toBe(7);
    expect(body.data.submissions).toHaveLength(12);
    expect(body.data.submissions[1].count).toBe(0);
    expect(body.data.groupBy).toBe('month');
    expect(findForms).toHaveBeenLastCalledWith({ userId });
    const pipeline = aggregate.mock.calls.at(-1)?.[0];
    expect(pipeline?.[0]).toEqual({ $match: { formId: { $in: [ownedFormId] }, submittedAt: { $gte: new Date('2026-01-01T00:00:00Z'), $lt: new Date('2027-01-01T00:00:00Z') } } });
  });

  test('rejects malformed calendar ranges before querying the database', async () => {
    const calls = aggregate.mock.calls.length;
    const response = await fetch(`${origin}?startDate=2026-02-30&endDate=2026-03-01`, { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status).toBe(400);
    expect(aggregate.mock.calls.length).toBe(calls);
  });

  test('retains the existing days query', async () => {
    const response = await fetch(`${origin}?days=7`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.periodDays).toBe(7);
    expect(body.data.submissions).toHaveLength(7);
  });
});
