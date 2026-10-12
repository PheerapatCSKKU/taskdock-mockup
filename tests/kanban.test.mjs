import assert from 'node:assert/strict';
import test from 'node:test';
import { movableTask } from '../src/lib/tasks.ts';

const tasks = [{ id: 'a', status: 'todo' }];

test('a board drop moves only its current task to another status', () => {
  assert.equal(movableTask(tasks, 'a', 'a', 'doing'), tasks[0]);
  assert.equal(movableTask(tasks, 'a', 'a', 'todo'), undefined);
  assert.equal(movableTask(tasks, 'a', 'external', 'doing'), undefined);
  assert.equal(movableTask(tasks, 'removed', 'removed', 'doing'), undefined);
  assert.equal(movableTask(tasks, null, 'a', 'doing'), undefined);
});
