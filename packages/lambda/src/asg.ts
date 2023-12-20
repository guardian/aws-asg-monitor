import type {
	AutoScalingClient,
	AutoScalingGroup,
} from '@aws-sdk/client-auto-scaling';
import { paginateDescribeAutoScalingGroups } from '@aws-sdk/client-auto-scaling';
import {
	fromIni,
	fromTemporaryCredentials,
} from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentityProvider } from '@smithy/types';

interface AwsClientConfig {
	region: string;
	credentials?: AwsCredentialIdentityProvider;
}

export function awsClientConfig(
	stage: string,
	roleArn?: string,
	region = 'eu-west-1',
): AwsClientConfig {
	return {
		region,

		/*
  If DEV (i.e. running locally), get credentials from the ini file.
  Else, use the standard SDK behaviour of locating credentials through a chain of locations.

  See https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-credential-providers/.
  */
		...(stage === 'DEV' && {
			credentials: fromIni({ profile: 'deployTools' }),
		}),

		/*
  If not DEV, and a roleArn is provided, assume that role.
  Cannot do this in DEV as Janus credentials deny role assumptions.
   */
		...(stage !== 'DEV' &&
			roleArn && {
				credentials: fromTemporaryCredentials({
					params: { RoleArn: roleArn },
				}),
			}),
	};
}

export async function listAutoScalingGroups(
	client: AutoScalingClient,
): Promise<AutoScalingGroup[]> {
	const autoScalingGroups = [];

	for await (const page of paginateDescribeAutoScalingGroups(
		{ client, pageSize: 10 },
		{},
	)) {
		autoScalingGroups.push(...(page.AutoScalingGroups ?? []));
	}

	return autoScalingGroups;
}
