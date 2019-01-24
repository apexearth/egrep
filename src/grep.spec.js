const {expect} = require('chai')
const grep = require('./grep')

let test = (options, expectation, done) => {
    let stream = grep(options)
    let datas = []
    stream.on('data', data => {
        if (stream.isObjectMode) {
            datas.push(data)
        } else {
            datas.push(data.toString())
        }
    })
    stream.on('error', err => {
        stream.removeAllListeners()
        done(err)
    })
    stream.on('close', () => {
        expect(datas).to.deep.equal(expectation)
        done()
    })
}

describe('grep', () => {
    describe('basics', () => {
        it('files is required', () => {
            expect(() => grep({
                files: undefined
            })).to.throw()
        })
        it('pattern is required', () => {
            expect(() => grep({
                files: ['.'],
                pattern: undefined
            })).to.throw()
        })
        it('basic requirements fulfilled', () => {
            expect(() => grep({
                files: ['.'],
                pattern: 'abc'
            })).to.not.throw()
        })
    })
    describe('functionality', () => {
        it('abc', done => {
            test({
                files: ['test_files/one/abc'],
                pattern: 'abc'
            }, [
                {file: 'test_files/one/abc', line: 'abcdefg'}
            ], done)
        })
        it('abc (objectMode: false)', done => {
            test({
                objectMode: false,
                files: ['test_files/one/abc'],
                pattern: 'abc'
            }, [
                'test_files/one/abc:abcdefg'
            ], done)
        })
        it('abc (recursive: true)', done => {
            test({
                recursive: true,
                files: ['test_files/one'],
                pattern: 'abc'
            }, [
                {file: 'test_files/one/abc', line: 'abcdefg'},
                {file: 'test_files/one/two/letters', line: 'abc'}
            ], done)
        })
        it('abc (glob: true)', done => {
            test({
                glob: true,
                files: ['test_files/one/**'],
                pattern: 'abc'
            }, [
                {file: 'test_files/one/abc', line: 'abcdefg'},
                {file: 'test_files/one/two/letters', line: 'abc'}
            ], done)
        })
    })
})
