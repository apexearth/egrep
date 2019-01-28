const {exec} = require('child_process')
const {promisify} = require('util')
const {expect} = require('chai')
const execp = promisify(exec)

const runNode = cmd => {
    return execp(`node src/cli.js ${cmd.slice(10)}`)
}
const runEgrep = cmd => {
    return execp(cmd)
}

const compare = async cmd => {
    const {stdout: nodeOutput} = await runNode(cmd)
    const {stdout: grepOutput} = await runEgrep(cmd.slice(5))
    expect(nodeOutput).to.equal(grepOutput)
    console.log('Result: ', nodeOutput.trim())
}

describe('cli', () => {
    describe('comparisons', () => {
        it('single file test', async () => {
            await compare('node-egrep 123 test_files/numbers')
        })
        it('recursive file test', async () => {
            await compare('node-egrep -r 123 test_files/numbers')
        })
        it('case insensitive file test', async () => {
            await compare('node-egrep -i A test_files/file1.txt')
        })
    })
    it('glob file test', async () => {
        const {stdout: nodeOutput} = await runNode('node-egrep -g abc test_files/\\*\\*')
        expect(nodeOutput).to.equal(
            'test_files/one/abc:abcdefg\n' +
            'test_files/one/two/letters:abc\n')
    })
    it('help output', async () => {
        const {stdout: nodeOutput} = await runNode('node-egrep -h')
        expect(nodeOutput.startsWith('Usage: node-egrep')).to.equal(true)
    })
})
