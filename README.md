> [!NOTE]
> This project is not intended to be long-lived!
> It's a temporary solution to help us identify any common issues with auto-scaling groups.
> Questions? Talk with https://github.com/orgs/guardian/teams/dotcom-platform or https://github.com/akash1810.

# AWS ASG Monitor

A scheduled lambda, running once a day, that will:
1. List all AWS accounts in the organisation
2. For each account, list all auto-scaling groups
3. For each auto-scaling group, list the activity history
4. Log the activity history in a structured way so that it can be queried in Central ELK

> [!NOTE]
> The lambda collects all available activity per run.
> That is each invocation will produce duplicate log lines,
> therefore the lambda is run once a day.

With the logs appearing in Central ELK, 
we can now see how many instances failed 
to exit the [pending state](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html)
by [searching for "Pending" in the logs](https://logs.gutools.co.uk/s/devx/goto/75f28320-9f7d-11ee-aa13-8913ead7bd05) 
(you may need to adjust the time range).

## Links
- [Deployments](https://riffraff.gutools.co.uk/deployment/history?projectName=tools%3A%3Aaws-asg-monitor&page=1)
- [Logs](https://logs.gutools.co.uk/s/devx/goto/8a786b20-9f7d-11ee-ad66-7befba95a84c) (you may need to adjust the time range)
