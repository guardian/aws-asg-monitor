import { GuScheduledLambda } from '@guardian/cdk';
import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuStack } from '@guardian/cdk/lib/constructs/core';
import type { App } from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export class AwsAsgMonitor extends GuStack {
	constructor(scope: App, id: string, props: GuStackProps) {
		super(scope, id, props);

		/**
		 * A GuLambdaFunction comes with the following batteries included:
		 *   - IAM permissions to read from SSM Parameter store
		 *   - STACK, STAGE, APP environment variables
		 *
		 * @see The `__snapshots__` directory for more.
		 */
		const lambda = new GuScheduledLambda(this, 'AwsAsgMonitor', {
			// TODO add monitoring if this service is going to exist long-term.
			monitoringConfiguration: { noMonitoring: true },

			// Run once a day.
			rules: [
				{
					schedule: Schedule.rate(Duration.days(1)),
				},
			],

			/**
			 * This becomes the value of the APP tag on provisioned resources.
			 */
			app: 'aws-asg-monitor',

			/**
			 * This is the name of artifact in S3.
			 */
			fileName: 'aws-asg-monitor.zip',

			/**
			 * The format of this is `<filename>.<exported function>`.
			 *
			 * The file `packages/lambda/src/index.ts` has an exported function named `main`.
			 */
			handler: 'index.main',

			/**
			 * The runtime of the lambda function.
			 *
			 * Should align with `.nvmrc` at the root of the repository.
			 */
			runtime: Runtime.NODEJS_20_X,

			/**
			 * Allow the lambda to run for the maximum time.
			 */
			timeout: Duration.minutes(15),

			/**
			 * Allow the lambda to use up to 1GB of memory.
			 */
			memorySize: 1024,
		});

		/*
			A bit of a hack... this role is used by Service Catalogue,
			and has read access to all our accounts.

			Yes, we are not following the principle of least privilege,
			but this repository isn't meant to be running for very long...

			See https://github.com/guardian/aws-account-setup/blob/main/packages/cdk/lib/constructs/cloudquery-role.ts.

			TODO provision a dedicated role for this service.
			 */
		lambda.addToRolePolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				resources: [`arn:aws:iam::*:role/cloudquery-access`],
				actions: ['sts:AssumeRole'],
			}),
		);

		lambda.addToRolePolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				resources: ['*'],
				actions: ['organizations:List*'],
			}),
		);
	}
}
