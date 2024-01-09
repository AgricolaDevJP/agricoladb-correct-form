import { GitHubAppToken } from "@hankei6km/gas-github-app-token";

type Answer = Readonly<{
  ハンドルネーム: string;
  版: string;
  カード番号: string;
  カード名: string;
  修正内容: string;
}>;

function handleSubmit(e: GoogleAppsScript.Events.FormsOnFormSubmit) {
  const itemResponses = e.response.getItemResponses();
  const answer = Object.fromEntries(
    itemResponses.map((itemResponse) => [
      itemResponse.getItem().getTitle(),
      itemResponse.getResponse(),
    ])
  );
  if (!isAnswer(answer)) {
    console.error("Answer Type Error:", answer);
    return;
  }

  const token = getGitHubAppToken();
  const url =
    "https://api.github.com/repos/AgricolaDevJP/agricoladb-server/issues";
  const options = {
    method: "post",
    headers: {
      Authorization: `token ${token}`,
      accept: "application/vnd.github.v3+json",
    },
    payload: JSON.stringify({
      title: `カード情報修正: ${answer.版} [${answer.カード番号}] ${answer.カード名}`,
      body: `
## 対象カード

- **URL**: https://db.agricolajp.dev/${answer.版}/card/${answer.カード番号}/
- **revision**: ${answer.版}
- **literalID**: ${answer.カード番号}
- **nameJa**: ${answer.カード名}

## 修正内容

${answer.修正内容}

---

このissueはAgricolaDBカード情報修正フォーム (https://github.com/AgricolaDevJP/agricoladb-correct-form) により自動生成されました。
`,
      labels: ["カード情報修正"],
    }),
  } as const;
  UrlFetchApp.fetch(url, options);
}

function isAnswer(maybeAnswer): maybeAnswer is Answer {
  return (
    maybeAnswer.ハンドルネーム !== undefined &&
    maybeAnswer.版 !== undefined &&
    maybeAnswer.カード番号 !== undefined &&
    maybeAnswer.カード名 !== undefined &&
    maybeAnswer.修正内容 !== undefined
  );
}

function getGitHubAppToken(): string {
  const props = PropertiesService.getScriptProperties();
  const appId = props.getProperty("appId");
  const installationId = props.getProperty("installationId");
  const privateKey = props.getProperty("privateKey").replaceAll("\\n", "\n");

  const [url, opts] = GitHubAppToken.generate({
    appId,
    installationId,
    privateKey,
  });
  const res = UrlFetchApp.fetch(url, opts);
  const { token } = JSON.parse(res.getContentText());
  return token;
}
