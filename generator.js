const fs = require("fs");
const GithubAPI = require("./github");

let config = JSON.parse(fs.readFileSync("config.json").toString());

let commitUrl = config.repo;
let repoToken = config.repo_token;
let issueUrl = config.issue_repo;
let issueRepoToken = config.issue_repo_token;
let lastVersionTag = config.last_version_tag;
let commitTitleKey = config.commit_title_key;

let api = new GithubAPI(commitUrl, issueUrl, repoToken, issueRepoToken, lastVersionTag, commitTitleKey);
let content = api.generate();
fs.writeFileSync('changelog.md', content);
