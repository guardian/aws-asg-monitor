import type { Activity } from '@aws-sdk/client-auto-scaling';
import { AutoScalingClient } from '@aws-sdk/client-auto-scaling';
import { awsClientConfig, getActivities, listAutoScalingGroups } from './asg';
import { getConfig } from './config';

export async function main() {
	const { stage } = getConfig();

	const client = new AutoScalingClient(awsClientConfig(stage));

	const autoScalingGroups = await listAutoScalingGroups(client);
	console.log(`Total ASGs ${autoScalingGroups.length}`);

	await Promise.all(
		autoScalingGroups.map(async (asg) => {
			const asgName = asg.AutoScalingGroupName;

			if (!asgName) {
				throw new Error('ASG name is undefined');
			}

			const activities = await getActivities(client, asgName);
			console.log(`Total activities for ${asgName}: ${activities.length}`);

			activities.forEach(logActivity);
		}),
	);
}

// Logs activity as stringified JSON so that the fields appear in Central ELK.
// Prefix each	key with `AsgActivity.` to avoid conflicts with other fields.
function logActivity(activity: Activity) {
	const toLog = Object.entries(activity).reduce((acc, [key, value]) => {
		const newKey = `AsgActivity.${key}`;
		return {
			...acc,
			[newKey]: value as unknown,
		};
	}, {});
	console.log(JSON.stringify(toLog));
}
