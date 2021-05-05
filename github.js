const fetch = require('sync-fetch');

class GithubAPI {
    urlCommits;
    urlIssues;
    tokenCommits;
    tokenIssues;
    lastVersionTag;
    commitTitleKey;

    constructor(urlCommits, urlIssues, tokenCommits, tokenIssues, lastVersionTag, commitTitleKey) {
        this.urlCommits = urlCommits;
        this.urlIssues = urlIssues;
        this.tokenCommits = tokenCommits;
        this.tokenIssues = tokenIssues;
        this.lastVersionTag = lastVersionTag;
        this.commitTitleKey = commitTitleKey;
    }

    getCommits(tag) {
        let opts = {
            method: "GET"
        }

        if (this.tokenCommits != null) opts["headers"] = {
            Authorization: "token " + this.tokenCommits
        };

        let json = fetch(this.urlCommits + "compare/" + tag + "...develop", opts).json();
        try {
            let commits = json.commits;
            let l = [];

            commits.forEach(c => {
                let commit = c.commit;
                let message = commit.message;
                l.push(message);
            });

            return this.filterIssues(l);
        } catch (UnhandledPromiseRejectionWarning) {
            console.log("Error:", json);
        }
    }

    filterIssues(messages) {
        let list = [];

        messages.forEach(m => {
            if (m.match(new RegExp("^\\[TS-\\D*.*]"))) {
                let split = m.split("\n");
                for (let s in split) {
                    list.push(split[s]);
                }
            }

        });

        return list;
    }

    idOf(m) {
        if (m.startsWith("[" + this.commitTitleKey + "-")) {
            let idx = m.indexOf("]");

            if (idx > 4) {
                let info = m.substring(4, idx);
                return info.replace(/\D*/, "");
            }
        }

        return null;
    }

    type(label) {
        switch (label) {
            case "feature":
            case "bug":
                return true;
            default:
                return false;
        }
    }

    fancyLabel(label) {
        switch (label) {
            case "feature":
                return "# Improvement";
            case "bug":
                return "# Bugfixes";
            default:
                return null;
        }
    }

    sortByLabel(messages) {
        let map = {};

        let size = messages.length;
        let done = 0;
        for (let m of messages) {
            console.log("Process: " + ++done + "/" + size)
            let id = this.idOf(m);
            if (id == null) continue;

            let opts = {
                method: "GET"
            }

            if (this.tokenIssues != null) opts["headers"] = {
                Authorization: "token " + this.tokenIssues
            };

            let json = fetch(this.urlIssues + "issues/" + id, opts).json();

            try {
                let labels = json["labels"];

                let label = labels[0];
                if (this.type(label.name)) {
                    let list = map[label.name];

                    if (list == null) {
                        list = [];
                        map[label.name] = list;
                    }

                    let mIdx = m.indexOf(' ');
                    let final = "* " + m.substring(mIdx + 1, m.length) + " ([#" + this.idOf(m) + "](" + json["html_url"] + "))";

                    list.push(final);
                }
            } catch (UnhandledPromiseRejectionWarning) {
                console.log("Error:", json)
                return;
            }
        }

        return map;
    }

    printMap(map) {
        let body = "";

        let keys = Object.keys(map);

        for (let idx in keys) {
            let label = keys[idx];
            body += this.fancyLabel(label) + "\n";

            let messages = map[label];
            for (let mIdx in messages) {
                body += messages[mIdx] + "\n"
            }
        }

        return body;
    }

    generate() {
        let time = Date.now();
        console.log("Generating changelog...\n")

        let finished = this.getCommits(this.lastVersionTag);
        console.log("Got " + finished.length + " issue(s)\n")

        let map = this.sortByLabel(finished);
        if (map == null) return;

        let body = this.printMap(map);

        console.log("\nYour changelog has been created! (" + (Date.now() - time) / 1000 + "s)")
        return body;
    }
}

module.exports = GithubAPI;
