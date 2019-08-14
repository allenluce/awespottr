'use strict'
/* global describe it */
const chai = require('chai')
chai.use(require('chai-as-promised'))
const expect = chai.expect
const sinon = require('sinon')
const AWS = require('aws-sdk')
const cli = require('../cli')
const it = require('./stdoutCapture')
const EC2Stub = require('./ec2-stub')

describe('Awespottr error testing', function () {
  class ErrStub extends EC2Stub {}
  beforeEach(function () {
    this.sandbox = sinon.createSandbox()
    this.sandbox.stub(AWS, 'EC2').callsFake(args => new ErrStub(args))
  })
  afterEach(function () {
    this.sandbox.restore()
  })
  describe('with a wonky describeRegions', function () {
    beforeEach(function () {
      this.error = this.data = null
      this.sandbox.stub(ErrStub.prototype, "describeRegions").returns({
        promise: () => {
          if (this.error) throw new Error(this.error)
          return this.data
        }})
      process.argv = ['node', 'cli.js', 'm5.metal']
    })
    it('rejects when describeRegions fails', function () {
      this.error = "describeRegions errored"
      expect(cli.standalone()).to.be.rejectedWith("describeRegions errored")
    })
    it('rejects when describeRegions gives back null data', function () {
      expect(cli.standalone()).to.be.rejectedWith("Did not get region data from AWS")
    })
    it('rejects when describeRegions gives back no region data', function () {
      this.data = {}
      expect(cli.standalone()).to.be.rejectedWith("Did not get region data from AWS")
    })
    it('rejects when describeRegions gives back null region data', function () {
      this.data = {Regions: null}
      expect(cli.standalone()).to.be.rejectedWith("Did not get region data from AWS")
    })
  })
  it('rejects when describeSpotPriceHistory errors', function () {
    process.argv = ['node', 'cli.js', 'm5.metal']
    this.sandbox.stub(ErrStub.prototype, "describeSpotPriceHistory").throws(new Error("dsp errored"))
    expect(cli.standalone()).to.be.rejectedWith("dsp errored")
  })
  it('succeeds even when describeSpotPriceHistory has an authfailure for one region', async function () {
    process.argv = ['node', 'cli.js', 'm5.metal']
    this.sandbox.stub(ErrStub.prototype, "describeSpotPriceHistory").callsFake(function (params) {
      return {
        promise: () => {
          if (this.region === 'us-west-2') {
            const af = new Error("AuthFailure")
            af.code = 'AuthFailure'
            throw af
          }
          return EC2Stub.prototype.describeSpotPriceHistory.call(this, params).promise()
        }}})
    await cli.standalone()
    expect(it.inspect.output).to.deep.equal([
      'Checking spot prices for [m5.metal] instance type(s).\n',
      '\nInstance Type    AWS Zone                 Hourly Rate \n',
      '---------------- ------------------------ ------------\n',
      '\u001b[33mm5.metal         eu-north-1a              $0.917300   \u001b[39m\n',
      '\u001b[33mm5.metal         eu-north-1b              $0.917300   \u001b[39m\n',
      '\u001b[32mm5.metal         eu-north-1c              $0.917300   \u001b[39m\n',
      'm5.metal         us-east-1a               $1.088200   \n',
      'm5.metal         us-east-1d               $1.088200   \n',
      'm5.metal         us-east-1f               $1.088200   \n',
      '\n\u001b[32mCheapest hourly rate for [m5.metal] is $0.9173 in zone eu-north-1c\u001b[39m\n'
    ])
  })
  it('outputs a message when the instance type elicits no data from AWS', async function () {
    process.argv = ['node', 'cli.js', 'm5.schmacky']
    await cli.standalone()
    expect(it.inspect.output[3]).to.equal('\u001b[33mNo data found, did you specify a valid instance type?\u001b[39m\n')
  })
  it('prints help if no args are given', async function () {
    process.argv = ['node', 'cli.js']
    await cli.standalone()
    expect(it.inspect.output).to.deep.equal([[
      'Usage: cli [options] <EC2 instance types ...>',
      '',
      'Options:',
      '  -V, --version                  output the version number',
      '  -r, --region <AWS region>      Limit to the given region',
      '  -n, --number <number to show>  Only show the top few cheapest spots',
      '  -h, --help                     output usage information',
      ''
    ].join('\n')])
  })
})
