import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AutoCryptoHonoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const fn = new NodejsFunction(this, 'lambda', {
      functionName: "AutoCryptoFunction",
      entry: 'src/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      layers: [], // 作成したレイヤーを追加
      timeout: cdk.Duration.seconds(20),
      memorySize: 256,
      environment: {
        ROOT_URL: '/opt', // レイヤー内のアセットを参照するために設定
      },
    })
    fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    })
    new apigw.LambdaRestApi(this, 'myapi', {
      handler: fn,
    })

    // CloudWatch Eventsルールを作成
    new cdk.aws_events.Rule(this, 'AutoCryptoScheduleRule', {
      ruleName: "AutoCryptoScheduleRule",
      // 1分ごとに実行
      schedule: cdk.aws_events.Schedule.cron({ minute: '*' }),
      targets: [new cdk.aws_events_targets.LambdaFunction(fn)],
    });
  }
}
