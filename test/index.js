const promisesAplusTests = require('promises-aplus-tests')

const Promise = require('./promise')

promisesAplusTests(Promise, function(err) {
  if (err) {
    console.log(err)
  }
})
