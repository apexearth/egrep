const glob = require('./glob')
const {expect} = require('chai')

describe('glob', () => {
    it('test root', done => {
        glob('./', (err, result) => {
            if (err) return done(err)
            expect(result).to.include('package.json')
            done()
        })
    })
    it('test package.json', done => {
        glob('package.json', (err, result) => {
            if (err) return done(err)
            expect(result).to.deep.equal(['package.json'])
            done()
        })
    })
    it('test package*.json', done => {
        glob('package*.json', (err, result) => {
            if (err) return done(err)
            expect(result).to.deep.equal([
                'package-lock.json',
                'package.json'
            ])
            done()
        })
    })
    it('test test_files/**', done => {
        glob('test_files/**', (err, result) => {
            if (err) return done(err)
            expect(result).to.deep.equal([
                'test_files/numbers',
                'test_files/one/abc',
            ])
            done()
        })
    })
})
