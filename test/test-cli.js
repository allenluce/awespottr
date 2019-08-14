'use strict'
/* global describe it */
const expect = require('chai').expect
const sinon = require('sinon')
const AWS = require('aws-sdk')
const cli = require('../cli')
const it = require('./stdoutCapture')
const EC2Stub = require('./ec2-stub')

describe('Awespottr', function () {
  beforeEach(function () {
    sinon.stub(AWS, 'EC2').callsFake(args => new EC2Stub(args))
  })
  afterEach(function () {
    AWS.EC2.restore()
  })
  it('does an all-region lookup with a single instance type', function () {
    process.argv = ['node', 'cli.js', 'm5.metal']
    return cli.standalone().then(() => {
      expect(it.inspect.output).to.deep.equal([
        'Checking spot prices for [m5.metal] instance type(s).\n',
        '\nInstance Type    AWS Zone                 Hourly Rate \n',
        '---------------- ------------------------ ------------\n',
        '\u001b[33mm5.metal         eu-north-1a              $0.917300   \u001b[39m\n',
        '\u001b[33mm5.metal         eu-north-1b              $0.917300   \u001b[39m\n',
        '\u001b[32mm5.metal         eu-north-1c              $0.917300   \u001b[39m\n',
        'm5.metal         us-west-2a               $1.081800   \n',
        'm5.metal         us-west-2b               $1.081800   \n',
        'm5.metal         us-west-2c               $1.081800   \n',
        'm5.metal         us-east-1a               $1.088200   \n',
        'm5.metal         us-east-1d               $1.088200   \n',
        'm5.metal         us-east-1f               $1.088200   \n',
        '\n\u001b[32mCheapest hourly rate for [m5.metal] is $0.9173 in zone eu-north-1c\u001b[39m\n'
        ])
    })
  })
  it('does a all-region lookup with multiple instance types', function () {
    process.argv = ['node', 'cli.js', 'm5.metal', 'm5.24xlarge']
    return cli.standalone().then(() => {
      expect(it.inspect.output).to.deep.equal([
        'Checking spot prices for [m5.metal, m5.24xlarge] instance type(s).\n',
        '\nInstance Type    AWS Zone                 Hourly Rate \n',
        '---------------- ------------------------ ------------\n',
        '\u001b[33mm5.metal         eu-north-1a              $0.917300   \u001b[39m\n',
        '\u001b[33mm5.metal         eu-north-1b              $0.917300   \u001b[39m\n',
        '\u001b[32mm5.metal         eu-north-1c              $0.917300   \u001b[39m\n',
        '\u001b[33mm5.24xlarge      eu-north-1a              $0.957800   \u001b[39m\n',
        '\u001b[33mm5.24xlarge      us-east-1a               $0.957800   \u001b[39m\n',
        '\u001b[33mm5.24xlarge      us-west-2a               $0.957800   \u001b[39m\n',
        'm5.metal         us-west-2a               $1.081800   \n',
        'm5.metal         us-west-2b               $1.081800   \n',
        'm5.metal         us-west-2c               $1.081800   \n',
        'm5.metal         us-east-1a               $1.088200   \n',
        'm5.metal         us-east-1d               $1.088200   \n',
        'm5.metal         us-east-1f               $1.088200   \n',
        'm5.24xlarge      eu-north-1b              $1.457100   \n',
        'm5.24xlarge      eu-north-1c              $1.457100   \n',
        'm5.24xlarge      us-east-1b               $1.457100   \n',
        'm5.24xlarge      us-east-1c               $1.457100   \n',
        'm5.24xlarge      us-west-2b               $1.457100   \n',
        'm5.24xlarge      us-west-2c               $1.457100   \n',
        '\n\u001b[32mCheapest hourly rate for [m5.metal, m5.24xlarge] is $0.9173 in zone eu-north-1c\u001b[39m\n'
      ])
    })
  })
  it('does a single-region lookup with a single instance type', function () { // XXX
    process.argv = ['node', 'cli.js', '-r', 'eu-north-1', 'm5.metal']
    return cli.standalone().then(() => {
      expect(it.inspect.output).to.deep.equal([
        'Checking spot prices for [m5.metal] instance type(s).\n',
        'Limiting results to region eu-north-1\n',
        '\nInstance Type    AWS Zone                 Hourly Rate \n',
        '---------------- ------------------------ ------------\n',
        '\u001b[33mm5.metal         eu-north-1a              $0.917300   \u001b[39m\n',
        '\u001b[33mm5.metal         eu-north-1b              $0.917300   \u001b[39m\n',
        '\u001b[32mm5.metal         eu-north-1c              $0.917300   \u001b[39m\n',
        '\n\u001b[32mCheapest hourly rate for [m5.metal] is $0.9173 in zone eu-north-1c\u001b[39m\n',
      ])
    })
  })
  it('does a single-region lookup with multiple instance types', function () {
    process.argv = ['node', 'cli.js', '-r', 'eu-north-1', 'm5.metal', 'm5.24xlarge']
    return cli.standalone().then(() => {
      expect(it.inspect.output).to.deep.equal([
        'Checking spot prices for [m5.metal, m5.24xlarge] instance type(s).\n',
        'Limiting results to region eu-north-1\n',
        '\nInstance Type    AWS Zone                 Hourly Rate \n',
        '---------------- ------------------------ ------------\n',
        '\u001b[33mm5.metal         eu-north-1a              $0.917300   \u001b[39m\n',
        '\u001b[33mm5.metal         eu-north-1b              $0.917300   \u001b[39m\n',
        '\u001b[32mm5.metal         eu-north-1c              $0.917300   \u001b[39m\n',
        '\u001b[33mm5.24xlarge      eu-north-1a              $0.957800   \u001b[39m\n',
        'm5.24xlarge      eu-north-1b              $1.457100   \n',
        'm5.24xlarge      eu-north-1c              $1.457100   \n',
        '\n\u001b[32mCheapest hourly rate for [m5.metal, m5.24xlarge] is $0.9173 in zone eu-north-1c\u001b[39m\n',
      ])
    })
  })
  it('does a single-region lookup with multiple instance types limited to the top 3', function () {
    process.argv = ['node', 'cli.js', '-n', '3', '-r', 'eu-north-1', 'm5.metal', 'm5.24xlarge']
    return cli.standalone().then(() => {
      expect(it.inspect.output).to.deep.equal([
        'Checking spot prices for [m5.metal, m5.24xlarge] instance type(s).\n',
        'Limiting results to region eu-north-1\n',
        '\nInstance Type    AWS Zone                 Hourly Rate \n',
        '---------------- ------------------------ ------------\n',
        '\u001b[33mm5.metal         eu-north-1a              $0.917300   \u001b[39m\n',
        '\u001b[33mm5.metal         eu-north-1b              $0.917300   \u001b[39m\n',
        '\u001b[32mm5.metal         eu-north-1c              $0.917300   \u001b[39m\n',
        '\n\u001b[32mCheapest hourly rate for [m5.metal, m5.24xlarge] is $0.9173 in zone eu-north-1c\u001b[39m\n',
      ])
    })
  })
})
