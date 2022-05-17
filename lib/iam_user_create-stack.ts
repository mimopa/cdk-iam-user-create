import { Stack, StackProps, SecretValue, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { readFileSync } from "fs";

// Get hand on Users from file
const handsonUsers = readFileSync('./user.txt', {
  encoding: "utf8",
}).toString().split("\n");

export class IamUserCreateStack extends Stack
{
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Get existing group(arnはパラメータストアから取得する)
    const groupArn = StringParameter.valueForStringParameter(this, 'CabcsHandsonGroupArn');
    const handsonGroup = iam.Group.fromGroupArn(this, 'Group', groupArn);
    
    // Get existing policy
    const loggingManagedPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      'IAMUserChangePassword',
    );

    // Get default password(arnはパラメータストアから取得する)
    const secretArn = StringParameter.valueForStringParameter(this, 'SecretPasswordArn');
    const secret = secretsmanager.Secret.fromSecretAttributes(this, 'handsonUserPassword', { secretPartialArn: secretArn });
    
    // Create Handson User
    handsonUsers.forEach(handsonUser =>
    {
      new iam.User(this, handsonUser, {
        userName: handsonUser,
        groups: [handsonGroup],
        managedPolicies: [loggingManagedPolicy],
        password: SecretValue.plainText(secret.secretValueFromJson('iam_default_password').toString()),
        passwordResetRequired: true,
      })

    });

  }
}
