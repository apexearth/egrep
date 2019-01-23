const {expect} = require('chai')
const grep = require('./grep')

describe('grep', () => {
    it('set log level', done => {
        let stream = grep({
            files: ['*']
        })
        stream.on('data', data => {
            console.log(data)
        })
        stream.on('close', done)
    })
})
