const {expect} = require('chai')
const grep = require('./grep')

let test = async (options, expectation) => {
    return new Promise((resolve, reject) => {
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
            reject(err)
        })
        stream.on('close', () => {
            expect(datas).to.deep.equal(expectation)
            resolve()
        })
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
    describe('defaults', () => {
        it('abc', async () => {
            await test({
                files: ['test_files/one/abc'],
                pattern: 'abc'
            }, [
                {file: 'test_files/one/abc', line: 'abcdefg'}
            ])
        })
        it('abc case failure', async () => {
            await test({
                files: ['test_files/one/abc'],
                pattern: 'aBc',
            }, [])
        })
        it('abc case failure', async () => {
            await test({
                files: ['test_files/one/abc'],
                pattern: 'aBc',
            }, [])
        })
    })
    describe('options', () => {
        it('ignoreCase: true', async () => {
            await test({
                files: ['test_files/one/abc'],
                pattern: 'aBc',
                ignoreCase: true,
            }, [
                {file: 'test_files/one/abc', line: 'abcdefg'}
            ])
        })
        it('objectMode: false', async () => {
            await test({
                objectMode: false,
                files: ['test_files/one/abc'],
                pattern: 'abc'
            }, [
                'test_files/one/abc:abcdefg'
            ])
        })
        it('recursive: true', async () => {
            await test({
                recursive: true,
                files: ['test_files/one'],
                pattern: 'abc'
            }, [
                {file: 'test_files/one/abc', line: 'abcdefg'},
                {file: 'test_files/one/two/letters', line: 'abc'}
            ])
        })
        it('glob: true', async () => {
            await test({
                glob: true,
                files: ['test_files/one/**'],
                pattern: 'abc'
            }, [
                {file: 'test_files/one/abc', line: 'abcdefg'},
                {file: 'test_files/one/two/letters', line: 'abc'}
            ])
        })
    })
})

