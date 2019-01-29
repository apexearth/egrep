const {exec} = require('child_process')
const {promisify} = require('util')
const {expect} = require('chai')
const execp = promisify(exec)

const runNode = cmd => {
    return execp(`node src/cli.js ${cmd.slice(10)}`)
}
const runEgrep = cmd => {
    return execp(process.platform === 'win32' ? `sh  + ${cmd}` : cmd)
}

const compare = async cmd => {
    const {stdout: nodeOutput} = await runNode(cmd)
    const {stdout: grepOutput} = await runEgrep(cmd.slice(5))
    console.log('cmd: ', cmd)
    console.log('\tnodeOutput: ', JSON.stringify(nodeOutput))
    console.log('\tgrepOutput: ', JSON.stringify(grepOutput))
    expect(nodeOutput).to.equal(grepOutput)
}

describe('cli', () => {
    describe('comparisons', () => {
        it('single file test', async () => {
            await compare('node-egrep 123 test_files/numbers')
        })
        it('recursive file test', async () => {
            await compare('node-egrep -r 123 test_files')
        })
        it('case insensitive file test', async () => {
            await compare('node-egrep -i A test_files/file1.txt')
        })
    })
    it('glob file test', async () => {
        const {stdout: nodeOutput} = await runNode('node-egrep -g abc "test_files/**"')
        expect(nodeOutput).to.equal(
            'test_files/one/abc:abcdefg\n' +
            'test_files/one/two/letters:abc\n')
    })
    it('help output', async () => {
        const {stdout: nodeOutput} = await runNode('node-egrep -h')
        expect(nodeOutput.startsWith('Usage: node-egrep')).to.equal(true)
    })
    describe('bad input', () => {
        const test = (cmd, done) => {
            runNode(cmd)
                .then((stdout, stderr) => {
                    console.log('stdout:', stdout)
                    console.log('stderr:', stderr)
                    done('Command was unexpectedly successful.')
                })
                .catch(err => {
                    expect(err.code).to.equal(1)
                    expect(err.stderr).to.contain('missing required argument')
                    done()
                })
                .catch(done)
        }
        it('no arguments', done => {
            test('node-egrep', done)
        })
        it('no file argument', done => {
            test('node-egrep one', done)
        })
    })
})
