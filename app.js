const Promise = require('./src/index')

const p1 = Promise.resolve(1)

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(2)
  }, 1000)
})

const p3 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(3)
  }, 100)
})

Promise.all([p2, p3, p1]).then(data => {
  console.log(data)
}, error => {
  console.log(error)
})