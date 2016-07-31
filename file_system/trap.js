"use strict";

class FileSystemTrap {
  constructor(cache) {
    this.cache = cache;
    this.bindings = Object.create(null);
    this.boundFiles = Object.create(null);
    this.triggerOnChange = Object.create(null);
  }
  isFile(path) {
    return this.cache.isFile(path)
      .then(isFile => {
        const bindings = this._getFileBindings(path);
        if (bindings.isFile === undefined) {
          bindings.isFile = isFile;
        }
        return isFile;
      });
  }
  stat(path) {
    this._ensureBindingToFile(path);
    this.triggerOnChange[path] = true;
    return this.cache.stat(path)
      .then(stat => {
        const bindings = this._getFileBindings(path);
        bindings.isFile = true;
        if (bindings.modifiedTime === undefined) {
          bindings.modifiedTime = stat.mtime.getTime();
        }
        return stat;
      });
  }
  readModifiedTime(path) {
    this._ensureBindingToFile(path);
    this.triggerOnChange[path] = true;
    return this.cache.readModifiedTime(path)
      .then(modifiedTime => {
        const bindings = this._getFileBindings(path);
        bindings.isFile = true;
        bindings.modifiedTime = modifiedTime;
        return modifiedTime;
      });
  }
  readBuffer(path) {
    this._ensureBindingToFile(path);
    this.triggerOnChange[path] = true;
    return this.cache.readBuffer(path)
      .then(buffer => {
        // Rely on `readModifiedTime` to bind its dependencies
        return this.readModifiedTime(path)
          .then(() => buffer);
      });
  }
  readText(path) {
    this._ensureBindingToFile(path);
    this.triggerOnChange[path] = true;
    return this.cache.readText(path)
      .then(text => {
        // Rely on `readTextHash` to bind its dependencies
        return this.readTextHash(path)
          .then(() => text);
      });
  }
  readTextHash(path) {
    this._ensureBindingToFile(path);
    this.triggerOnChange[path] = true;
    return this.cache.readTextHash(path)
      .then(textHash => {
        // Rely on `readModifiedTime` to bind its dependencies
        return this.readModifiedTime(path)
          .then(() => {
            const bindings = this._getFileBindings(path);
            if (bindings.textHash === undefined) {
              bindings.textHash = textHash;
            }
            return textHash;
          });
      });
  }
  describeDependencies() {
    return this.bindings;
  }
  _ensureBindingToFile(path) {
    if (this.boundFiles[path] === undefined) {
      this.boundFiles[path] = true;
      this.cache._bindTrapToFile(this, path);
    }
  }
  _getFileBindings(path) {
    let bindings = this.bindings[path];
    if (!bindings) {
      bindings = {};
      this.bindings[path] = bindings;
      this._ensureBindingToFile(path);
    }
    return bindings;
  }
}

module.exports = {
  FileSystemTrap
};