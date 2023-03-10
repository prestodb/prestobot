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
    console.log(`pullRequestId=${pullRequestId}`);
    const label = context.payload.label.name;
    console.log(`label=${label}`);

    const pullRequestTitle = context.payload.pull_request.title;
    console.log(`pullRequestTitle=${pullRequestTitle}`);
    const pullRequestCreatedAt = context.payload.pull_request.created_at;
    console.log(`pullRequestCreatedAt=${pullRequestCreatedAt}`);
    const pullRequestClosedAt = context.payload.pull_request.closed_at;
    console.log(`pullRequestClosedAt=${pullRequestClosedAt}`);
    const pullRequestMergedAt = context.payload.pull_request.merged_at;
    console.log(`pullRequestMergedAt=${pullRequestMergedAt}`);
    let pullReqestStatus = context.payload.pull_request.state.toLowerCase();
    if (context.payload.pull_request.merged) {
        pullReqestStatus = "merged";
    }
    console.log(`pullReqestStatus=${pullReqestStatus}`);
    
    console.log("Begin insert into pr_labels");
    client.query('BEGIN', (err, res) => {
        if (err) {
            console.error('Error BEGIN transaction.', err.stack);
            return rollback(client);
        }
        client.query(selectPullRequestBynumber,
            [pullRequestId],
            (err, res) => {
                if (err) {
                    console.error('Error SELECT FROM pull_requests.', err.stack);
                    return rollback(client);
                }
                if (res.rowCount == 0) {
                    console.log("No pull request found, insert it.");
                    client.query(insertIntoPullRequest,
                        [pullRequestId, pullRequestTitle, pullRequestCreatedAt, pullRequestClosedAt, pullRequestMergedAt, pullReqestStatus],
                        (err, res) => {
                            if (err) {
                                console.error('Error INSERT INTO pull_requests.', err.stack);
                                return rollback(client);
                            }
                        }
                    );
                }
                console.log("Before INSERT into pr_labels.");
                client.query(insertIntoPrLabels,
                    [pullRequestId, label],
                    (err, res) => {
                        if (err) {
                            app.log.error(`Insert into pr_labels failed:
                                ${err.message}. 
                                ${insertIntoPrLabels}`);
                            return rollback(client);
                        }
                        console.log("Done INSERT into pr_labels.");
                        client.query('COMMIT', client.end.bind(client));
                        console.log("Done COMMIT.");
                    }
                );
            }
        );
    });
}

async function pullrequestUnlabeled(context, app) {
    const client = await getDatabaseClient();
    const pullRequestId = context.payload.pull_request.number;
    const label = context.payload.label.name;

    await client.query(deleteFromPrLabels, [pullRequestId, label])
        .then(() => console.log(`Label ${label} removed from issue/pullrequest ${pullRequestId}`))
        .catch((err) => console.error('ERROR: DELETE FROM pr_labels failed.', err.stack));
}

module.exports = { pullrequestLabeled, pullrequestUnlabeled, insertIntoPrLabels }
