const {exec} = require('child_process')
const {promisify} = require('util')
const {expect} = require('chai')
const execp = promisify(exec)

const runNode = cmd => {
    return execp(`node src/cli.js ${cmd.slice(5)}`)
}
const runEgrep = cmd => {
    return execp(cmd)
}

describe('cli', () => {
    it('single file test', async () => {
        const {stdout: nodeOutput} = await runNode('egrep 123 test_files/numbers')
        const {stdout: grepOutput} = await runEgrep('egrep 123 test_files/numbers')
        expect(nodeOutput).to.equal(grepOutput)
    })
    it('recursive file test', async () => {
        const {stdout: nodeOutput} = await runNode('egrep -r 123 test_files/numbers')
        const {stdout: grepOutput} = await runEgrep('egrep -r 123 test_files/numbers')
        expect(nodeOutput).to.equal(grepOutput)
    })

})
