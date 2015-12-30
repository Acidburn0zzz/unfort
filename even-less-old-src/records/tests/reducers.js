import imm from 'immutable';
import {assert} from '../../utils/assert';
import {addSignal, addSignalHandler} from '../actions';
import {signalsReducer} from '../reducers';

describe('core/signals/reducers', () => {
  describe('#signalsReducer', () => {
    it('should initialize state correctly', () => {
      const initialState = signalsReducer(undefined, {});
      assert.equal(initialState, imm.Map());
    });
    describe('{ADD_SIGNAL}', () => {
      it('should handle signal additions', () => {
        let state = signalsReducer(undefined, addSignal('test'));
        assert.equal(
          state,
          imm.fromJS({
            test: []
          })
        );

        state = signalsReducer(state, addSignal('another'));
        assert.equal(
          state,
          imm.fromJS({
            test: [],
            another: []
          })
        );
      });
      it('should throw if a duplicate signal is added', () => {
        let state = signalsReducer(undefined, addSignal('test'));
        const action = addSignal('test');
        assert.throws(
          () => signalsReducer(state, action),
          'Signal "test" has already been added'
        );
      });
    });
    describe('{ADD_SIGNAL_HANDLER}', () => {
      it('should handle signal additions and handler additions', () => {
        let state = imm.Map({
          test: imm.List()
        });
        let handler1 = () => {};
        let handler2 = () => {};

        state = signalsReducer(state, addSignalHandler('test', handler1));
        assert.equal(
          state,
          imm.fromJS({
            test: [handler1]
          })
        );

        state = signalsReducer(state, addSignalHandler('test', handler2));
        assert.equal(
          state,
          imm.fromJS({
            test: [handler1, handler2]
          })
        );
      });
    });
    it('should throw if a handler is added to a missing signal', () => {
      const action = addSignalHandler('test', () => {});
      assert.throws(
        () => signalsReducer(undefined, action),
        'Signal "test" has not been defined'
      );
    });
  });
});