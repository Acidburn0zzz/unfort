import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import {assert} from '../../utils/assert';
import {createKVFileCache, generateFilenameFromCacheKey} from '../kv_file_cache';

describe('caches/persistent_cache', () => {
  describe('#generateFilenameFromCacheKey', () => {
    it('should accept a string and return a file named after a hex digest', () => {
      assert.equal(
        generateFilenameFromCacheKey('test'),
        '098f6bcd4621d373cade4e832627b4f6.json'
      );
    });
  });
  describe('#createKVFileCache', () => {
    const dirname = path.join(__dirname, 'cache_test_dir');

    // Ensure that data does not persist across tests
    function removeDirname(cb) {
      rimraf(dirname, (err) => {
        if (err) return cb(err);
        cb();
      });
    }
    beforeEach(removeDirname);
    after(removeDirname);

    it('should should throw if `dirname` is not specified', () => {
      try {
        createKVFileCache();
      } catch(err) {
        assert.equal(err.message, 'A `dirname` option must be provided')
      }
    });

    it('should be able to read from a cache directory', (done) => {
      mkdirp.sync(dirname);

      fs.writeFileSync(
        path.join(dirname, '098f6bcd4621d373cade4e832627b4f6.json'),
        JSON.stringify({foo: 'bar'})
      );

      const cache = createKVFileCache({dirname});

      cache.get('test', (err, data) => {
        assert.isNull(err);
        assert.deepEqual(data, {foo: 'bar'});

        cache.get('missing', (err, data) => {
          assert.isNull(err);
          assert.isNull(data);
          done();
        });
      });
    });
    it('should be able to write to a cache directory', (done) => {
      const cache = createKVFileCache({dirname});

      cache.set('test', {bar: 'foo'}, (err) => {
        assert.isNull(err);

        assert.equal(
          fs.readFileSync(path.join(dirname, '098f6bcd4621d373cade4e832627b4f6.json'), 'utf8'),
          JSON.stringify({bar: 'foo'})
        );

        done();
      });
    });
    it('should be able to read and write from the cache', (done) => {
      const cache = createKVFileCache({dirname});

      cache.get('test', (err, data) => {
        assert.isNull(err);
        assert.isNull(data);

        cache.set('test', {foo: 'bar'}, (err) => {
          assert.isNull(err);

          cache.get('test', (err, data) => {
            assert.isNull(err);
            assert.deepEqual(data, {foo: 'bar'});
            done();
          });
        });
      });
    });
    it('should be able to invalidate an entry in the cache', (done) => {
      const cache = createKVFileCache({dirname});

      cache.set('test', {foo: 'bar'}, (err) => {
        assert.isNull(err);

        cache.invalidate('test', (err) => {
          assert.isNull(err);

          cache.get('test', (err, data) => {
            assert.isNull(err);
            assert.isNull(data);
            done();
          });
        });
      });
    });
    it('should remove the cache file when invalidating an entry', (done) => {
      const cache = createKVFileCache({dirname});

      cache.set('test', {foo: 'bar'}, (err) => {
        assert.isNull(err);

        const stat = fs.statSync(path.join(dirname, '098f6bcd4621d373cade4e832627b4f6.json'));
        assert.isTrue(stat.isFile());

        cache.invalidate('test', (err) => {
          assert.isNull(err);

          fs.stat(path.join(dirname, '098f6bcd4621d373cade4e832627b4f6.json'), (err) => {
            assert.instanceOf(err, Error);
            assert.equal(err.code, 'ENOENT');
            done();
          });
        });
      });
    });
  });
});