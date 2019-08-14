const RESULTS = {
  'eu-north-1': {
    'm5.metal': [
      { AvailabilityZone: 'eu-north-1c',
        InstanceType: 'm5.metal',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '0.917300',
        Timestamp: '2019-03-06T00:54:47.000Z' },
      { AvailabilityZone: 'eu-north-1b',
        InstanceType: 'm5.metal',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '0.917300',
        Timestamp: '2019-03-06T00:54:47.000Z' },
      { AvailabilityZone: 'eu-north-1a',
        InstanceType: 'm5.metal',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '0.917300',
        Timestamp: '2019-03-06T00:54:47.000Z' }
    ],
    'm5.24xlarge': [
      { AvailabilityZone: 'eu-north-1a',
        InstanceType: 'm5.24xlarge',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '0.957800',
        Timestamp: '2019-03-06T00:54:47.000Z' },
      { AvailabilityZone: 'eu-north-1b',
        InstanceType: 'm5.24xlarge',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.457100',
        Timestamp: '2019-03-06T00:54:47.000Z' },
      { AvailabilityZone: 'eu-north-1c',
        InstanceType: 'm5.24xlarge',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.457100',
        Timestamp: '2019-03-06T00:54:47.000Z' }
      ]
  },
  'us-east-1': {
    'm5.metal': [
      { AvailabilityZone: 'us-east-1a',
        InstanceType: 'm5.metal',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.088200',
        Timestamp: '2019-03-05T22:05:47.000Z' },
      { AvailabilityZone: 'us-east-1f',
        InstanceType: 'm5.metal',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.088200',
        Timestamp: '2019-03-05T22:05:47.000Z' },
      { AvailabilityZone: 'us-east-1d',
        InstanceType: 'm5.metal',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.088200',
        Timestamp: '2019-03-05T22:05:47.000Z' }
    ],
    'm5.24xlarge': [
      { AvailabilityZone: 'us-east-1a',
        InstanceType: 'm5.24xlarge',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '0.957800',
        Timestamp: '2019-03-06T00:54:47.000Z' },
      { AvailabilityZone: 'us-east-1b',
        InstanceType: 'm5.24xlarge',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.457100',
        Timestamp: '2019-03-06T00:54:47.000Z' },
      { AvailabilityZone: 'us-east-1c',
        InstanceType: 'm5.24xlarge',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.457100',
        Timestamp: '2019-03-06T00:54:47.000Z' }
    ]
  },
  'us-west-2': {
    'm5.metal': [
      { AvailabilityZone: 'us-west-2c',
        InstanceType: 'm5.metal',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.081800',
        Timestamp: '2019-03-05T21:40:30.000Z' },
      { AvailabilityZone: 'us-west-2a',
        InstanceType: 'm5.metal',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.081800',
        Timestamp: '2019-03-05T21:40:30.000Z' },
      { AvailabilityZone: 'us-west-2b',
        InstanceType: 'm5.metal',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.081800',
        Timestamp: '2019-03-05T21:40:30.000Z' }
    ],
    'm5.24xlarge': [
      { AvailabilityZone: 'us-west-2a',
        InstanceType: 'm5.24xlarge',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '0.957800',
        Timestamp: '2019-03-06T00:54:47.000Z' },
      { AvailabilityZone: 'us-west-2b',
        InstanceType: 'm5.24xlarge',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.457100',
        Timestamp: '2019-03-06T00:54:47.000Z' },
      { AvailabilityZone: 'us-west-2c',
        InstanceType: 'm5.24xlarge',
        ProductDescription: 'Linux/UNIX',
        SpotPrice: '1.457100',
        Timestamp: '2019-03-06T00:54:47.000Z' }
    ]

  }
}


module.exports = class EC2Stub {
  constructor (params) {
    this.region = params.region
  }

  describeRegions(params = {}, callback) {
    callback(null, {
      Regions: [
        { Endpoint: 'ec2.eu-north-1.amazonaws.com',
          RegionName: 'eu-north-1' },
        { Endpoint: 'ec2.us-east-1.amazonaws.com',
          RegionName: 'us-east-1' },
        { Endpoint: 'ec2.us-west-2.amazonaws.com',
          RegionName: 'us-west-2' }
      ]
    })
  }
  describeSpotPriceHistory(params = {}, callback) {
    const results = {
      NextToken: '',
      SpotPriceHistory: []
    }
    for (let itype of params.InstanceTypes) {
      if (RESULTS[this.region][itype]) {
        results.SpotPriceHistory = results.SpotPriceHistory.concat(RESULTS[this.region][itype])
      }
    }
    callback(null, results)
  }
}
