#!/usr/bin/env node

var _ = require('lodash');
var AWS = require('aws-sdk');
var chalk = require('chalk');
var moment = require('moment');
var commander = require('commander');

var lowPrice = false;
var lowZone = false;

exports.getRegions = function (instanceTypes) {
  return new Promise(function(resolve, reject) {
    var ec2 = new AWS.EC2({apiVersion: '2016-04-01', region: 'us-east-2'});
    ec2.describeRegions({}, function(err, data) {
      if (err) {
        reject(err);
        return;
      }
      if (data && data.Regions) {
        var promises = _.map(data.Regions, region => exports.getRegionSpots(region, instanceTypes))
        Promise.all(promises).then(resolve).catch(reject);
      } else {
        reject(new Error("Did not get region data from AWS"));
        return;
      }
    });
  }).then(_.flatten);
}

function uniqByZoneAndType(instances) {
  return _.uniqBy(instances, i => i.zone + " " + i.itype)
}

exports.getRegionSpots = function (region, instanceTypes) {
  return new Promise(function(resolve, reject) {
    var ec2 = new AWS.EC2({apiVersion: '2016-04-01', region: region.RegionName});
    var params = {
      InstanceTypes: instanceTypes,
      ProductDescriptions: ['Linux/UNIX', 'Linux/UNIX (Amazon VPC)'],
      StartTime: moment().subtract(4, 'hours').utc().toDate()
    };
    ec2.describeSpotPriceHistory(params, function(err, data) {
      if (err) {
        if (err.code && err.code === 'AuthFailure') {
          console.error(chalk.red(`Auth failure in region ${region.RegionName}`))
          resolve()
          return
        } else {
          reject(err);
          return;
        }
      }
      if (data && data.SpotPriceHistory) {
        var instances = _.map(data.SpotPriceHistory, sdata => {
          if (sdata.SpotPrice && sdata.Timestamp && sdata.AvailabilityZone) {
            var sdate = moment(sdata.Timestamp);
            if (!lowPrice || Number(sdata.SpotPrice) < lowPrice) {
              lowPrice = Number(sdata.SpotPrice);
              lowZone = sdata.AvailabilityZone;
            }
            return {
              lastDate: sdate,
              lastPrice: sdata.SpotPrice,
              zone: sdata.AvailabilityZone,
              itype: sdata.InstanceType
            };
          }
        });
        resolve(instances);
      }
    });
  }).then(uniqByZoneAndType);
}

function handleResults (results, n, instanceTypes) {
  console.log('\n' + _.padEnd('Instance Type', 16) + ' ' + _.padEnd('AWS Zone', 24) + ' ' + _.padEnd('Hourly Rate', 12));
  console.log(_.pad('', 16, '-') + ' ' + _.pad('', 24, '-') + ' ' + _.pad('', 12, '-'));
  sortedInstances = _.sortBy(results, val => Number(val.lastPrice), 'zone');
  if (n > 0) {
    sortedInstances = sortedInstances.slice(0, n)
  }
  _.each(sortedInstances, function(data) {
    var msg = _.padEnd(data.itype, 16) + ' ' + _.padEnd(data.zone, 24) + ' ' + _.padEnd('$' + data.lastPrice, 12);
    if (data.zone === lowZone && Number(data.lastPrice) === Number(lowPrice)) {
      msg = chalk.green(msg);
    } else if (lowPrice * 1.1 >= data.lastPrice) {
      msg = chalk.yellow(msg);
    }
    console.log(msg);
  });
  if (lowPrice) {
    console.log('\n' + chalk.green('Cheapest hourly rate for [' + instanceTypes.join(', ') + '] is $' + lowPrice + ' in zone ' + lowZone));
  } else {
    console.log(chalk.yellow('No data found, did you specify a valid instance type?'));
  }
}

exports.standalone = function () {
  lowPrice = false;
  lowZone = false;
  const program = new commander.Command();
  program
    .version('0.4.0')
    .usage('[options] <EC2 instance types ...>')
    .option('-r, --region <AWS region>', 'Limit to the given region')
    .option('-n, --number <number to show>', 'Only show the top few cheapest spots')
    .parse(process.argv);

  if (program.args.length == 0) {
    program.outputHelp()
    return Promise.resolve()
  }

  const instanceTypes = program.args
  console.log('Checking spot prices for [' + instanceTypes.join(', ') + '] instance type(s).');

  if (program.region) {
    console.log('Limiting results to region ' + program.region);
    return exports.getRegionSpots({RegionName: program.region}, instanceTypes).then(_.curryRight(handleResults)(program.number, instanceTypes))
  } else {
    return exports.getRegions(instanceTypes).then(_.curryRight(handleResults)(program.number, instanceTypes))
  }
}

if (!module.parent) {
  exports.standalone().catch(console.error)
}
