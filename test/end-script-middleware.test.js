import endScriptMiddleware from '../src/end-script-middleware';

import {
  END_SCRIPT,
} from '../src/actions';

const create = (mw, scriptEnded) => {
  const store = {
    getState: jest.fn(() => ({
      scriptEnded
    })),
    dispatch: jest.fn(),
  };
  const next = jest.fn();
  const invoke = (action) => mw(store)(next)(action);
  return {
    store,
    next,
    invoke
  };
};

test('end script middleware skips over uninteresting stuff', () => {
  const {
    next,
    invoke
  } = create(endScriptMiddleware);
  invoke({
    type: 'ignored'
  });
  expect(next.mock.calls.length).toBe(1);
  expect(next).toBeCalledWith({
    type: 'ignored'
  });
});

test('end script middleware passes through ends script if it has not been ended yet', () => {
  const {
    next,
    invoke,
    store
  } = create(endScriptMiddleware, false);
  invoke({
    type: END_SCRIPT
  });
  expect(next.mock.calls.length).toBe(1);
  expect(next).toBeCalledWith({
    type: END_SCRIPT
  });
});

test('end script middleware swallows end script if it has been ended', () => {
  const {
    next,
    invoke,
    store
  } = create(endScriptMiddleware, true);
  invoke({
    type: END_SCRIPT
  });
  expect(next.mock.calls.length).toBe(0);
});