export const INSERT_REPO_STMT = 'INSERT INTO repos (id, owner_login, owner_id, name, full_name, language, forks_count, stargazers_count, watchers_count, subscribers_count, size, has_issues, has_wiki, has_pages, has_downloads, pushed_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE owner_login = ?, owner_id = ?, name = ?, full_name = ?, language = ?, forks_count = ?, stargazers_count = ?, watchers_count = ?, subscribers_count = ?, size = ?, has_issues = ?, has_wiki = ?, has_pages = ?, has_downloads = ?, pushed_at = ?, created_at = ?, updated_at = ?;';
export const INSERT_COMMIT_STMT = 'INSERT INTO commits (sha, repo_id, author_name, author_email, author_date, committer_name, committer_email, committer_date, author_login, author_id, committer_login, committer_id, additions, deletions, total, test_additions, test_deletions, test_changes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE repo_id = ?, author_name = ?, author_email = ?, author_date = ?, committer_name = ?, committer_email = ?, committer_date = ?, author_login = ?, author_id = ?, committer_login = ?, committer_id = ?, additions = ?, deletions = ?, total = ?, test_additions = ?, test_deletions = ?, test_changes = ?;';
export const INSERT_DEFERRED_STMT = 'INSERT INTO deferred (id, action, json) VALUES (?, ?, ?);';
export const SELECT_DEFERRED_STMT = 'SELECT id, json FROM deferred ORDER BY CASE WHEN action = ? THEN 1 WHEN action = ? THEN 2 WHEN action = ? THEN 3 WHEN action = ? THEN 4 WHEN action = ? THEN 5 ELSE 1000 END, action ASC LIMIT ?;';
export const DELETE_DEFERRED_STMT = tasks => `DELETE FROM deferred WHERE ${tasks.map(x => 'id = ?').join(' OR ')};`;
export const SELECT_UNFULFILLED_STMT = 'SELECT COUNT(*) AS unfulfilled FROM deferred;';
export const INCREASE_EXECUTING_STATEMENT = 'INSERT INTO executing (id) VALUES (?);';
export const SELECT_EXECUTING_STATEMENT = 'SELECT COUNT(*) AS executing FROM executing;';
export const DECREASE_EXECUTING_STATEMENT = 'DELETE FROM executing WHERE id = ?;';
