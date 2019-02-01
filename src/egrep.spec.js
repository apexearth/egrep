const {expect} = require('chai')
const egrep = require('./egrep')
const {promisify} = require('util')
const fs = require('fs')

const largeFilePath = 'test_files/large_file'

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
            if (stream.isObjectMode) {
                expect(
                    datas.sort((a, b) => a.file < b.file ? 1 : -1)
                ).to.deep.equal(
                    expectation.sort((a, b) => a.file < b.file ? 1 : -1)
                )
            } else {
                expect(datas.sort()).to.deep.equal(expectation.sort())
            }
            resolve()
        })
    })
}
let createLargeFile = async (testFile, testString) => {
    const ws = fs.createWriteStream(testFile)
    const write = promisify((data, done) => ws.write(data, done))
    const close = promisify((done) => ws.close(done))
    const buffer = Buffer.allocUnsafe(32 * 1024).fill('0123456789')
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
    after(() => {
        if (fs.existsSync(largeFilePath)) {
            fs.unlinkSync(largeFilePath)
        }
    })
    describe('examples', () => {
        const _require = require
        it('Node.js Usage Example 1', () => {
            const require = module => _require(`./${module}`)
            let egrep = require('egrep')
            let stream = egrep({
                pattern: /test[1-9]/,
                files: [
                    'test_files/file1.txt',
                    'test_files/',
                ],
                recursive: true,
                glob: false,
                ignoreCase: false,
            })
            stream.on('data', data => {
                console.log(data)
            })
            stream.on('error', err => {
                console.log(err)
            })
            stream.on('close', () => {
                console.log('closed')
            })
        })
        it('Node.js Usage Example 2', () => {
            const require = module => _require(`./${module}`)
            let egrep = require('egrep')
            let stream = egrep({
                pattern: /test[1-9]/,
                files: [
                    'test_files/file1.txt',
                    'test_files/',
                ],
                recursive: true,
                glob: false,
                ignoreCase: false,
                objectMode: false,
            })
            stream.on('data', data => {
                console.log(data.toString())
            })
            stream.on('error', err => {
                console.log(err)
            })
            stream.on('close', () => {
                console.log('closed')
            })
        })
        it('Use with callback in objectMode', done => {
            egrep({
                pattern: /test[1-9]/,
                files: [
                    'test_files/file1.txt',
                    'test_files/',
                ],
                recursive: true,
            }, (err, result) => {
                if (err) return done(err)
                expect(result).to.deep.equal([
                    {
                        'file': 'test_files/file1.txt',
                        'line': 'aaaaaaatest4aaaaaaa'
                    },
                ])
                return done()
            })
        })
        it('Use with callback not in objectMode', done => {
            egrep({
                pattern: /test[1-9]/,
                files: [
                    'test_files/file1.txt',
                    'test_files/',
                ],
                recursive: true,
                objectMode: false,
            }, (err, result) => {
                if (err) return done(err)
                expect(result).to.equal(
                    'test_files/file1.txt:aaaaaaatest4aaaaaaa\n'
                )
                return done()
            })
        })
    })
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
                pattern: /[a-p]/,
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
                {'file': 'test_files/file1.txt', 'line': '09876'},
                {'file': 'test_files/file1.txt', 'line': 'aaaaaaatest4aaaaaaa'},
                {'file': 'test_files/numbers', 'line': '1234567890'},
                {'file': 'test_files/one/abc', 'line': 'abcdefg'},
                {'file': 'test_files/one/two/letters', 'line': 'abc'},
                {'file': 'test_files/one/two/letters', 'line': 'thanks'},
                {'file': 'test_files/binary', 'line': 'Binary content match.'},
                {'file': 'test_files/binary', 'line': 'Binary content match.'},
                {'file': 'test_files/binary', 'line': 'Binary content match.'}
            ])
        })
        it('binary match', async () => {
            await test({
                files: ['test_files/binary'],
                pattern: 'L',
            }, [
                {'file': 'test_files/binary', 'line': 'Binary content match.'},
                {'file': 'test_files/binary', 'line': 'Binary content match.'}
            ])
        })
        it('large file test', async () => {
            const testString = 'hey, what are you doing?'
            await createLargeFile(largeFilePath, testString)
            await test({
                recursive: true,
                files: ['test_files'],
                pattern: 'hey.+?',
            }, [
                {'file': largeFilePath, 'line': testString},
            ])
            fs.unlinkSync(largeFilePath)
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
                'abcdefg'
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
                files: ['test_files/**'],
                pattern: 'abc'
            }, [
                {file: 'test_files/one/abc', line: 'abcdefg'},
                {file: 'test_files/one/two/letters', line: 'abc'}
            ])
        })
        it('fullBinaryMatches: true', async () => {
            await test({
                files: ['test_files/binary'],
                pattern: 'L',
                fullBinaryMatches: true,
            }, [
                {
                    'file': 'test_files/binary',
                    'line': 'L\u0000\u0000\u0000\u0001\u0014\u0002\u0000\u0000\u0000\u0000\u0000�\u0000\u0000\u0000' +
                        '\u0000\u0000\u0000F�\u0000\b\u0000\u0016\u0000\u0000\u00006\u001f'
                },
                {
                    'file': 'test_files/binary',
                    'line': '\u0000\u0000\u0000\u0000\u001f\u0000\u0000\u0000\u0010\u0000\u0000\u0000L\u0000o\u0000c' +
                        '\u0000a\u0000l\u0000 \u0000D\u0000i\u0000s\u0000k\u0000 \u0000(\u0000C\u0000:\u0000)\u0000' +
                        '\u0000\u0000)\u0000\u0000\u0000'
                }
            ])
        })
        it('hideBinaryMatches: true', async () => {
            await test({
                recursive: true,
                files: ['test_files'],
                pattern: '([a-c]|[0-9])',
                hideBinaryMatches: true,
            }, [
                {'file': 'test_files/file1.txt', 'line': '09876'},
                {'file': 'test_files/file1.txt', 'line': 'aaaaaaatest4aaaaaaa'},
                {'file': 'test_files/numbers', 'line': '1234567890'},
                {'file': 'test_files/one/abc', 'line': 'abcdefg'},
                {'file': 'test_files/one/two/letters', 'line': 'abc'},
                {'file': 'test_files/one/two/letters', 'line': 'thanks'},
            ])
        })
        it('excludes', async () => {
            await test({
                recursive: true,
                files: ['test_files'],
                pattern: '([a-c]|[0-9])',
                excludes: [/binary/, /letters/, 'numbers']
            }, [
                {'file': 'test_files/file1.txt', 'line': '09876'},
                {'file': 'test_files/file1.txt', 'line': 'aaaaaaatest4aaaaaaa'},
                {'file': 'test_files/one/abc', 'line': 'abcdefg'},
            ])
        })
    })
    describe('bad input', () => {
        it('files are not strings', () => {
            expect(() => egrep({
                files: [{name: 'test_files/numbers'}],
                pattern: 'abc',
            })).to.throw()
        })
        it('pattern is not a string or RegExp', () => {
            expect(() => egrep({
                files: ['test_files/numbers'],
                pattern: {abc: 123},
            })).to.throw()
        })
    })
})
