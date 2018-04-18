class Promise {
  constructor(executor) {
    this._state = 'pending'
    this.data = undefined
    this.onResolvedCallbacks = []
    this.onRejectedCallbacks = []

    try {
      executor(this.resolve.bind(this), this.reject.bind(this))
    } catch (e) {
      this.reject.call(this, e)
    }
  }

  resolve(result) {
    setTimeout(() => {
      if (this._state !== 'pending') return
      this._state = 'resolved'
      this.data = result

      for (let fn of this.onResolvedCallbacks) {
        fn(result)
      }
    })
  }

  reject(error) {
    setTimeout(() => {
      if (this._state !== 'pending') return
      this._state = 'rejected'
      this.data = error
      for (let fn of this.onRejectedCallbacks) {
        fn(error)
      }
    })
  }

  then(onResolved, onRejected) {
    onResolved =
      typeof onResolved === 'function'
        ? onResolved
        : function(v) {
            return v
          }
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : function(e) {
            throw e
          }

    let promise

    if (this._state === 'resolved') {
      return (promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          invokePromiseCallback(onResolved, this.data, promise, resolve, reject)
        })
      }))
    } else if (this._state === 'rejected') {
      return (promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          invokePromiseCallback(onRejected, this.data, promise, resolve, reject)
        })
      }))
    } else if (this._state === 'pending') {
      return (promise = new Promise((resolve, reject) => {
        this.onResolvedCallbacks.push(function(result) {
          invokePromiseCallback(onResolved, result, promise, resolve, reject)
        })
        this.onRejectedCallbacks.push(function(error) {
          invokePromiseCallback(onRejected, error, promise, resolve, reject)
        })
      }))
    }
  }

  catch(onRejected) {
    return this.then(null, onRejected)
  }

  static resolve(result) {
    const promise = new Promise((resolve, reject) => {
      resolvePromise(undefined, result, resolve, reject)
    })
    return promise
  }

  static reject(error) {
    return new Promise((resolve, reject) => reject(error))
  }
}

function invokePromiseCallback(cb, data, promise, resolve, reject) {
  try {
    const ret = cb(data)
    resolvePromise(promise, ret, resolve, reject)
  } catch (e) {
    reject(e)
  }
}

function resolvePromise(promise, ret, resolve, reject) {
  let then
  let thenCalledOrThrow = false
  if (promise === ret) {
    return reject(new TypeError('检测到 promise 的循环引用'))
  }
  if (ret !== null && (typeof ret === 'object' || typeof ret === 'function')) {
    try {
      then = ret.then
      if (typeof then === 'function') {
        then.call(
          ret,
          function(r) {
            if (thenCalledOrThrow) return
            thenCalledOrThrow = true
            resolvePromise(promise, r, resolve, reject)
          },
          function(e) {
            if (thenCalledOrThrow) return
            thenCalledOrThrow = true
            reject(e)
          }
        )
      } else {
        resolve(ret)
      }
    } catch (e) {
      if (thenCalledOrThrow) return
      thenCalledOrThrow = true
      reject(e)
    }
  } else {
    resolve(ret)
  }
}

module.exports = Promise
