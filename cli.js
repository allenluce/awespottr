#!/usr/bin/env node
const _ = require('lodash')
const AWS = require('aws-sdk')
const chalk = require('chalk')
const moment = require('moment')
const commander = require('commander')

let lowPrice = false
let lowZone = false

async function getRegions(instanceTypes) {
  const ec2 = new AWS.EC2({apiVersion: '2016-04-01', region: 'us-east-2'})
  const data = await ec2.describeRegions().promise()
  if (!data || !data.Regions)
    throw new Error("Did not get region data from AWS")
  const rData = []
  for (let region of data.Regions) {
    const result = await getRegionSpots(region, instanceTypes)
    if (result) rData.push(result)
  }
  return _.flatten(rData)
}

function uniqByZoneAndType(instances) {
  return _.uniqBy(instances, i => i.zone + " " + i.itype)
}

async function getRegionSpots(region, instanceTypes) {
  const ec2 = new AWS.EC2({apiVersion: '2016-04-01', region: region.RegionName})
  const params = {
    InstanceTypes: instanceTypes,
    ProductDescriptions: ['Linux/UNIX', 'Linux/UNIX (Amazon VPC)'],
    StartTime: moment().subtract(4, 'hours').utc().toDate()
  }
  let data
  try {
    data = await ec2.describeSpotPriceHistory(params).promise()
  } catch (err) {
    if (err.code && err.code === 'AuthFailure') // Continue on auth failure
      return console.error(chalk.red(`Auth failure in region ${region.RegionName}`))
    throw err
  }

  if (!data || !data.SpotPriceHistory) return
  const instances = []
  for (let sdata of data.SpotPriceHistory) {
    if (sdata.SpotPrice && sdata.Timestamp && sdata.AvailabilityZone) {
      const sdate = moment(sdata.Timestamp)
      if (!lowPrice || Number(sdata.SpotPrice) < lowPrice) {
        lowPrice = Number(sdata.SpotPrice)
        lowZone = sdata.AvailabilityZone
      }
      instances.push({
        lastDate: sdate,
        lastPrice: sdata.SpotPrice,
        zone: sdata.AvailabilityZone,
        itype: sdata.InstanceType
      })
    }
  }
  return uniqByZoneAndType(instances)
}

function handleResults (results, n, instanceTypes) {
  console.log('\n' + _.padEnd('Instance Type', 16) + ' ' + _.padEnd('AWS Zone', 24) + ' ' + _.padEnd('Hourly Rate', 12))
  console.log(_.pad('', 16, '-') + ' ' + _.pad('', 24, '-') + ' ' + _.pad('', 12, '-'))
  sortedInstances = _.sortBy(results, val => Number(val.lastPrice), 'zone')
  if (n > 0) {
    sortedInstances = sortedInstances.slice(0, n)
  }
  for (let data of sortedInstances) {
    let msg = _.padEnd(data.itype, 16) + ' ' + _.padEnd(data.zone, 24) + ' ' + _.padEnd('$' + data.lastPrice, 12)
    if (data.zone === lowZone && Number(data.lastPrice) === Number(lowPrice)) {
      msg = chalk.green(msg)
    } else if (lowPrice * 1.1 >= data.lastPrice) {
      msg = chalk.yellow(msg)
    }
    console.log(msg)
  }
  if (!lowPrice) 
    return console.log(chalk.yellow('No data found, did you specify a valid instance type?'))
  console.log('\n' + chalk.green('Cheapest hourly rate for [' + instanceTypes.join(', ') + '] is $' + lowPrice + ' in zone ' + lowZone))
}

exports.standalone = async function () {
  lowPrice = false
  lowZone = false
  const program = new commander.Command()
  program
    .version('0.4.0')
    .usage('[options] <EC2 instance types ...>')
    .option('-r, --region <AWS region>', 'Limit to the given region')
    .option('-n, --number <number to show>', 'Only show the top few cheapest spots')
    .parse(process.argv)

  if (program.args.length == 0) {
    return program.outputHelp()
  }

  const instanceTypes = program.args
  console.log('Checking spot prices for [' + instanceTypes.join(', ') + '] instance type(s).')

  let output
  if (program.region) {
    console.log('Limiting results to region ' + program.region)
    output = await getRegionSpots({RegionName: program.region}, instanceTypes)
  } else {
    output = await getRegions(instanceTypes)
  }
  return handleResults(output, program.number, instanceTypes)
}

if (!module.parent) {
  exports.standalone().catch(console.error)
}
