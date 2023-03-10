const { getDatabaseClient, rollback} = require('../database/postgresql')
const { insertIntoPullRequest, selectPullRequestBynumber } = require('./pull_request_event_received')

const insertIntoPrLabels = `INSERT INTO "pr_labels"
        ("pull_request_id", "label")
        VALUES($1, $2)
        ON CONFLICT (pull_request_id, label) DO UPDATE SET
        pull_request_id=EXCLUDED.pull_request_id,
        label=EXCLUDED.label;`;
const deleteFromPrLabels = `DELETE FROM "pr_labels"
        WHERE "pull_request_id" = $1 and "label" = $2`;

async function pullrequestLabeled(context, app) {
    console.log("pull_request.labeled received.");
    const client = await getDatabaseClient();
    console.log("Database connected.");
    const pullRequestId = context.payload.pull_request.number;
    const label = context.payload.label.name;

    const pullRequestTitle = context.payload.pull_request.title;
    const pullRequestCreatedAt = context.payload.pull_request.created_at;
    const pullRequestClosedAt = context.payload.pull_request.closed_at;
    const pullRequestMergedAt = context.payload.pull_request.merged_at;
    let pullReqestStatus = context.payload.pull_request.state.toLowerCase();
    if (context.payload.pull_request.merged) {
        pullReqestStatus = "merged";
    }
    
    try {
        const prRes = await client.query(selectPullRequestBynumber, [pullRequestId]);
        if (prRes.rowCount == 0) {
            console.log("No pull request found, insert it.");
            await client.query(insertIntoPullRequest,
                [pullRequestId, pullRequestTitle, pullRequestCreatedAt, pullRequestClosedAt, pullRequestMergedAt, pullReqestStatus])
                .then(() => console.log(`Inserted issue/pull request ${pullRequestId}`))
                .catch((err) => console.error('ERROR: Error INSERT INTO pull_requests.', err.stack));
        }

        console.log("Before INSERT into pr_labels.");
        await client.query(insertIntoPrLabels, [pullRequestId, label])
            .then(() => console.log("Done INSERT into pr_labels."))
            .catch((err) => console.error('Insert into pr_labels failed', err.stack));
    }
    finally {
        await client.end();
    }
}

async function pullrequestUnlabeled(context, app) {
    const client = await getDatabaseClient();
    const pullRequestId = context.payload.pull_request.number;
    const label = context.payload.label.name;

    await client.query(deleteFromPrLabels, [pullRequestId, label])
        .then(() => console.log(`Label ${label} removed from issue/pullrequest ${pullRequestId}`))
        .catch((err) => console.error('ERROR: DELETE FROM pr_labels failed.', err.stack));
    await client.end();
}

module.exports = { pullrequestLabeled, pullrequestUnlabeled, insertIntoPrLabels }
