import type { Activity } from '@aws-sdk/client-auto-scaling';
import { AutoScalingClient } from '@aws-sdk/client-auto-scaling';
import {
	awsClientConfig,
	getActivities,
	getAwsAccounts,
	listAutoScalingGroups,
} from './aws';
import { getConfig } from './config';

export async function main() {
	const { stage } = getConfig();

	const accounts = await getAwsAccounts(stage);
	console.log(`Total accounts ${accounts.length}`);

	await Promise.all(
		accounts.map(async (account) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- AWS's types are wrong!
			const accountId = account.Id!;

			/*
			A bit of a hack... this role is used by Service Catalogue,
			and has read access to all our accounts.

			Yes, we are not following the principle of least privilege,
			but this repository isn't meant to be running for very long...

			See https://github.com/guardian/aws-account-setup/blob/main/packages/cdk/lib/constructs/cloudquery-role.ts.

			TODO provision a dedicated role for this service.
			 */
			const roleArn = `arn:aws:iam::${accountId}:role/cloudquery-access`;

			const client = new AutoScalingClient(awsClientConfig(stage, roleArn));
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
