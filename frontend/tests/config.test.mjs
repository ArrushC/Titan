import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppConfig } from '../src/utils/AppConfig.ts';
import { validateBranchConfig } from '../src/utils/branchConfigValidation.ts';

const config = () => new AppConfig(JSON.stringify({ integrations: { trello: { key: '', token: '' } }, ignoredPaths: { unknown: [], modified: [] } }), () => {}, 1000, false);

test('duplicate commit variables fail without changing existing values', async () => {
  const app = config();
  await app.addCommitVariable('ticket', 'ABC-123', 'Ticket', true);
  await assert.rejects(app.addCommitVariable('ticket', 'other'), /already exists/);
  const variables = app.getCommitVariables().filter(v => v.name === 'ticket');
  assert.equal(variables.length, 1);
  assert.equal(variables[0].defaultValue, 'ABC-123');
});

test('editing a cloned configuration leaves the original untouched until saved', async () => {
  const app = config();
  await app.addCommitVariable('ticket', 'ABC-123');
  const draft = app.clone();
  draft.setAutosaveEnabled(false);
  await draft.updateCommitVariable('ticket', { defaultValue: 'ABC-456', required: true });
  assert.equal(app.getCommitVariables().find(v => v.name === 'ticket').defaultValue, 'ABC-123');
  const restored = new AppConfig(draft.toJson(), () => {}, 1000, false);
  assert.equal(restored.getCommitVariables().find(v => v.name === 'ticket').defaultValue, 'ABC-456');
  assert.equal(restored.getCommitVariables().find(v => v.name === 'ticket').required, true);
});

test('branch import accepts a valid working-copy configuration', () => {
  const result = validateBranchConfig(JSON.stringify({
    folders: { project: { color: '#123456', branchIds: ['trunk'], order: 0 } },
    branches: { trunk: { branchVersion: 'Trunk', branchPath: 'C:\\SVN\\project\\trunk' } }
  }));
  assert.equal(result.isValid, true, result.errors.join('\n'));
});

test('branch import rejects malformed JSON and missing configuration sections', () => {
  for (const value of ['{', 'null', '{}', '{"folders":{}}']) {
    assert.equal(validateBranchConfig(value).isValid, false, value);
  }
});
