import deferralMiddleware from '../src/deferral-middleware';

import {
  GET_COMMIT,
  GET_COMMITS,
  GET_LAST,
  GET_REPO,
  GET_REPOS,
  increaseExecutionCount,
  decreaseRemaining,
  deferAction
} from '../src/actions';

const create = (mw, remaining) => {
  const store = {
    getState: jest.fn(() => ({
      remaining
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

test('deferral middleware skips over uninteresting stuff', () => {
  const {
    next,
    invoke
  } = create(deferralMiddleware);
  invoke({
    type: 'ignored'
  });
  expect(next.mock.calls.length).toBe(1);
  expect(next).toBeCalledWith({
    type: 'ignored'
  });
});

const types = [
  GET_COMMIT,
  GET_COMMITS,
  GET_LAST,
  GET_REPO,
  GET_REPOS
];
let i = 0;
for (; i < types.length; i++) {
  const type = types[i];
  test(`deferral middleware defers if we have no remaining capacity for ${type}`, () => {
    const {
      next,
      invoke,
      store
    } = create(deferralMiddleware, 0);
    invoke({
      type,
      payload: 'foo'
    });
    expect(store.dispatch.mock.calls.length).toBe(3);
    expect(store.dispatch.mock.calls[0]).toEqual([increaseExecutionCount()]);
    expect(store.dispatch.mock.calls[1]).toEqual([decreaseRemaining()]);
    expect(store.dispatch.mock.calls[2]).toEqual([deferAction({
      type,
      payload: 'foo'
    })]);
    expect(next.mock.calls.length).toBe(0);
  });
  
  test(`deferral middleware defers if we have remaining capacity for ${type}`, () => {
    const {
      next,
      invoke,
      store
    } = create(deferralMiddleware, 10);
    invoke({
      type,
      payload: 'foo'
    });
    expect(store.dispatch.mock.calls.length).toBe(2);
    expect(store.dispatch.mock.calls[0]).toEqual([increaseExecutionCount()]);
    expect(store.dispatch.mock.calls[1]).toEqual([decreaseRemaining()]);
    expect(next.mock.calls.length).toBe(1);
    expect(next).toBeCalledWith({
      type,
      payload: 'foo'
    });
  });
}