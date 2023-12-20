import { AutoScalingClient } from '@aws-sdk/client-auto-scaling';
import { awsClientConfig, listAutoScalingGroups } from './asg';
import { getConfig } from './config';

export async function main() {
	const { stage, app } = getConfig();
	const msg = `Hello from ${app} in ${stage}! The time is ${new Date().toString()}`;

	const client = new AutoScalingClient(awsClientConfig(stage));

	const autoScalingGroups = await listAutoScalingGroups(client);

	console.log(`Total ASGs ${autoScalingGroups.length}`);

	autoScalingGroups.forEach((_) => console.log(_.AutoScalingGroupARN));

	console.log(msg);
	return msg;
}
