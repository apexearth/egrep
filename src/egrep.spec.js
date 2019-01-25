const {expect} = require('chai')
const egrep = require('./egrep')
const {promisify} = require('util')
const fs = require('fs')

let test = async (options, expectation) => {
    return new Promise((resolve, reject) => {
        let stream = egrep(options)
        let datas = []
        stream.on('data', data => {
            if (stream.isObjectMode) {
                datas.push(data)
            } else {
                let split = data.toString().split('\n').filter(line => line !== '')
                for (let line of split) {
                    datas.push(line)
                }
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
let createLargeFile = async (testFile, testString) => {
    const ws = fs.createWriteStream(testFile)
    const write = promisify((data, done) => ws.write(data, done))
    const close = promisify((done) => ws.close(done))
    const buffer = Buffer.allocUnsafe(32*1024).fill('0123456789')
    // Put our buffer in our file.
    for (let i = 0; i < 1000; i++) {
        if (i !== 0 && i % 501 === 0) {
            await write(`${testString}\n`)
        }
        await write(buffer)
        await write('\n')
    }
    await close()
}

describe('egrep', () => {
    describe('throws', () => {
        it('files is required', () => {
            expect(() => egrep({
                files: undefined
            })).to.throw()
        })
        it('pattern is required', () => {
            expect(() => egrep({
                files: ['.'],
                pattern: undefined
            })).to.throw()
        })
        it('basic requirements fulfilled', () => {
            expect(() => egrep({
                files: ['.'],
                pattern: 'abc'
            })).to.not.throw()
        })
    })
    describe('basics', () => {
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
            }, [
                /* No Match */
            ])
        })
        it('abc case failure', async () => {
            await test({
                files: ['test_files/one/abc'],
                pattern: 'aBc',
            }, [
                /* No Match */
            ])
        })
        it('regex pattern 1', async () => {
            await test({
                files: ['test_files/one/abc'],
                pattern: 'a[b-d]{1}',
            }, [
                {file: 'test_files/one/abc', line: 'abcdefg'}
            ])
        })
        it('regex pattern 2', async () => {
            await test({
                files: ['test_files/one/abc'],
                pattern: '[a-p]',
            }, [
                {file: 'test_files/one/abc', line: 'abcdefg'},
                {file: 'test_files/one/abc', line: 'hijklmnop'},
            ])
        })
        it('regex pattern 3', async () => {
            await test({
                files: ['test_files/one/abc'],
                pattern: 'a-z',
            }, [
                /* No Match */
            ])
        })
        it('regex pattern 4', async () => {
            await test({
                recursive: true,
                files: ['test_files'],
                pattern: '([a-c]|[0-9])',
            }, [
                {'file': 'test_files/numbers', 'line': '1234567890'},
                {'file': 'test_files/one/abc', 'line': 'abcdefg'},
                {'file': 'test_files/one/two/letters', 'line': 'abc'},
                {'file': 'test_files/one/two/letters', 'line': 'thanks'}
            ])
        })
        it('large file test', async () => {
            const testFile = 'test_files/large_file'
            const testString = 'hey, what are you doing?'
            await createLargeFile(testFile, testString)
            await test({
                recursive: true,
                files: ['test_files'],
                pattern: 'hey.+?',
            }, [
                {'file': testFile, 'line': testString},
            ])
            fs.unlinkSync(testFile)
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
