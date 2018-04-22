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
    // 为了实现值得传递，但没有注册回调时默认添加一个将值直接返回的函数
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

    if (this._state !== 'pending') {
      const cb = this._state === 'resolved' ? onResolved : onRejected
      return (promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          invokePromiseCallback(cb, this.data, promise, resolve, reject)
        })
      }))
    } else {
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
    return new Promise((resolve, reject) => {
      resolvePromise(undefined, result, resolve, reject)
    })
  }

  static reject(error) {
    return new Promise((resolve, reject) => reject(error))
  }

  static all(promises) {
    return new Promise((resolve, reject) => {
      const len = promises.length
      const resolvedValues = new Array(len)
      let resolvedCount = 0
      for (let i = 0; i < len; i++) {
        Promise.resolve(promises[i]).then(
          data => {
            resolvedCount += 1
            resolvedValues[i] = data
            if (resolvedCount === len) {
              resolve(resolvedValues)
            }
          },
          error => {
            reject(error)
          }
        )
      }
    })
  }

  static race(promises) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < len; i++) {
        Promise.resolve(promises[i]).then(
          data => {
            resolve(resolvedValues)
          },
          error => {
            reject(error)
          }
        )
      }
    })
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
  // 兼容带 then 方法的对象
  let then
  // 其它 thenable 的函数并不一定标准实现的，所以需要一个 flag 防止多次改变 promise 的状态
  let settled = false
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
            if (settled) return
            settled = true
            resolvePromise(promise, r, resolve, reject)
          },
          function(e) {
            if (settled) return
            settled = true
            reject(e)
          }
        )
      } else {
        resolve(ret)
      }
    } catch (e) {
      if (settled) return
      settled = true
      reject(e)
    }
  } else {
    resolve(ret)
  }
}

module.exports = Promise
