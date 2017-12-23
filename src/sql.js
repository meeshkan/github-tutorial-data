export const INSERT_REPO_STMT = 'INSERT INTO repos (id, owner_login, owner_id, name, full_name, language, forks_count, stargazers_count, watchers_count, subscribers_count, size, has_issues, has_wiki, has_pages, has_downloads, pushed_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE owner_login = ?, owner_id = ?, name = ?, full_name = ?, language = ?, forks_count = ?, stargazers_count = ?, watchers_count = ?, subscribers_count = ?, size = ?, has_issues = ?, has_wiki = ?, has_pages = ?, has_downloads = ?, pushed_at = ?, created_at = ?, updated_at = ?;';
export const INSERT_COMMIT_STMT = 'INSERT INTO commits (sha, repo_id, author_name, author_email, author_date, committer_name, committer_email, committer_date, author_login, author_id, committer_login, committer_id, additions, deletions, total, test_additions, test_deletions, test_changes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE repo_id = ?, author_name = ?, author_email = ?, author_date = ?, committer_name = ?, committer_email = ?, committer_date = ?, author_login = ?, author_id = ?, committer_login = ?, committer_id = ?, additions = ?, deletions = ?, total = ?, test_additions = ?, test_deletions = ?, test_changes = ?;';
export const INSERT_DEFERRED_STMT = 'INSERT INTO deferred (id, action, json) VALUES (?, ?, ?);';
export const SELECT_DEFERRED_STMT = `SELECT id, json FROM deferred ORDER BY RAND(), action ASC LIMIT ?;`;
export const DELETE_DEFERRED_STMT = 'DELETE FROM deferred WHERE id = ?;';
export const SELECT_UNFULFILLED_STMT = 'SELECT COUNT(*) AS unfulfilled FROM deferred;';
export const INCREASE_EXECUTING_STATEMENT = 'INSERT INTO executing (id) VALUES (?);';
export const SELECT_EXECUTING_STATEMENT = 'SELECT COUNT(*) AS executing FROM executing;';
export const DECREASE_EXECUTING_STATEMENT = 'DELETE FROM executing WHERE id = ?;';

//uuid, JSON.stringify(payload), env.GITHUB_TUTORIAL_UNIQUE_ID, timestamp, error ? JSON.stringify(error) : null, deferred ? 1 : 0
export const _GENERIC_LOG_COLUMNS = 'actionId, payload, serverId, timestamp, error, deferred';
export const _GENERIC_LOG_VALUES = '?,?,?,?,?,?';
export const GET_COMMITS_LOG_INSERT_STMT = `INSERT INTO get_commits_log (computationPage,computationCommitCount,computationId,computationOwner,computationRepo,${_GENERIC_LOG_COLUMNS}) VALUES (?,?,?,?,?,${_GENERIC_LOG_VALUES});`;
export const GET_COMMIT_LOG_INSERT_STMT = `INSERT INTO get_commit_log (computationId,computationSHA,computationOwner,computationRepo,${_GENERIC_LOG_COLUMNS}) VALUES (?,?,?,?,${_GENERIC_LOG_VALUES});`;
export const GET_REPOS_LOG_INSERT_STMT = `INSERT INTO get_repos_log (computationSince,computationReposCount,${_GENERIC_LOG_COLUMNS}) VALUES (?,?,${_GENERIC_LOG_VALUES});`;
export const GET_REPO_LOG_INSERT_STMT = `INSERT INTO get_repo_log (computationOwner,computationRepo,${_GENERIC_LOG_COLUMNS}) VALUES (?,?,${_GENERIC_LOG_VALUES});`;
export const GET_LAST_LOG_INSERT_STMT = `INSERT INTO get_last_log (computationId,computationOwner,computationRepo,${_GENERIC_LOG_COLUMNS}) VALUES (?,?,?,${_GENERIC_LOG_VALUES});`;
export const INSERT_END_SCRIPT_ERROR_STMT = 'INSERT INTO end_script_error_log (serverId, error, timestamp) VALUES (?,?,?);';
export const INSERT_SPAWN_SERVER_LOG_STMT = 'INSERT INTO spawn_server_log (serverId, spawnId, timestamp) VALUES (?,?,?);';
export const INSERT_GET_TASKS_STMT = 'INSERT INTO get_tasks_log (serverId, asked, got, timestamp) VALUES (?,?,?,?);'
export const INSERT_GET_TASKS_FAILURE_STMT = 'INSERT INTO get_tasks_failure_log (serverId, error, timestamp) VALUES (?,?,?);'